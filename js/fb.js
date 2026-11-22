/* ─────────────────────────────────────────────
   KUSC 회원 사이트 — Firebase 연결 모음
   화면 코드(js/app.js, diagnostic.html)는 이 파일의 함수만 부릅니다.
   ───────────────────────────────────────────── */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  signOut as fbSignOut, deleteUser, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, getDocs, collection,
  query, orderBy, limit, writeBatch, serverTimestamp, deleteField, increment, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCuAtOUwXhluDEbTxbH0-oEOFnchlWS4A",
  authDomain: "kusc-77206.firebaseapp.com",
  projectId: "kusc-77206",
  storageBucket: "kusc-77206.firebasestorage.app",
  messagingSenderId: "375973146438",
  appId: "1:375973146438:web:a96e99e2d06540f0853f47"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "ko";
setPersistence(auth, browserLocalPersistence).catch(() => {});
const db = getFirestore(app);
const now = () => serverTimestamp();

/* 학회원 명단 문서 이름: 학번_이름 (이름의 띄어쓰기는 뺌) */
export const rosterId = (sid, name) =>
  String(sid || "").replace(/\D/g, "") + "_" + String(name || "").replace(/\s/g, "");

/* ── 로그인 ── */
export const onUser = cb => onAuthStateChanged(auth, cb);
export const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const signInEmail = (e, p) => signInWithEmailAndPassword(auth, e, p);
export const signUpEmail = (e, p) => createUserWithEmailAndPassword(auth, e, p);
export const resetPw = e => sendPasswordResetEmail(auth, e);
export const signOut = () => fbSignOut(auth);

/* ── 공통 ── */
async function list(col, n = 200, field = "createdAt") {
  const s = await getDocs(query(collection(db, col), orderBy(field, "desc"), limit(n)));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}
const add = (col, data) => addDoc(collection(db, col), { ...data, createdAt: now() });
const del = (col, id) => deleteDoc(doc(db, col, id));
const upd = (col, id, patch) => updateDoc(doc(db, col, id), { ...patch, updatedAt: now() });

/* ── 내 정보 ── */
export async function getProfile(uid) {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? s.data() : null;
}
export async function getRole(uid) {          /* 'admin' | 'exec' | null */
  try { const s = await getDoc(doc(db, "admins", uid)); return s.exists() ? (s.data().role || "exec") : null; }
  catch (e) { return null; }
}
export async function getAdmin(uid) {          /* 관리자, 임원진 문서 (이름 포함) */
  try { const s = await getDoc(doc(db, "admins", uid)); return s.exists() ? s.data() : null; } catch (e) { return null; }
}
/* 관리자 계정을 학회원 명단과 회원 정보에서 빼기 (로그인 계정과 관리자 권한은 그대로) */
export async function leaveMembership(uid, rosterId) {
  const b = writeBatch(db);
  if (rosterId) b.delete(doc(db, "roster", rosterId));
  b.delete(doc(db, "users", uid));
  await b.commit();
}
export async function getRoster(id) {
  const s = await getDoc(doc(db, "roster", id));
  return s.exists() ? s.data() : null;
}
/* 학회원 가입: 명단 문서에 내 계정을 걸고 내 정보를 만듦 (한 번에 처리) */
export async function joinMember(uid, rid, data) {
  const b = writeBatch(db);
  b.update(doc(db, "roster", rid), { uid });
  b.set(doc(db, "users", uid), { ...data, role: "member", rosterId: rid, createdAt: now(), updatedAt: now() });
  b.delete(doc(db, "requests", uid));
  await b.commit();
}
export const updateProfile = (uid, patch) => upd("users", uid, patch);
/* 진단 기록: 최신 결과(diag)는 덮어쓰고, 요약은 diagHist에 계속 쌓음.
   처음 저장할 때 예전 결과(1강 진단)가 있으면 그것을 첫 기록으로 함께 넣음 */
export const diagSummary = r => ({ ts: r.ts || "", a: r.a || [], total: r.total || 0, want: r.want || "", fit: r.fit || "",
  items: r.items || [], goals: r.goals || [] });
