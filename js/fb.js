/* ─────────────────────────────────────────────
   KUSC 회원 기능 — Firebase 연결 모음
   화면 코드는 이 파일의 함수만 부릅니다.
   ───────────────────────────────────────────── */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  signOut as fbSignOut, deleteUser, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, getDocs, collection,
  writeBatch, serverTimestamp, deleteField
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

/* ── 내 정보 ── */
export async function getProfile(uid) {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? s.data() : null;
}
export async function getRoster(id) {
  const s = await getDoc(doc(db, "roster", id));
  return s.exists() ? s.data() : null;
}
export async function isAdmin(uid) {
  try { return (await getDoc(doc(db, "admins", uid))).exists(); } catch (e) { return false; }
}

/* 가입: 일반 회원 */
export async function createGeneral(uid, data) {
  await setDoc(doc(db, "users", uid), {
    ...data, role: "general", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
}

/* 학회원 확인: 명단 문서에 내 uid를 걸고, 내 정보의 등급을 member로 (한 번에 처리) */
export async function claimMember(uid, id, data, isNew) {
  const b = writeBatch(db);
  b.update(doc(db, "roster", id), { uid });
  const base = { ...data, role: "member", rosterId: id, updatedAt: serverTimestamp() };
  if (isNew) b.set(doc(db, "users", uid), { ...base, createdAt: serverTimestamp() });
  else b.update(doc(db, "users", uid), base);
  await b.commit();
}

export const updateProfile = (uid, patch) =>
  updateDoc(doc(db, "users", uid), { ...patch, updatedAt: serverTimestamp() });

export const saveDiag = (uid, rec) =>
  updateDoc(doc(db, "users", uid), { diag: rec, diagAt: rec.ts || new Date().toISOString(), diagFrom: deleteField(), updatedAt: serverTimestamp() });

export const markProgress = (uid, key) =>
  updateDoc(doc(db, "users", uid), { ["progress." + key]: new Date().toISOString() });

/* 탈퇴: 명단 연결을 풀고 내 정보를 지운 뒤 로그인 계정을 삭제 */
export async function deleteMe(user, profile) {
  const b = writeBatch(db);
  if (profile && profile.role === "member" && profile.rosterId)
    b.update(doc(db, "roster", profile.rosterId), { uid: null });
  b.delete(doc(db, "users", user.uid));
  await b.commit();
  await deleteUser(user);
}

/* ── 운영진 ── */
export async function listUsers() {
  const s = await getDocs(collection(db, "users"));
  return s.docs.map(d => ({ uid: d.id, ...d.data() }));
}
export async function listRoster() {
  const s = await getDocs(collection(db, "roster"));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}
/* 명단 올리기: 이미 있는 사람은 연결(uid)을 유지한 채 정보만 덮어씀 */
export async function importRoster(entries) {
  let n = 0;
  for (let i = 0; i < entries.length; i += 400) {
    const b = writeBatch(db);
    for (const e of entries.slice(i, i + 400)) {
      const id = rosterId(e.sid, e.name);
      if (!/^\d{6,}_.+/.test(id)) continue;
      const d = { name: String(e.name).replace(/\s/g, ""), sid: String(e.sid).replace(/\D/g, "") };
      if (e.grade) d.grade = e.grade;
      if (e.major) d.major = e.major;
      if (e.diag) d.diag = e.diag;
      b.set(doc(db, "roster", id), d, { merge: true });
      n++;
    }
    await b.commit();
  }
  return n;
}
export const releaseRoster = id => updateDoc(doc(db, "roster", id), { uid: null });
export const removeField = (uid, f) => updateDoc(doc(db, "users", uid), { [f]: deleteField() });