export const saveDiag = (uid, rec, prev) => {
  const add = [];
  if (prev && prev.diag && !(prev.diagHist && prev.diagHist.length)) add.push(diagSummary(prev.diag));
  add.push(diagSummary(rec));
  return updateDoc(doc(db, "users", uid), { diag: rec, diagAt: rec.ts || new Date().toISOString(), diagHist: arrayUnion(...add),
    diagFrom: deleteField(), updatedAt: now() });
};
/* 마스터의 테스트 공간: 진단과 목표 기록을 학회원 데이터와 섞지 않고 따로 저장 */
export async function getLab(uid) { const s = await getDoc(doc(db, "lab", uid)); return s.exists() ? s.data() : null; }
export const setLab = (uid, patch) => setDoc(doc(db, "lab", uid), { ...patch, updatedAt: now() }, { merge: true });
export const saveLabDiag = (uid, rec) => setDoc(doc(db, "lab", uid),
  { diag: rec, diagAt: rec.ts || new Date().toISOString(), diagHist: arrayUnion(diagSummary(rec)), updatedAt: now() }, { merge: true });
/* 예전 결과만 있고 기록이 없을 때, 그 결과를 첫 기록으로 만듦 (목표 포함) */
export const initDiagHist = (uid, first) => updateDoc(doc(db, "users", uid), { diagHist: [diagSummary(first)], updatedAt: now() });
export const markProgress = (uid, key) =>
  updateDoc(doc(db, "users", uid), { ["progress." + key]: new Date().toISOString() });
/* 탈퇴: 명단 연결을 풀고 내 정보를 지운 뒤 로그인 계정을 삭제 */
export async function deleteMe(user, profile) {
  const b = writeBatch(db);
  if (profile && profile.rosterId) b.update(doc(db, "roster", profile.rosterId), { uid: null });
  if (profile) b.delete(doc(db, "users", user.uid));
  await b.commit();
  await deleteUser(user);
}

/* ── 가입 요청 (명단에 아직 없는 새 학회원) ── */
export const getMyRequest = async uid => { const s = await getDoc(doc(db, "requests", uid)); return s.exists() ? s.data() : null; };
export const submitRequest = (uid, data) => setDoc(doc(db, "requests", uid), { ...data, uid, createdAt: now() });
export const listRequests = () => list("requests");
export const deleteRequest = uid => del("requests", uid);

/* ── 공지 · 일정 · 재정 · 회의록 ── */
export const listNotices = () => list("notices");
export const addNotice = d => add("notices", d);
export const deleteNotice = id => del("notices", id);

export const listEvents = () => list("events", 100, "date");
export const addEvent = d => add("events", d);
export const deleteEvent = id => del("events", id);
export const setRsvp = (eid, uid, d) => setDoc(doc(db, "events", eid, "rsvp", uid), { ...d, at: now() });
export async function listRsvp(eid) {
  const s = await getDocs(collection(db, "events", eid, "rsvp"));
  return s.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export const listLedger = () => list("ledger", 300, "date");
export const addLedger = d => add("ledger", d);
export const deleteLedger = id => del("ledger", id);

export const listMinutes = () => list("minutes", 200, "date");
export const addMinute = d => add("minutes", d);
export const deleteMinute = id => del("minutes", id);

/* ── 커리큘럼 피드백 ──
   feedback/{자동}        : 응답 내용과 응답자. 관리자만 읽음 (임원진 비공개)
   feedbackDone/{uid_학기} : 냈는지 여부. 한 사람이 한 학기에 한 번만 낼 수 있게 함 */
export const getFeedbackDone = async (uid, term) => (await getDoc(doc(db, "feedbackDone", uid + "_" + term))).exists();
export async function submitFeedback(uid, term, answers, who) {
  const b = writeBatch(db);
  b.set(doc(db, "feedbackDone", uid + "_" + term), { term });
  b.set(doc(collection(db, "feedback")), { term, answers, uid, name: who.name || "", sid: who.sid || "", createdAt: now() });
  await b.commit();
}
/* 응답 지우기 (관리자): 응답, 낸 기록, 들은 강의 기록을 함께 지워서 다시 낼 수 있게 함 */
export async function deleteFeedback(id, uid, term) {
  const b = writeBatch(db);
  b.delete(doc(db, "feedback", id));
  if (uid) b.delete(doc(db, "feedbackDone", uid + "_" + term));
  await b.commit();
  if (uid) { try { await deleteDoc(doc(db, "attendance", uid)); } catch (e) {} }
}
export async function listFeedback(term) { return (await list("feedback", 1000)).filter(x => x.term === term); }
export async function listFeedbackDone(term) {
  const s = await getDocs(collection(db, "feedbackDone"));
  return s.docs.filter(d => d.data().term === term).map(d => d.id.split("_")[0]);
}

/* ── 설정 (사진 열쇠 등, 학회원만 읽고 관리자만 씀) ── */
export async function getConfig(id) { const s = await getDoc(doc(db, "config", id)); return s.exists() ? s.data() : null; }
export const setConfig = (id, data) => setDoc(doc(db, "config", id), { ...data, updatedAt: now() });

/* ── 이번 학기 들은 강의 (본인과 관리자만 읽음) ── */
export async function getAttendance(uid) { const s = await getDoc(doc(db, "attendance", uid)); return s.exists() ? s.data() : null; }
export const setAttendance = (uid, term, lectures) => setDoc(doc(db, "attendance", uid), { [term]: lectures, updatedAt: now() }, { merge: true });

/* ── 커뮤니티 ── */
export const listPosts = () => list("posts", 300);
export async function getPost(id) { const s = await getDoc(doc(db, "posts", id)); return s.exists() ? { id, ...s.data() } : null; }
export const addPost = d => add("posts", { ...d, comments: 0 });
export const updatePost = (id, patch) => upd("posts", id, patch);
export const deletePost = id => del("posts", id);
export async function listComments(pid) {
  const s = await getDocs(query(collection(db, "posts", pid, "comments"), orderBy("createdAt", "asc"), limit(300)));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addComment(pid, d) {
  const b = writeBatch(db);
  b.set(doc(collection(db, "posts", pid, "comments")), { ...d, createdAt: now() });
  b.update(doc(db, "posts", pid), { comments: increment(1) });
  await b.commit();
}
export async function deleteComment(pid, cid) {
  const b = writeBatch(db);
  b.delete(doc(db, "posts", pid, "comments", cid));
  b.update(doc(db, "posts", pid), { comments: increment(-1) });
  await b.commit();
}

/* ── 임원진 ── */
export async function listUsers() {
  const s = await getDocs(collection(db, "users"));
  return s.docs.map(d => ({ uid: d.id, ...d.data() }));
}
export async function listRoster() {
  const s = await getDocs(collection(db, "roster"));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function listAdmins() {
  const s = await getDocs(collection(db, "admins"));
  return s.docs.map(d => ({ uid: d.id, ...d.data() }));
}
export const setUserFields = (uid, patch) => upd("users", uid, patch);
export const setDues = (uid, term, paid) => updateDoc(doc(db, "users", uid), { ["dues." + term]: paid ? new Date().toISOString() : deleteField() });
export const setRole = (uid, name, role) => role ? setDoc(doc(db, "admins", uid), { role, name }) : deleteDoc(doc(db, "admins", uid));
const ROSTER_KEYS = ["phone", "grade", "age", "gender", "major", "major2", "jobs", "stage", "diag", "note"];
/* 명단 올리기: 이미 있는 사람은 계정 연결(uid)을 유지한 채 정보만 덮어씀 */
export async function importRoster(entries) {
  let n = 0;
  for (let i = 0; i < entries.length; i += 400) {
    const b = writeBatch(db);
    for (const e of entries.slice(i, i + 400)) {
      const id = rosterId(e.sid, e.name);
      if (!/^\d{6,}_.+/.test(id)) continue;
      const d = { name: String(e.name).replace(/\s/g, ""), sid: String(e.sid).replace(/\D/g, ""), updatedAt: now() };
      ROSTER_KEYS.forEach(k => { if (e[k] !== undefined && e[k] !== "" && e[k] !== null) d[k] = e[k]; });
      b.set(doc(db, "roster", id), d, { merge: true });
      n++;
    }
    await b.commit();
  }
  return n;
}
export const deleteRoster = id => del("roster", id);
