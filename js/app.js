/* ─────────────────────────────────────────────
   KUSC 회원 사이트 — 화면
   데이터는 js/fb.js 를 통해서만 읽고 씁니다.
   ───────────────────────────────────────────── */
import * as FB from "./fb.js";
/* 마스터 보기: 다른 학회원의 화면을 그대로 보되, 아무것도 바꾸지 못하게 쓰기 함수를 막음 */
const WRITES = new Set(["updateProfile","saveDiag","markProgress","deleteMe","submitRequest","deleteRequest","joinMember","setRsvp",
  "addPost","updatePost","deletePost","addComment","deleteComment","submitFeedback","setAttendance","setGoalTrack"]);
const F = new Proxy(FB, { get(t, k){
  if(WRITES.has(k) && typeof S!=="undefined" && S.prof && S.prof.viewAs && !inExec()) return async()=>{ throw {code:"view-only"}; };
  return t[k]; } });
import { SURVEY, rowsOf, optsOf, allQs, shown, allRows } from "./survey.js";

/* ───────── 고정 값 (학기마다 여기만 고치면 됨) ───────── */
/* 임원진 공간은 admin.html 에서만 열림 (학회원 사이트에는 입구가 없음) */
const MODE = window.KUSC_MODE === "exec" ? "exec" : "site";
const ENDPOINT = "https://script.google.com/macros/s/AKfycbzr2-vwdBV4v7U6qliXPlFWWu0Mo9S7tC7_70xqGdqeCd0wPDmUB52FyB7xB510o-oT/exec";
/* 가입과 가입 요청 기록 사본 (실패해도 가입에는 영향 없음) */
function sheetLog(kind, d){
  try{ fetch(ENDPOINT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify({type:"site",kind,name:d.name||"",sid:d.sid||"",phone:d.phone||"",grade:d.grade||"",age:d.age||"",gender:d.gender||"",
      major:d.major||"",major2:d.major2||"",jobs:d.jobs||[],stage:d.stage||"",email:d.email||"",msg:d.msg||""})}).catch(()=>{}); }catch(e){}
}
const TERM = "2026-2", TERM_LABEL = "2026년 2학기", DUES = "15,000원";
const JOBS = ["IB","PE","VC","컨설팅","전략기획","PM"];
const GRADES = ["1학년","2학년","3학년","4학년","초과학기·졸업유예","졸업생","대학원"];
const STAGES = ["이제 알아보는 중","준비를 시작함","지원 중이거나 곧 지원"];
const GENDERS = ["남","여","응답 안 함"];
const JOBNAME = {IB:"IB",PE:"PE",VC:"VC",CONS:"컨설팅",BIZ:"전략기획",PM:"PM",NONE:"아직 없음"};
const AXES = ["구조화","수치화","가설 수립","정보 탐색","커뮤니케이션","실행 지구력"];
const BOARDS = ["자유","질문","스터디·모임","정보 공유","합격 후기"];
const NOTICE_TAGS = ["공지","행사","정산"];
const FILES = [
  {n:"국문 이력서 양식", s:"Word · 빈 양식", ext:"DOC", href:"files/KUSC_KR_resume_form.docx", save:"국문_이력서_양식.docx"},
  {n:"국문 이력서 작성 요령", s:"PDF · 3쪽", ext:"PDF", href:"files/KUSC_KR_resume_guide.pdf"},
  {n:"영문 레쥬메 양식", s:"Word · 빈 양식", ext:"DOC", href:"files/KUSC_EN_resume_form.docx", save:"영문_레쥬메_양식.docx"},
  {n:"영문 레쥬메 작성 요령", s:"PDF · 4쪽", ext:"PDF", href:"files/KUSC_EN_resume_guide.pdf"}
];

/* ───────── 상태 ───────── */
const S = {user:null, prof:null, role:null, req:null, ready:false, auth:"login", msg:"", join:null, me:null, cache:{}};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const app = $("#app");
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nl = s => esc(s).replace(/\n/g,"<br>");
/* 운영실은 같은 사이트 안의 #exec 화면. 임원진, 관리자 계정에만 입구가 보이고 열림 */
const inExec = () => MODE==="exec" || route().r==="exec";
const route = () => { const h=(location.hash||"").slice(1); const [r,arg]=h.split("/"); return {r:r||"main", arg:arg?decodeURIComponent(arg):""}; };
const toD = x => x&&x.toDate ? x.toDate() : (x ? new Date(x) : null);
const day = x => { const d=toD(x); return d&&!isNaN(d) ? `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}` : ""; };
const ymd = s => { if(!s) return ""; const [y,m,d]=String(s).split("-"); const w="일월화수목금토"[new Date(+y,+m-1,+d).getDay()]; return `${+m}월 ${+d}일(${w})`; };
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const won = n => (Number(n)||0).toLocaleString("ko-KR")+"원";
const isExec = () => !!S.role && (inExec() || !(S.prof && S.prof.viewAs));   /* 마스터 보기 중에는 그 학회원과 똑같이 보이게 */
const isMember = () => !!S.prof;
/* 진단 링크: 마스터 보기 중에는 그 학회원의 결과만 보고, 새로 진단하지 않음 */
const diagHref = mode => (S.prof && S.prof.viewAs) ? (mode==="view" ? `diagnostic.html?view=mine&as=${S.prof.viewAs}` : `diagnostic.html?from=app&preview=${encodeURIComponent(S.prof.viewAs)}`) : (mode==="view" ? "diagnostic.html?view=mine" : "diagnostic.html?from=app");
const myUid = () => (S.prof && S.prof.viewAs) || (S.user && S.user.uid);
const myName = () => inExec() ? (S.myName || "운영진") : (S.prof&&S.prof.name) || (S.user&&S.user.displayName) || "운영진";

/* ───────── 문장마다 줄바꿈 ─────────
   화면의 설명 문단(p)에서 마침표, 물음표, 느낌표 뒤에 오는 문장은 항상 새 줄에서 시작하게 함.
   학회원이 쓴 글(.body)과 입력칸은 건드리지 않음 */
function breakSentences(root){
  root.querySelectorAll("p:not(.body)").forEach(p=>{
    const w=document.createTreeWalker(p, NodeFilter.SHOW_TEXT), hits=[];
    while(w.nextNode()){ const t=w.currentNode; if(!t.parentElement.closest(".body,textarea,input,a.btn,button") && /[.!?]\s+\S/.test(t.nodeValue)) hits.push(t); }
    hits.forEach(t=>{ const parts=t.nodeValue.split(/(?<=[.!?])\s+(?=\S)/); const f=document.createDocumentFragment();
      parts.forEach((x,i)=>{ if(i) f.appendChild(document.createElement("br")); f.appendChild(document.createTextNode(x)); }); t.replaceWith(f); });
  });
}
new MutationObserver(()=>breakSentences(app)).observe(app,{childList:true,subtree:true});

/* ───────── 공통 조각 ───────── */
function header(title, lead){
  const {r} = route();
  if(inExec()) return `<div class="top"><a class="brand" href="#exec" aria-label="KUSC 운영실"><b>KUSC</b><span>운영실</span></a>
    <nav class="tabs" aria-label="메뉴"><a href="${MODE==="exec"?"./#home":"#home"}">학회원 사이트로</a>${S.user?`<a href="#" data-out>로그아웃</a>`:""}</nav></div>
    ${title?`<h1>${title}</h1>`:""}${lead?`<p class="lead">${lead}</p>`:""}`;
  const on = k => (r===k || (k==="board"&&r==="post") || (k==="class"&&(r==="l3"||r==="feedback"))||(k==="home"&&r==="growth")) ? "on" : "";
  const tabs = isMember() ? `<nav class="tabs" aria-label="메뉴">
    ${isMember()?`<a href="#home" class="${on("home")}">내 공간</a><a href="#class" class="${on("class")}">강의실</a>
    <a href="#news" class="${on("news")}">소식</a><a href="#board" class="${on("board")}">커뮤니티</a>
    <a href="#me" class="${on("me")}">내 정보</a>${S.role?`<a href="#exec" class="${on("exec")}">운영실</a>`:""}`:""}</nav>` : "";
  return viewAsBar()+`<div class="top"><a class="brand" href="#" aria-label="KUSC 홈페이지"><b>KUSC</b><span>건국대학교 경영대학 전략학회</span></a>${tabs}</div>
    ${title?`<h1>${title}</h1>`:""}${lead?`<p class="lead">${lead}</p>`:""}`;
}
const foot = () => `<p class="foot">KUSC 전략 직무 진출 커리큘럼 · Jason Baek</p>`;
const tbu = (t, d) => `<div class="tbu"><span class="badge">TBU</span><b>${t}</b><small>${d}</small></div>`;
function showErr(m, id="err"){ const e=$("#"+id); if(e){ e.textContent=m; e.style.display="block"; } }
function chips(key, list, multi, obj){
  const v = obj[key];
  return `<div class="chips" role="${multi?"group":"radiogroup"}">${list.map(o=>{
    const on = multi ? (v||[]).includes(o) : v===o;
    return `<span class="chip ${on?"on":""}" tabindex="0" role="${multi?"checkbox":"radio"}" aria-checked="${on}" data-k="${key}" data-v="${esc(o)}" data-m="${multi?1:0}">${esc(o)}</span>`;}).join("")}</div>`;
}
function bindChips(obj, after){
  $$(".chip[data-k]").forEach(c=>{
    const act=()=>{ const k=c.dataset.k, v=c.dataset.v;
      if(c.dataset.m==="1"){ const a=obj[k]=Array.isArray(obj[k])?obj[k]:[]; const i=a.indexOf(v); i>-1?a.splice(i,1):a.push(v);
        if(v==="아직 모르겠다"&&i===-1) obj[k]=["아직 모르겠다"]; else if(v!=="아직 모르겠다") obj[k]=obj[k].filter(x=>x!=="아직 모르겠다"); }
      else obj[k]=v;
      after(); };
    c.onclick=act; c.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); act(); } };
  });
}
const field = (id,label,val,opt={}) => `<div class="field"><label class="l" for="${id}">${label}${opt.req?'<span class="req">*</span>':""}${opt.opt?`<span class="opt">${opt.opt}</span>`:""}</label>
  ${opt.area?`<textarea id="${id}" rows="${opt.rows||5}" placeholder="${esc(opt.ph||"")}">${esc(val)}</textarea>`
  :`<input type="${opt.type||"text"}" id="${id}" ${opt.num?'inputmode="numeric"':""} ${opt.ro?"readonly":""} placeholder="${esc(opt.ph||"")}" value="${esc(val)}">`}
  ${opt.hint?`<p class="hint">${opt.hint}</p>`:""}</div>`;
const val = id => { const e=$("#"+id); return e ? e.value.trim() : ""; };
const fmtPhone = p => { const d=String(p||"").replace(/\D/g,""); return d.replace(/^(\d{3})(\d{3,4})(\d{4})$/,"$1-$2-$3"); };
function authMsg(e){
  const c = (e && e.code) || "";
  return ({
    "auth/invalid-email":"이메일 형식을 확인해 주세요",
    "auth/missing-password":"비밀번호를 입력해 주세요",
    "auth/weak-password":"비밀번호는 6자 이상이어야 해요",
    "auth/email-already-in-use":"이미 가입된 이메일이에요. '로그인'으로 들어와 주세요",
    "auth/invalid-credential":"이메일 또는 비밀번호가 맞지 않아요",
    "auth/wrong-password":"이메일 또는 비밀번호가 맞지 않아요",
    "auth/user-not-found":"가입되지 않은 이메일이에요",
    "auth/too-many-requests":"시도가 너무 많아요. 잠시 후 다시 해 주세요",
    "auth/popup-closed-by-user":"로그인 창이 닫혔어요. 다시 눌러 주세요",
    "auth/cancelled-popup-request":"로그인 창이 닫혔어요. 다시 눌러 주세요",
    "auth/popup-blocked":"팝업이 막혔어요. 팝업을 허용하거나 이메일로 로그인해 주세요",
    "auth/network-request-failed":"네트워크가 불안정해요. 잠시 후 다시 해 주세요",
    "auth/requires-recent-login":"보안을 위해 로그아웃 후 다시 로그인한 뒤 시도해 주세요",
    "auth/unauthorized-domain":"이 주소에서는 로그인이 아직 허용되지 않았어요. 임원진에게 알려주세요",
    "permission-denied":"권한이 없어요. 임원진에게 알려주세요",
    "view-only":"마스터 보기에서는 아무것도 바꾸지 않아요. 화면만 볼 수 있어요"
  })[c] || "문제가 생겼어요. 잠시 후 다시 해 주세요" + (c?` (${c})`:"");
}
const inApp = /KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line\//i.test(navigator.userAgent);
async function load(key, fn, force){ if(force||!S.cache[key]) S.cache[key]=await fn(); return S.cache[key]; }
const drop = (...keys) => keys.forEach(k=>delete S.cache[k]);
function hexSVG(a){
  const cx=150, cy=130, R=96, max=50, pt=(i,v)=>{ const ang=-Math.PI/2+i*Math.PI/3; return [cx+Math.cos(ang)*R*v, cy+Math.sin(ang)*R*v]; };
  const P=(i,v)=>pt(i,v).map(n=>n.toFixed(1)).join(",");
  const ring=f=>AXES.map((_,i)=>P(i,f)).join(" ");
  const k=v=>Math.max(.04,Math.min(1,v/max));
  return `<svg class="hex" viewBox="0 0 300 260" role="img" aria-label="역량 육각형">
    ${[1,.66,.33].map(f=>`<polygon points="${ring(f)}" fill="none" stroke="var(--line)" stroke-width="1.5"/>`).join("")}
    <polygon points="${a.map((v,i)=>P(i,k(v))).join(" ")}" fill="var(--ku-soft)" stroke="var(--ku)" stroke-width="3" stroke-linejoin="round"/>
    ${a.map((v,i)=>{ const [x,y]=pt(i,k(v)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="var(--ku)"/>`; }).join("")}
    ${AXES.map((t,i)=>{ const [x,y]=pt(i,1.24); return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle">${t}</text>`; }).join("")}</svg>`;
}

/* 처음(점선)과 지금(초록)을 겹쳐 그린 육각형 */
function hexCmp(a0,a1){
  const cx=150, cy=130, R=96, max=50, pt=(i,v)=>{ const ang=-Math.PI/2+i*Math.PI/3; return [cx+Math.cos(ang)*R*v, cy+Math.sin(ang)*R*v]; };
  const P=(i,v)=>pt(i,v).map(n=>n.toFixed(1)).join(","), k=v=>Math.max(.04,Math.min(1,v/max));
  const ring=f=>AXES.map((_,i)=>P(i,f)).join(" ");
  return `<svg class="hex" viewBox="0 0 300 260" role="img" aria-label="처음과 지금의 역량 육각형 비교">
    ${[1,.66,.33].map(f=>`<polygon points="${ring(f)}" fill="none" stroke="var(--line)" stroke-width="1.5"/>`).join("")}
    <polygon points="${a0.map((v,i)=>P(i,k(v))).join(" ")}" fill="none" stroke="var(--mute)" stroke-width="2.5" stroke-dasharray="6 5" stroke-linejoin="round"/>
    <polygon points="${a1.map((v,i)=>P(i,k(v))).join(" ")}" fill="var(--ku-soft)" stroke="var(--ku)" stroke-width="3" stroke-linejoin="round"/>
    ${AXES.map((t,i)=>{ const [x,y]=pt(i,1.24); return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle">${t}</text>`; }).join("")}</svg>`;
}

/* ───────── 학회 소개 (11/3 임원진 회의에서 정한 것 + 아직 정할 것) ───────── */
function aboutBody(){
  return `
  <section class="card">
    <div class="lesson">정체성</div>
    <h2 style="margin-top:4px">여섯 전략 직무로 가는 학부생이 모이는 학회</h2>
    <p class="desc">KUSC는 전략적 사고 훈련에 머물지 않고, 아래 여섯 직무를 희망하는 학생이 함께 준비하는 학회예요.</p>
    <div class="meta">${JOBS.map(j=>`<span>${j}</span>`).join("")}</div>
  </section>
  <div class="grid">
    <section class="card">
      <div class="lesson">운영 방식</div>
      <h3 style="margin-top:6px">소수 정예 + 열린 행사</h3>
      <p class="desc">학회원은 진출 의지가 분명한 사람을 서류와 면접으로 뽑아요. 대신 학기마다 두 번 안팎, 모든 학우에게 열린 공개 행사를 열어요.</p>
    </section>
    <section class="card">
      <div class="lesson">비전</div>
      <h3 style="margin-top:6px">별들이 다시 연사로</h3>
      <p class="desc">여기서 경험을 쌓고, 원하는 직무로 나아가고, 그렇게 나간 선배가 다시 연사로 돌아와 후배를 이끄는 학회를 만들어요.</p>
    </section>
  </div>
  <section class="card">
    <div class="lesson">아직 정하는 중</div>
    <h3 style="margin-top:6px">임원진이 정리하고 있어요</h3>
    <div class="tbus">
      ${tbu("우리가 말하는 '전략'의 정의","임원진 논의 후 공개")}
      ${tbu("조직과 역할 (R&R)","업무 목록을 바탕으로 직책과 정원을 다시 정하는 중")}
      ${tbu("활동과 수료 기준","회비 납부, 최소 참여 횟수, 미충족 시 기준")}
      ${tbu("다음 학기 모집 안내","선발 절차와 일정")}
      ${tbu("선배 네트워크와 홈커밍","선배, 교수님, 학회원이 만나는 정기 자리")}
    </div>
  </section>`;
}
function viewAbout(){
  app.innerHTML = header("학회 소개","")+aboutBody()+(S.user?"":`<div class="row"><a class="btn pri" href="#">로그인 화면으로</a></div>`)+foot();
}

/* ───────── 첫 화면: 학회 홈페이지 ───────── */
const LAND_JOBS = [
  ["IB","IB","기업의 인수, 상장, 자금 조달 같은 큰 거래를 설계하고 성사시켜요"],
  ["PE","PE","회사를 인수해 가치를 키운 뒤 다시 팔아 수익을 내요"],
  ["VC","VC","될 만한 초기 스타트업을 골라 투자하고 함께 키워요"],
  ["CS","컨설팅","기업이 가장 풀기 어려운 문제를 쪼개서 답을 내요"],
  ["BP","전략기획","회사 안에서 다음 사업과 나아갈 방향을 정해요"],
  ["PM","PM","고객의 문제를 풀 제품을 정의하고 끝까지 만들어 내요"]
];
const LAND_DO = [
  ["session","정기 세션","학기마다 여덟 번, 두 시간씩 모여요. 전략경영 이론과 분석 틀을 실제 기업 사례에 적용해 봐요."],
  ["case","케이스 스터디","지도교수님과 함께 문제를 정의하는 법과 분석의 관점을 배우고, 팀별 워크숍으로 바로 써 봐요."],
  ["team","팀 프로젝트","한 기업이나 산업을 골라 핵심 이슈를 찾고, 자료 조사부터 전략 제안까지 팀이 직접 끝까지 가요."],
  ["pitch","산학협력 발표","학기 끝에는 연계 기업 실무진 앞에서 최종 결과를 발표하고, 평가와 피드백을 받아요."],
  ["union","연합 세션","다른 학교 전략학회와 케이스 분석과 전략 제안을 나누고 교류해요."],
  ["talk","선배와 현직자 강연","전략 직무 선배와 현직자를 모셔 직무의 실제와 커리어 길을 직접 들어요."]
];
const LAND_YEAR = [
  ["8월 말","모집","진출 의지가 분명한 학생을 서류와 면접으로 뽑아요."],
  ["9월 초","오리엔테이션","한 학기 커리큘럼과 학회칙, 수료 기준을 함께 확인해요."],
  ["9월 ~ 11월","정기 세션과 강연","이론 적용, 케이스 스터디, 선배와 현직자 강연이 이어져요. 사이사이 팀 프로젝트를 진행해요."],
  ["11월","연합 세션","다른 학교 전략학회와 만나 서로의 분석을 나눠요."],
  ["12월","산학협력 최종 발표","기업 실무진 앞에서 발표하고, 기준을 채운 학회원은 학장 명의 수료증을 받아요."]
];
const LAND_STEPS = [
  ["정의하기","여섯 직무를 해부하고, 일상 상황 17개로 각자의 역량 모양을 그렸어요."],
  ["구조화하기","회사가 클 때마다 어떤 직무가 왜 필요해지는지 시뮬레이션으로 따라갔어요."],
  ["검증하기","여섯 직무의 현직자를 한자리에 모셔 진출 경로와 실제 하루를 들었어요. 경영대학과 함께 연 공개 행사였어요."],
  ["진입하기","공고 읽기부터 이력서, 레쥬메, 자소서, 인터뷰까지 서류를 준비했어요."]
];
const LAND_ROLES = [
  ["학회장","운영 방향과 정기 세션 기획, 대외 소통과 지도교수님 협의를 맡아요"],
  ["부학회장","학회장을 도와 운영 전반에 참여하고, 운영진과 학회원 사이를 이어 줘요"],
  ["총무","회비를 걷고 학회 재정과 정산을 맡아요. 출결과 수료 기준도 함께 챙겨요"],
  ["디자인","홍보물과 발표 자료 등 학회의 얼굴을 만들어요"],
  ["대외협력","기업과 현직자를 잇고 커리큘럼을 함께 논의해요"],
  ["지도교수","케이스 스터디를 이끌고, 학기 말 발표를 평가하고 피드백해요"]
];
const ICON = {
  session:`<path d="M6 9h20v14H6z"/><path d="M11 5v6M21 5v6M6 14h20"/>`,
  case:`<circle cx="14" cy="14" r="7"/><path d="M19.5 19.5L26 26"/>`,
  team:`<circle cx="11" cy="11" r="4"/><circle cx="22" cy="12" r="3"/><path d="M4 25c1-5 4-7 7-7s6 2 7 7M18 24c.6-3.4 2.4-5 4-5s3.4 1.6 4 5"/>`,
  pitch:`<path d="M5 6h22v14H5zM16 20v6M11 26h10"/><path d="M10 16l4-4 3 3 5-5"/>`,
  union:`<circle cx="11" cy="16" r="6"/><circle cx="21" cy="16" r="6"/>`,
  talk:`<path d="M5 7h17v11H12l-5 4v-4H5z"/><path d="M25 12h2v10h-2v3l-4-3h-6"/>`
};
const icon = k => `<svg class="lic" viewBox="0 0 32 32" aria-hidden="true">${ICON[k]}</svg>`;
function landDeck(){
  return `<svg class="ldeck" viewBox="0 0 640 420" role="img" aria-label="팀 프로젝트에서 만드는 전략 제안 장표 예시">
    <g class="sl back"><rect x="110" y="70" width="440" height="290" rx="18"/></g>
    <g class="sl mid"><rect x="96" y="62" width="452" height="296" rx="18"/></g>
    <g class="sl front">
      <rect x="80" y="54" width="480" height="318" rx="18"/>
      <rect x="80" y="54" width="480" height="62" rx="18" class="tb"/><rect x="80" y="96" width="480" height="20" class="tb"/>
      <text x="108" y="92" class="t1">가상의 기업 A, 다음 3년의 성장 전략</text>
      <text x="108" y="148" class="t2">시장별 매출 성장률 (%)</text>
      ${[[118,40],[160,64],[202,90],[244,116],[286,142]].map(([x,h])=>[x,310-h,h]).map(([x,y,h],i)=>`<rect x="${x}" y="${y}" width="28" height="${h}" rx="5" class="bar ${i===4?"hi":""}" style="--i:${i}"/>`).join("")}
      <line x1="108" y1="311" x2="326" y2="311" class="ax"/>
      <text x="360" y="148" class="t2">우선순위 판단</text>
      <rect x="360" y="160" width="172" height="152" rx="10" class="mx"/>
      <line x1="446" y1="160" x2="446" y2="312" class="ax"/><line x1="360" y1="236" x2="532" y2="236" class="ax"/>
      <circle cx="492" cy="190" r="13" class="pt hi"/><circle cx="408" cy="200" r="9" class="pt"/><circle cx="478" cy="270" r="8" class="pt"/><circle cx="396" cy="282" r="6" class="pt"/>
      <rect x="108" y="334" width="250" height="10" rx="5" class="ln"/><rect x="108" y="350" width="170" height="10" rx="5" class="ln"/>
      <rect x="440" y="330" width="92" height="28" rx="14" class="tag"/><text x="486" y="349" text-anchor="middle" class="t3">핵심 제안</text>
    </g>
  </svg>`;
}
function landHex(){
  const cx=260, cy=230, R=170, pt=(i,v)=>{ const a=-Math.PI/2+i*Math.PI/3; return [cx+Math.cos(a)*R*v, cy+Math.sin(a)*R*v]; };
  const P=(i,v)=>pt(i,v).map(n=>n.toFixed(1)).join(",");
  const me=[.88,.62,.76,.82,.7,.55];
  return `<svg class="lhex" viewBox="0 0 520 470" role="img" aria-label="여섯 역량으로 그린 역량 육각형 예시">
    ${[1,.75,.5,.25].map(f=>`<polygon points="${AXES.map((_,i)=>P(i,f)).join(" ")}" class="ring"/>`).join("")}
    ${AXES.map((_,i)=>`<line x1="${cx}" y1="${cy}" x2="${pt(i,1)[0].toFixed(1)}" y2="${pt(i,1)[1].toFixed(1)}" class="spoke"/>`).join("")}
    <polygon points="${me.map((v,i)=>P(i,v)).join(" ")}" class="shape" pathLength="1"/>
    ${me.map((v,i)=>{ const [x,y]=pt(i,v); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" class="dot" style="--i:${i}"/>`; }).join("")}
    ${AXES.map((t,i)=>{ const [x,y]=pt(i,1.17); return `<text x="${x.toFixed(1)}" y="${(y+6).toFixed(1)}" text-anchor="middle">${t}</text>`; }).join("")}
  </svg>`;
}
function landStars(){
  let s=7, rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  const dots=Array.from({length:110},()=>`<circle cx="${(rnd()*1200).toFixed(0)}" cy="${(rnd()*520).toFixed(0)}" r="${(rnd()*1.4+.4).toFixed(2)}" opacity="${(rnd()*.6+.25).toFixed(2)}"/>`).join("");
  const C=[[820,120],[900,180],[870,270],[960,300],[1040,240],[1000,150]];
  return `<svg class="stars" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g fill="#fff">${dots}</g>
    <polyline points="${C.map(p=>p.join(",")).join(" ")}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>
    ${C.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.2" fill="#fff"/><circle cx="${x}" cy="${y}" r="9" fill="rgba(255,255,255,.12)"/>`).join("")}
  </svg>`;
}
function viewLanding(){
  app.className = "land";
  const inLabel = S.user ? (S.prof ? "내 공간으로 가기" : "가입하기") : "학회원 로그인";
  app.innerHTML = `
  <header class="lnav" id="lnav">
    <div class="lin">
      <a class="brand" href="#" aria-label="KUSC 처음으로"><b>KUSC</b><span>건국대학교 경영대학 전략학회</span></a>
      <nav aria-label="홈페이지 메뉴"><a href="#" data-to="what">활동</a><a href="#" data-to="year">한 학기</a><a href="#" data-to="jobs">직무</a><a href="#" data-to="space">학회원 공간</a></nav>
      <button class="lbtn sm" data-login>${S.user?(S.prof?"내 공간":"가입하기"):"로그인"}</button>
    </div>
  </header>

  <section class="lhero">
    <div class="lin hgrid">
      <div class="htext">
        <p class="kicker">건국대학교 경영대학 전략학회 KUSC</p>
        <h1>실제 기업의 문제를<br>전략으로 풀어요</h1>
        <p class="lsub">수업에서 배운 전략경영 이론을 실제 기업과 산업에 적용하고, 팀으로 분석하고 토론해 전략을 제안해요. 그 경험으로 IB, PE, VC, 컨설팅, 전략기획, PM을 향해 나아가요.</p>
        <div class="lcta"><button class="lbtn" data-login>${inLabel}</button><button class="lbtn ghost" data-to="what">활동 보기</button></div>
      </div>
      <figure class="lfig">${landDeck()}</figure>
    </div>
  </section>

  <section class="lsec gray" id="what">
    <div class="lin">
      <h2>KUSC에서 하는 일</h2>
      <p class="lsub">이론은 수업에서 배우고, 여기서는 그걸 실제 기업에 써 봐요.</p>
      <div class="ldo">${LAND_DO.map(([k,t,d])=>`<div class="ljob">${icon(k)}<h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
      <p class="lnote">학기 말에는 학회칙의 출석과 활동 기준을 채운 학회원에게 학장 명의 수료증을 드려요.</p>
    </div>
  </section>

  <section class="lsec" id="year">
    <div class="lin narrow">
      <h2>한 학기는 이렇게 흘러가요</h2>
      <p class="lsub">단발성 행사가 아니라, 학기 단위로 꾸준히 이어지는 학회예요.</p>
      <ol class="lsteps when">${LAND_YEAR.map(([w,t,d])=>`<li><span class="no">${w}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}</ol>
    </div>
  </section>

  <section class="lsec gray" id="jobs">
    <div class="lin">
      <h2>여섯 직무를 향해요</h2>
      <p class="lsub">분석하고 제안하는 힘이 그대로 쓰이는 직무들이에요. KUSC는 이 여섯 직무에 집중해요.</p>
      <div class="ljobs">${LAND_JOBS.map(([k,n,d])=>`<div class="ljob"><div class="lart">${typeof chr==="function"?chr(k):""}</div><h3>${n}</h3><p>${d}</p></div>`).join("")}</div>
    </div>
  </section>

  <section class="lsec" id="program">
    <div class="lin pgrid">
      <div class="ptext">
        <p class="kicker">2026년 2학기 특별 프로그램</p>
        <h2>전략 직무 진출 커리큘럼</h2>
        <p class="lsub">이번 학기에는 현직 컨설턴트 선배와 네 번의 강의로, 나에게 맞는 직무를 찾고 서류까지 준비했어요.</p>
        <ol class="lsteps tight">${LAND_STEPS.map(([t,d],i)=>`<li><span class="no">${i+1}강</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}</ol>
        <p class="lnote">특별 프로그램은 학기마다 새로 기획해요. 다음 학기에는 또 다른 주제로 찾아와요.</p>
      </div>
      <figure class="lfig hexfig" id="hexfig">${landHex()}<figcaption>1강 역량 진단으로 그린 모양 (예시)</figcaption></figure>
    </div>
  </section>

  <section class="lsec gray">
    <div class="lin">
      <h2>이번 학기 KUSC</h2>
      <div class="lnums">
        <div><b>36명</b><span>함께한 학회원</span></div>
        <div><b>8회</b><span>학기 정기 세션</span></div>
        <div><b>약 70명</b><span>공개 현직자 강연에 함께한 학우</span></div>
      </div>
    </div>
  </section>

  <section class="lsec" id="space">
    <div class="lin">
      <h2>학회원만 들어오는 공간</h2>
      <p class="lsub">공지와 일정, 커뮤니티, 내 진단 결과까지 한곳에 모여 있어요.</p>
      <div class="lphones">
        <figure><div class="phone"><img src="img/screen-events.webp" alt="행사 참석과 뒤풀이 참석을 고르는 화면" loading="lazy" width="390" height="844"></div><figcaption><b>공지와 일정</b>행사와 뒤풀이 참석을 한 번에 답해요</figcaption></figure>
        <figure><div class="phone"><img src="img/screen-board.webp" alt="질문, 스터디, 정보 공유 글이 모인 커뮤니티 화면" loading="lazy" width="390" height="844"></div><figcaption><b>커뮤니티</b>묻고, 모이고, 나눠요</figcaption></figure>
        <figure><div class="phone"><img src="img/screen-shape.webp" alt="내 역량 육각형과 가장 닮은 직무를 보여 주는 화면" loading="lazy" width="390" height="844"></div><figcaption><b>내 역량의 모양</b>진단 결과를 언제든 다시 봐요</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="lsec gray">
    <div class="lin">
      <h2>학회를 함께 꾸리는 사람들</h2>
      <p class="lsub">임원진이 역할을 나눠 학회를 운영하고, 지도교수님이 함께해요.</p>
      <div class="lroles">${LAND_ROLES.map(([t,d])=>`<div><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
    </div>
  </section>

  <section class="lsec dark" id="vision">
    ${landStars()}
    <div class="lin narrow">
      <h2>우리의 목표는<br>건강한 카르텔이에요</h2>
      <p class="lsub">여기서 함께 반짝인 별들이 업계 곳곳에 자리 잡고, 서로를 끌어주는 별자리가 되는 것.<br>그게 KUSC가 그리는 모습이에요.<br>졸업한 선배는 한 번 강연하고 떠나는 손님이 아니에요.<br>후배를 이끌고 기회를 나누며, 학회를 함께 키워 가요.</p>
      <div class="lduo trio">
        <div><h3>선발하고</h3><p>엘리트 직무에 맞는 잠재력을 가진 학생을 서류와 면접으로 선발해요.<br>들어오기 어려운 만큼 서로를 믿을 수 있어요.</p></div>
        <div><h3>깊게 단련하고</h3><p>한 학기 동안 실제 기업의 문제를 팀으로 끝까지 풀어요.<br>현업의 기준으로 피드백을 받으며 실력을 키워요.</p></div>
        <div><h3>끝까지 이어져요</h3><p>먼저 나아간 선배가 멘토링, 서류 피드백, 기회를 들고 다시 돌아와요.<br>그 후배가 또 다음 후배를 끌어줘요.</p></div>
      </div>
    </div>
  </section>

  <section class="lsec lend">
    <div class="lin narrow">
      <h2>다음 별을<br>기다리고 있어요</h2>
      <p class="lsub">전공과 학년에 관계없이,<br>전략 직무로 나아가려는 의지가 분명한 건국대학교 학생이라면 지원할 수 있어요.<br>다음 모집 일정은 정해지는 대로 이곳에 올라와요.</p>
      <p class="lnote">이미 KUSC 학회원인가요? <button class="link" data-login>${S.user?(S.prof?"내 공간으로 가기":"가입하기"):"학회원 로그인"}</button></p>
    </div>
  </section>

  <footer class="lfoot"><div class="lin"><b>KUSC</b><span>건국대학교 경영대학 전략학회</span><span>© 2026 KUSC</span></div></footer>
  <div class="sheet" id="sheet" hidden><div class="sheetbg" data-close></div><div class="sheetcard" role="dialog" aria-modal="true" aria-label="로그인" id="sheetcard"></div></div>`;
  $$("[data-to]").forEach(a=>a.onclick=e=>{ e.preventDefault(); const t=document.getElementById(a.dataset.to); if(t) t.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}); });
  $$("[data-login]").forEach(b=>b.onclick=()=>{ if(S.user) location.hash = S.prof ? "#home" : "#join"; else openLogin(); });
  const nav=$("#lnav"), onScroll=()=>nav.classList.toggle("on",scrollY>8);
  window.onscroll=onScroll; onScroll();
  /* 육각형은 화면에 들어왔을 때 그려지게 */
  const hf=$("#hexfig");
  if(hf && "IntersectionObserver" in window){ const io=new IntersectionObserver(es=>{ if(es.some(x=>x.isIntersecting)){ hf.classList.add("play"); io.disconnect(); } },{threshold:.35}); io.observe(hf); }
  else if(hf) hf.classList.add("play");
  if(S.sheetOpen) openLogin();
}
function openLogin(){
  S.sheetOpen=true;
  const sh=$("#sheet"); if(!sh) return;
  sh.hidden=false; document.body.style.overflow="hidden";
  renderLogin();
  sh.querySelector("[data-close]").onclick=closeLogin;
  document.onkeydown=e=>{ if(e.key==="Escape") closeLogin(); };
}
function closeLogin(){ S.sheetOpen=false; const sh=$("#sheet"); if(sh) sh.hidden=true; document.body.style.overflow=""; document.onkeydown=null; }
function renderLogin(){
  const isUp = S.auth==="signup", isReset = S.auth==="reset";
  const gIcon = `<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  const card=$("#sheetcard");
  card.innerHTML = `<button class="sheetx" data-close aria-label="닫기">×</button>
    <h2>${isReset?"비밀번호 다시 설정":isUp?"이메일로 가입하기":MODE==="exec"?"운영실 로그인":"학회원 로그인"}</h2>
    <p class="desc">${isReset?"가입한 이메일로 비밀번호를 다시 정하는 링크를 보내 드려요.":MODE==="exec"?"임원진으로 지정된 계정만 들어올 수 있어요.":"가입하면 학회원 명단과 이름, 학번을 맞춰 확인해요."}</p>
    ${inApp && !isReset ? `<div class="notice">카카오톡이나 인스타그램 안에서 열면 구글 로그인이 막혀 있어요.<br>
      <button class="link" id="ext" style="color:inherit;font-weight:800">다른 브라우저로 열기</button> 또는 이메일로 로그인해 주세요.</div>`:""}
    ${isReset?"":`<button class="btn line block" id="google" style="margin-top:18px">${gIcon}구글 계정으로 계속하기</button>
    <p class="hint" style="text-align:center">구글 화면에 kusc-77206.firebaseapp.com이 보이면, KUSC 사이트의 로그인 주소예요.</p>
    <div class="divider">또는 이메일</div>`}
    ${field("em","이메일","",{type:"email",ph:"name@example.com"})}
    ${isReset?"":field("pw","비밀번호","",{type:"password",opt:isUp?"6자 이상":""})}
    <p class="err" id="err"></p>${S.msg?`<p class="ok">${esc(S.msg)}</p>`:""}
    <button class="btn pri block" id="go" style="margin-top:18px">${isReset?"링크 보내기":isUp?"가입하기":"로그인"}</button>
    <div style="display:flex;justify-content:space-between;margin-top:14px;gap:10px">
      ${isReset?`<button class="link" data-mode="login">로그인으로 돌아가기</button>`
        :`${MODE==="exec"?"<span></span>":`<button class="link" data-mode="${isUp?"login":"signup"}">${isUp?"이미 계정이 있어요":"처음이에요, 이메일로 가입할게요"}</button>`}
          <button class="link" data-mode="reset">비밀번호를 잊었어요</button>`}
    </div>`;
  card.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeLogin);
  $$("[data-mode]").forEach(b=>b.onclick=()=>{ S.auth=b.dataset.mode; S.msg=""; renderLogin(); });
  if($("#ext")) $("#ext").onclick=()=>{ location.href = /KAKAOTALK/i.test(navigator.userAgent) ? "kakaotalk://web/openExternal?url="+encodeURIComponent(location.href) : location.href; };
  if($("#google")) $("#google").onclick=async()=>{ S.afterLogin=true; try{ await F.signInGoogle(); }catch(e){ S.afterLogin=false; showErr(authMsg(e)); } };
  $("#go").onclick=async()=>{
    const em=val("em"), pw=$("#pw")?$("#pw").value:"";
    const b=$("#go"); b.disabled=true;
    try{
      if(isReset){ await F.resetPw(em); S.msg="메일을 보냈어요. 받은편지함과 스팸함을 확인해 주세요"; S.auth="login"; renderLogin(); return; }
      S.afterLogin=true;
      if(isUp) await F.signUpEmail(em,pw); else await F.signInEmail(em,pw);
    }catch(e){ S.afterLogin=false; b.disabled=false; showErr(authMsg(e)); }
  };
  setTimeout(()=>{ const f=$("#em"); if(f&&matchMedia("(min-width:701px)").matches) f.focus(); },50);
}

/* ───────── 가입: 명단 확인 → 정보 확인 → 관심과 동의 ───────── */
function viewJoin(){
  const J = S.join || (S.join = {step:1, d:{name:S.user.displayName||"", sid:""}});
  const d = J.d, step = J.step;
  if(S.req && !J.force) return viewPending();
  const bars = `<div class="steps">${[1,2,3].map(i=>`<i class="${i<=step?"on":""}"></i>`).join("")}</div>
    <div class="stepname">${step} / 3 · ${["학회원 확인","내 정보 확인","관심 직무와 동의"][step-1]}</div>`;
  let body = "";
  if(step===1) body = `<h2>학회원 명단과 맞춰 볼게요</h2>
    <p class="desc">이름과 학번이 명단과 맞으면, 커리큘럼 때 남겨 주신 정보를 불러와요.</p>
    ${field("name","이름",d.name,{req:1})}${field("sid","학번",d.sid,{req:1,num:1,ph:"예: 202612345"})}`;
  if(step===2) body = `<h2>${esc(d.name)} 님, 이 정보가 맞나요?</h2>
    <p class="desc">커리큘럼 때 받은 정보를 채워 뒀어요. 바뀐 게 있으면 고쳐 주세요.</p>
    <div class="two">${field("name2","이름",d.name,{ro:1})}${field("sid2","학번",d.sid,{ro:1})}</div>
    ${field("phone","휴대폰 번호",d.phone,{req:1,type:"tel",num:1,ph:"010-0000-0000",hint:"공지와 행사 변동 안내에만 써요"})}
    <div class="field"><label class="l">학년<span class="req">*</span></label>${chips("grade",GRADES,false,d)}</div>
    <div class="two">${field("age","나이",d.age,{num:1,opt:"선택"})}<div class="field"><label class="l">성별<span class="opt">선택</span></label>${chips("gender",GENDERS,false,d)}</div></div>
    ${field("major","주전공",d.major,{req:1,ph:"예: 경영학과"})}
    ${field("major2","복수·부전공",d.major2,{opt:"있다면",ph:"예: 기술경영학과 (복수전공)"})}`;
  if(step===3) body = `<h2>거의 다 됐어요</h2>
    <div class="field"><label class="l">관심 있는 직무<span class="req">*</span><span class="opt">여러 개 선택 가능</span></label>${chips("jobs",[...JOBS,"아직 모르겠다"],true,d)}</div>
    <div class="field"><label class="l">지금 준비 단계<span class="req">*</span></label>${chips("stage",STAGES,false,d)}</div>
    <div class="consent"><b>개인정보 수집·이용 동의</b><br>
      · 수집 항목: 이름, 학번, 휴대폰 번호, 학년, 나이, 성별, 전공, 관심 직무, 준비 단계, 이메일, 진단 결과와 활동 기록<br>
      · 이용 목적: 학회원 확인과 관리, 공지와 행사 안내, 회비 관리, 진단 결과와 강의 자료 제공<br>
      · 보유 기간: 탈퇴할 때까지 (내 정보에서 탈퇴하면 바로 지워져요)<br>
      · 동의를 거부할 수 있으며, 거부 시 가입이 제한됩니다</div>
    <label class="check"><input type="checkbox" id="cs" ${d.consent?"checked":""}> 위 내용에 동의합니다 (필수)</label>`;
  app.innerHTML = header("","")+`<section class="card" style="margin-top:22px">${bars}${body}
    <p class="err" id="err"></p>
    <div class="row" style="margin-top:24px"><button class="btn sec" id="back" style="flex:0 0 96px">${step===1?"나가기":"이전"}</button><button class="btn pri" id="next" style="flex:1">${step===3?"가입 완료":"다음"}</button></div>
  </section>`+foot();
  const keep=()=>{ if(step===1){ d.name=val("name"); d.sid=val("sid"); } if(step===2){ d.phone=val("phone"); d.age=val("age"); d.major=val("major"); d.major2=val("major2"); } };
  bindChips(d, ()=>{ keep(); viewJoin(); });
  if($("#cs")) $("#cs").onchange=e=>d.consent=e.target.checked;
  $("#back").onclick=async()=>{ keep(); if(step===1) await F.signOut(); else { J.step--; viewJoin(); } };
  $("#next").onclick=async()=>{
    keep();
    const b=$("#next");
    if(step===1){
      if(d.name.replace(/\s/g,"").length<2) return showErr("이름을 입력해 주세요");
      if(d.sid.replace(/\D/g,"").length<6) return showErr("학번을 정확히 입력해 주세요");
      b.disabled=true; b.textContent="확인 중…";
      const rid=F.rosterId(d.sid,d.name); let r=null;
      try{ r=await F.getRoster(rid); }catch(e){}
      b.disabled=false; b.textContent="다음";
      if(!r){ J.miss=true; return viewNotFound(); }
      if(r.uid && r.uid!==S.user.uid) return showErr("이 학번은 이미 다른 계정에 연결돼 있어요. 임원진에게 알려주세요.");
      J.rid=rid; J.roster=r;
      Object.assign(d,{name:r.name, sid:r.sid, phone:d.phone||r.phone||"", grade:d.grade||r.grade||"", age:d.age||r.age||"", gender:d.gender||r.gender||"",
        major:d.major||r.major||"", major2:d.major2||r.major2||"", jobs:(d.jobs&&d.jobs.length)?d.jobs:(r.jobs||[]), stage:d.stage||r.stage||""});
      J.step=2; viewJoin(); scrollTo(0,0); return;
    }
    if(step===2){
      const miss = !/^01\d{8,9}$/.test(d.phone.replace(/\D/g,""))?"휴대폰 번호를 정확히":!d.grade?"학년을":!d.major?"주전공을":"";
      if(miss) return showErr(miss+" 입력해 주세요");
      d.phone=fmtPhone(d.phone); J.step=3; viewJoin(); scrollTo(0,0); return;
    }
    if(!(d.jobs||[]).length) return showErr("관심 직무를 골라 주세요");
    if(!d.stage) return showErr("준비 단계를 골라 주세요");
    if(!d.consent) return showErr("개인정보 수집·이용에 동의해 주세요");
    b.disabled=true; b.textContent="가입 중…";
    const data={name:d.name, sid:d.sid, phone:d.phone, grade:d.grade, age:d.age||"", gender:d.gender||"", major:d.major, major2:d.major2||"",
      jobs:d.jobs, stage:d.stage, email:S.user.email||"", consent:true, consentAt:new Date().toISOString(), progress:{}};
    if(J.roster&&J.roster.diag){ data.diag=J.roster.diag; data.diagAt=J.roster.diag.ts||""; data.diagFrom="1강 진단"; data.diagHist=[F.diagSummary(J.roster.diag)]; }
    try{ await F.joinMember(S.user.uid, J.rid, data); sheetLog("가입", data); S.prof=await F.getProfile(S.user.uid); S.join=null; S.req=null; location.hash="#home"; render(); }
    catch(e){ b.disabled=false; b.textContent="가입 완료"; showErr(authMsg(e)); }
  };
}
function viewNotFound(){
  const d=S.join.d;
  app.innerHTML = header("","")+`<section class="card" style="margin-top:22px">
    <h2>명단에서 찾지 못했어요</h2>
    <p class="desc">${esc(d.name)} 님, 학번 ${esc(d.sid)}는 아직 학회원 명단에 없어요. 이름이나 학번을 잘못 넣었다면 다시 확인해 주세요.</p>
    <p class="desc" style="margin-top:12px">새로 들어온 학회원이라면 가입 요청을 남겨 주세요. 임원진이 명단에 올리면 바로 가입할 수 있어요.</p>
    ${field("rphone","휴대폰 번호","",{type:"tel",num:1,ph:"010-0000-0000"})}
    ${field("rmajor","주전공","",{ph:"예: 경영학과"})}
    ${field("rmsg","임원진에게 한마디","",{opt:"선택",ph:"예: 이번 학기에 들어온 신입 학회원입니다"})}
    <p class="err" id="err"></p>
    <div class="row" style="margin-top:20px"><button class="btn sec" id="again">다시 입력하기</button><button class="btn pri" id="req" style="flex:1">가입 요청 보내기</button></div>
  </section>`+foot();
  $("#again").onclick=()=>{ S.join.step=1; viewJoin(); };
  $("#req").onclick=async()=>{
    const p=val("rphone");
    if(!/^01\d{8,9}$/.test(p.replace(/\D/g,""))) return showErr("휴대폰 번호를 정확히 입력해 주세요");
    const b=$("#req"); b.disabled=true;
    const r={name:d.name.replace(/\s/g,""), sid:d.sid.replace(/\D/g,""), phone:fmtPhone(p), major:val("rmajor"), msg:val("rmsg"), email:S.user.email||""};
    try{ await F.submitRequest(S.user.uid, r); sheetLog("가입 요청", r); S.req=r; S.join.force=false; viewPending(); }catch(e){ b.disabled=false; showErr(authMsg(e)); }
  };
}
function viewPending(){
  const r=S.req;
  app.innerHTML = header("","")+`<section class="card" style="margin-top:22px">
    <div class="lesson">가입 요청 보냄</div>
    <h2 style="margin-top:4px">임원진 확인을 기다리고 있어요</h2>
    <p class="desc">${esc(r.name)} 님 (학번 ${esc(r.sid)}). 임원진이 명단에 올리면 아래 버튼으로 가입을 마칠 수 있어요.</p>
    <p class="err" id="err"></p>
    <div class="row"><button class="btn pri" id="retry">명단에 올라갔는지 확인하기</button><button class="btn sec" id="out">로그아웃</button></div>
    <div style="margin-top:14px"><button class="link" id="cancel">요청 취소하고 다시 입력하기</button></div>
  </section>`+foot();
  $("#out").onclick=()=>F.signOut();
  $("#cancel").onclick=async()=>{ try{ await F.deleteRequest(S.user.uid); }catch(e){} S.req=null; S.join=null; viewJoin(); };
  const retry=async(auto)=>{
    let x=null; try{ x=await F.getRoster(F.rosterId(r.sid,r.name)); }catch(e){}
    if(!x){ if(!auto) showErr("아직 명단에 없어요. 조금 뒤에 다시 확인해 주세요."); return; }
    S.join={step:1, force:true, d:{name:r.name, sid:r.sid, phone:r.phone, major:r.major}};
    viewJoin(); $("#next").click();
  };
  $("#retry").onclick=()=>retry(false);
  retry(true);   /* 들어오자마자 한 번 확인: 이미 명단에 올라갔으면 바로 가입으로 */
}

/* ───────── 홈 ───────── */
async function viewHome(){
  const p=S.prof, dg=p.diag, g=p.progress||{};
  const LECS=["1강","2강","3강","4강"];
  const best = dg ? AXES[dg.a.indexOf(Math.max(...dg.a))] : "";
  const HH=(p.diagHist&&p.diagHist.length)?[...p.diagHist].sort((x,y)=>String(x.ts).localeCompare(String(y.ts))):(dg?[dg]:[]);
  const nHist=HH.length, firstTs=nHist?(HH[0].ts||p.diagAt):"";
  const HGL=dg?((HH[0]&&HH[0].goals&&HH[0].goals.length)?HH[0].goals:(dg.goals||[])):[];
  const paid = p.dues && p.dues[TERM];
  app.innerHTML = header(`${esc(p.name)} 님, 반가워요`,
    p.master ? `<span class="badge ku">마스터 계정</span> 진단과 기록을 직접 해 보며 확인하는 테스트 공간이에요. 여기 기록은 나만 보여요.`
    : `${esc(p.major)} ${esc(p.grade)} <span class="badge ku">KUSC 학회원</span>${isExec()?' <span class="badge">임원진</span>':""}`)+`
  <div class="grid">
    <section class="card act" id="hnot"><div class="lesson">공지</div><div class="skel sm"></div></section>
    <section class="card act" id="hev"><div class="lesson">다가오는 일정</div><div class="skel sm"></div></section>
  </div>
  ${dg?`<section class="card">
      <div class="lesson">1강 내 역량 진단</div>
      <h2 style="margin-top:4px">${nHist>1?"처음과 지금, 내 역량의 변화":"학기 초에 그린 내 역량의 모양"}</h2>
      <p class="desc">${nHist>1?`처음 진단 ${day(firstTs)}, 지금까지 ${nHist}번 진단했어요`:`${day(firstTs)} 1강에서 진단했어요.<br>학기말에 같은 진단을 한 번 더 하면 처음 결과와 겹쳐서 비교해 드려요.`}</p>
      <div class="hexwrap">${hexSVG(dg.a)}
        <div class="facts">
          <div class="fact"><small>가장 닮은 직무</small><b>${esc(JOBNAME[dg.fit]||dg.fit)}</b>${matchBadge(dg)}</div>
          <div class="fact"><small>내가 원했던 직무</small><b>${esc(JOBNAME[dg.want]||dg.want)}</b></div>
          <div class="fact"><small>가장 강한 역량</small><b>${esc(best)}</b></div>
        </div></div>
      <div class="gos">${nHist>1?`<a class="go" href="#growth">처음과 지금 비교하기<b>→</b></a>`:`<a class="go" href="${diagHref("new")}">학기말 진단하고 비교하기<b>→</b></a>`}<a class="go" href="${diagHref("view")}">결과 자세히 보기<b>→</b></a></div>
    </section>
    ${HGL.length?`<section class="card act">
      <div class="lesson">이번 학기 목표</div>
      <h2 style="margin-top:4px">학기 초에 정한 목표 ${HGL.length}가지</h2>
      <p class="desc">${p.viewAs?"목표를 누르면 남긴 기록을 볼 수 있어요.":"목표를 누르면 상태를 바꾸고 한 일을 남길 수 있어요."}</p>
      <div id="hgbox" style="margin-top:14px"><div class="skel sm"></div></div>
      <a class="go" href="#growth/goals">기록 전체 보기<b>→</b></a>
    </section>`:""}`
  :`<section class="card">
      <div class="lesson">먼저 해 볼 것</div>
      <h2 style="margin-top:4px">내 역량 진단부터 시작해요</h2>
      <p class="desc">일상 속 상황 17개로 여섯 역량의 모양을 그리고, 여섯 전략 직무 중 어디와 닮았는지 확인해요. 기본 정보는 가입할 때 받은 걸로 채워서 바로 문항부터 시작해요.</p>
      <div class="meta"><span>약 8분</span><span>개인 결과</span><span>이번 학기 목표 3가지</span></div>
      <a class="go" href="${diagHref("new")}">진단 시작하기<b>→</b></a>
    </section>`}
  <div class="grid">
    <section class="card act">
      <div class="lesson">이번 학기 강의</div>
      <div id="hatt"><div class="skel sm"></div></div>
    </section>
    ${p.master?"":`<section class="card act">
      <div class="lesson">${TERM_LABEL} 회비</div>
      <h3 style="margin-top:6px">${paid?"납부 확인됐어요":"아직 확인 전이에요"} <span class="badge ${paid?"ku":""}">${DUES}</span></h3>
      <p class="desc">${paid?`${day(paid)}에 임원진이 확인했어요.`:"입금 계좌는 소식의 정산 공지에 늘 올라와 있어요. 입금 후 임원진이 확인하면 여기에 표시돼요."}</p>
      <a class="go" href="#news">${paid?"소식 보기":"입금 계좌 보기"}<b>→</b></a>
    </section>`}
  </div>
  <section class="card">
    <div class="lesson">곧 열려요</div>
    <h3 style="margin-top:6px">작성실</h3>
    <p class="desc">이번 학기에 남긴 기록이 모두 레쥬메의 재료가 돼요.<br>아래 기록을 불러와서 4강 방식대로 레쥬메 불릿과 자소서 초안을 함께 써요.</p>
    <div class="feed"><span>1강 진단 결과</span><span>목표별로 쌓은 기록</span><span>들은 강의</span><i aria-hidden="true">→</i><b>레쥬메 불릿 초안</b></div>
    <p class="hint" style="margin-top:10px">쓴 내용은 계정에 저장돼서 어느 기기에서든 이어 쓸 수 있어요.</p>

  </section>`+foot();
  if(HGL.length) goalsDoc(p).then(()=>goalsUI($("#hgbox"), HGL, p, "home")).catch(()=>{});
  F.getAttendance(myUid()).then(at=>{ const box=$("#hatt"); if(!box) return;
    const got=(at&&at[TERM])||null, has=i=>!!got&&got.some(x=>x.startsWith(LECS[i]));
    const names=["정의","구조화","검증","진입"], n=got?LECS.filter((_,i)=>has(i)).length:0;
    box.innerHTML = `<h3 style="margin-top:6px">${got?`4개 중 ${n}개를 들었어요`:"강의 후기를 남기면 들은 강의가 표시돼요"}</h3>
      <div class="prog">${names.map((t,i)=>`<div class="${has(i)?"done":""}"><small>${i+1}강</small><b>${t}</b></div>`).join("")}</div>
      <a class="go" href="#class">강의실 가기<b>→</b></a>`;
  }).catch(()=>{ const box=$("#hatt"); if(box) box.innerHTML=`<a class="go" href="#class">강의실 가기<b>→</b></a>`; });
  try{
    const [ns, evs] = await Promise.all([load("notices",F.listNotices), load("events",F.listEvents)]);
    const top = [...ns].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)).slice(0,3);
    $("#hnot").innerHTML = `<div class="lesson">공지</div>${top.length?top.map(x=>`<a class="li" href="#news"><span class="badge ${x.tag==="정산"?"ku":""}">${esc(x.tag||"공지")}</span><b>${x.pinned?"📌 ":""}${esc(x.title)}</b><small>${day(x.createdAt)}</small></a>`).join("")
      :`<p class="desc">아직 공지가 없어요.</p>`}<a class="go" href="#news">공지 전체 보기<b>→</b></a>`;
    const up = evs.filter(e=>e.date>=today()).sort((a,b)=>a.date.localeCompare(b.date))[0];
    $("#hev").innerHTML = `<div class="lesson">다가오는 일정</div>${up?`<h3 style="margin-top:6px">${esc(up.title)}</h3>
      <p class="desc">${ymd(up.date)} ${esc(up.time||"")} · ${esc(up.place||"장소 미정")}</p>
      <a class="go" href="#news/events">참석 응답하기<b>→</b></a>`:`<p class="desc">예정된 일정이 없어요.</p><a class="go" href="#news/events">달력 보기<b>→</b></a>`}`;
  }catch(e){ $("#hnot").innerHTML=`<p class="err" style="display:block">${authMsg(e)}</p>`; }
}

/* ───────── 소식: 공지 · 일정 · 재정 공개 ───────── */
async function viewNews(){
  const tab = route().arg || "notices";
  app.innerHTML = header("소식","")+`<div class="seg">${[["notices","공지"],["events","일정"],["ledger","재정 공개"]].map(([k,t])=>`<a href="#news/${k}" class="${tab===k?"on":""}">${t}</a>`).join("")}</div>
    <div id="nbody"><div class="skel"></div></div>`+foot();
  const box=$("#nbody");
  try{
    if(tab==="notices"){
      const ns=[...await load("notices",F.listNotices)].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
      box.innerHTML = ns.length ? ns.map(x=>`<section class="card tight"><span class="badge ${x.tag==="정산"?"ku":""}">${esc(x.tag||"공지")}</span>${x.pinned?' <span class="badge">📌 고정</span>':""}
        <h3 style="margin-top:8px">${esc(x.title)}</h3><p class="body">${nl(x.body)}</p><p class="hint">${day(x.createdAt)} · ${esc(x.authorName||"임원진")}</p></section>`).join("")
        : `<section class="card"><p class="desc">아직 공지가 없어요.</p></section>`;
    }
    if(tab==="events"){
      const evs=[...await load("events",F.listEvents)].sort((a,b)=>a.date.localeCompare(b.date));
      const up=evs.filter(e=>e.date>=today()), past=evs.filter(e=>e.date<today()).reverse();
      const card=async e=>{
        const rs=await F.listRsvp(e.id); const mine=rs.find(r=>r.uid===myUid())||{};
        const yes=rs.filter(r=>r.status==="참석").length, party=rs.filter(r=>r.party==="참석").length;
        const open=e.date>=today();
        return `<section class="card tight" data-eid="${e.id}" data-date="${esc(e.date)}">
          <div class="lesson">${ymd(e.date)} ${esc(e.time||"")}${open?"":" · 지난 일정"}</div>
          <h3 style="margin-top:6px">${esc(e.title)}</h3>
          <div class="kv"><span>장소</span><b>${esc(e.place||"미정")}</b>${e.party?`<span>뒤풀이</span><b>${esc(e.party)}</b>`:""}${e.fee?`<span>참가비</span><b>${esc(e.fee)}</b>`:""}${e.account?`<span>입금 계좌</span><b>${esc(e.account)}</b>`:""}</div>
          ${e.desc?`<p class="body">${nl(e.desc)}</p>`:""}
          <p class="hint">참석 ${yes}명${e.party?` · 뒤풀이 ${party}명`:""}</p>
          ${open?`<div class="field"><label class="l">참석</label><div class="chips">${["참석","불참","미정"].map(o=>`<span class="chip ${mine.status===o?"on":""}" data-rs="status" data-v="${o}">${o}</span>`).join("")}</div></div>
          ${e.party?`<div class="field"><label class="l">뒤풀이</label><div class="chips">${["참석","불참","미정"].map(o=>`<span class="chip ${mine.party===o?"on":""}" data-rs="party" data-v="${o}">${o}</span>`).join("")}</div></div>`:""}`:""}
        </section>`;
      };
      /* 달력: 기본은 이번 달. 일정이 있는 날에 점, 누르면 그날 일정으로 이동 */
      const cm = S.calM || today().slice(0,7);
      const [cy, cmo] = cm.split("-").map(Number);
      const first = new Date(cy, cmo-1, 1), days = new Date(cy, cmo, 0).getDate(), lead = first.getDay();
      const inMonth = evs.filter(e=>String(e.date).slice(0,7)===cm);
      const byDay = {}; inMonth.forEach(e=>{ (byDay[e.date]=byDay[e.date]||[]).push(e); });
      const shift = k => { const d=new Date(cy, cmo-1+k, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
      const cells = [];
      for(let i=0;i<lead;i++) cells.push(`<div class="cd empty"></div>`);
      for(let d=1; d<=days; d++){
        const ds=`${cm}-${String(d).padStart(2,"0")}`, es=byDay[ds]||[], wd=(lead+d-1)%7;
        cells.push(`<button class="cd${ds===today()?" today":""}${es.length?" has":""}${wd===0?" sun":wd===6?" sat":""}" ${es.length?`data-day="${ds}"`:"disabled"} aria-label="${cmo}월 ${d}일${es.length?`, 일정 ${es.length}개`:""}">
          <span>${d}</span>${es.length?`<i>${esc(es[0].title)}${es.length>1?` 외 ${es.length-1}`:""}</i>`:""}</button>`);
      }
      const list = inMonth.length ? (await Promise.all(inMonth.map(card))).join("")
        : `<section class="card tight"><p class="desc">${cmo}월에는 등록된 일정이 없어요.${up.length?` 다음 일정은 ${ymd(up[0].date)} ${esc(up[0].title)}이에요.`:""}</p></section>`;
      box.innerHTML = `<section class="card cal">
          <div class="calhead"><button class="btn sec sm" id="calprev" aria-label="이전 달">‹</button><h2>${cy}년 ${cmo}월</h2><button class="btn sec sm" id="calnext" aria-label="다음 달">›</button></div>
          <div class="calgrid">${["일","월","화","수","목","금","토"].map((w,i)=>`<div class="cw${i===0?" sun":i===6?" sat":""}">${w}</div>`).join("")}${cells.join("")}</div>
          ${cm!==today().slice(0,7)?`<div class="row" style="margin-top:12px"><button class="btn sec sm" id="caltoday">이번 달로</button></div>`:""}
        </section>
        <h3 style="margin:22px 0 0">${cmo}월 일정</h3>${list}`;
      $("#calprev").onclick=()=>{ S.calM=shift(-1); viewNews(); };
      $("#calnext").onclick=()=>{ S.calM=shift(1); viewNews(); };
      if($("#caltoday")) $("#caltoday").onclick=()=>{ S.calM=null; viewNews(); };
      $$("[data-day]").forEach(b=>b.onclick=()=>{ const t=box.querySelector(`[data-date="${b.dataset.day}"]`); if(t){ t.scrollIntoView({behavior:"smooth",block:"start"}); t.classList.add("flash"); setTimeout(()=>t.classList.remove("flash"),1200); } });
      $$("[data-rs]").forEach(c=>c.onclick=async()=>{
        if(!isMember()) return;
        const sec=c.closest("[data-eid]"), eid=sec.dataset.eid;
        const cur={}; sec.querySelectorAll(".chip.on[data-rs]").forEach(x=>cur[x.dataset.rs]=x.dataset.v);
        cur[c.dataset.rs]=c.dataset.v;
        try{ await F.setRsvp(eid,S.user.uid,{status:cur.status||"미정",party:cur.party||"",name:S.prof.name}); viewNews(); }catch(e){ alert(authMsg(e)); }
      });
    }
    if(tab==="ledger"){
      const L=[...await load("ledger",F.listLedger)].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      let bal=0; const rows=L.map(x=>{ bal += (x.type==="수입"?1:-1)*(Number(x.amount)||0); return {...x,bal}; });
      const inn=L.filter(x=>x.type==="수입").reduce((s,x)=>s+(+x.amount||0),0), out=L.filter(x=>x.type!=="수입").reduce((s,x)=>s+(+x.amount||0),0);
      box.innerHTML = `<section class="card">
        <h2>학회 재정</h2><p class="desc">학회 공금이 어디서 들어오고 어디에 쓰였는지 모두에게 공개해요.</p>
        <div class="stat three"><div><small>들어온 돈</small><b>${won(inn)}</b></div><div><small>쓴 돈</small><b>${won(out)}</b></div><div><small>남은 돈</small><b>${won(inn-out)}</b></div></div>
        <p class="hint" style="margin-top:10px">남은 돈 = 들어온 돈 − 쓴 돈</p>
        ${rows.length?`<div class="scroll"><table class="tbl"><tr><th>날짜</th><th>항목</th><th>구분</th><th style="text-align:right">금액</th><th style="text-align:right">잔액</th></tr>
          ${rows.reverse().map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.item)}${x.note?`<br><small class="muted">${esc(x.note)}</small>`:""}</td><td>${esc(x.type)}</td><td style="text-align:right">${won(x.amount)}</td><td style="text-align:right">${won(x.bal)}</td></tr>`).join("")}</table></div>`
          :`<p class="desc" style="margin-top:12px">아직 기록이 없어요. 임원진이 회비와 행사비 내역을 올리면 여기서 볼 수 있어요.</p>`}
      </section>`;
    }
  }catch(e){ box.innerHTML=`<section class="card"><p class="err" style="display:block">${authMsg(e)}</p></section>`; }
}

/* ───────── 커뮤니티 ───────── */
async function viewBoard(){
  const cat = S.boardCat || "전체";
  app.innerHTML = header("커뮤니티","학회원끼리 묻고, 모이고, 나누는 곳이에요.")+`
    <div class="seg">${["전체",...BOARDS].map(c=>`<a href="javascript:void 0" data-cat="${c}" class="${cat===c?"on":""}">${c}</a>`).join("")}</div>
    <div class="row" style="margin-top:12px"><a class="btn pri" href="#post/new">글쓰기</a></div>
    <div id="plist"><div class="skel"></div></div>`+foot();
  $$("[data-cat]").forEach(a=>a.onclick=()=>{ S.boardCat=a.dataset.cat; viewBoard(); });
  try{
    const ps=(await load("posts",F.listPosts)).filter(p=>cat==="전체"||p.cat===cat);
    $("#plist").innerHTML = ps.length ? `<section class="card tight">${ps.map(p=>`<a class="li" href="#post/${p.id}">
        <span class="badge">${esc(p.cat)}</span><b>${esc(p.title)}</b>
        <small>${esc(p.anon?"익명":p.authorName)} · ${day(p.createdAt)}${p.comments?` · 댓글 ${p.comments}`:""}</small></a>`).join("")}</section>`
      : `<section class="card"><p class="desc">아직 글이 없어요. 첫 글을 남겨 보세요.</p></section>`;
  }catch(e){ $("#plist").innerHTML=`<section class="card"><p class="err" style="display:block">${authMsg(e)}</p></section>`; }
}
async function viewPost(id){
  if(id==="new"||id.startsWith("edit:")){
    const editing = id.startsWith("edit:") ? await F.getPost(id.slice(5)) : null;
    const d = S.draft || (S.draft = editing ? {cat:editing.cat,title:editing.title,body:editing.body,anon:!!editing.anon} : {cat:S.boardCat&&S.boardCat!=="전체"?S.boardCat:"자유",title:"",body:"",anon:false});
    app.innerHTML = header(editing?"글 고치기":"글쓰기","")+`<section class="card">
      <div class="field"><label class="l">게시판</label>${chips("cat",BOARDS,false,d)}</div>
      ${field("ptitle","제목",d.title,{req:1})}
      ${field("pbody","내용",d.body,{req:1,area:1,rows:9})}
      <label class="check"><input type="checkbox" id="anon" ${d.anon?"checked":""}> 익명으로 올리기<span class="opt" style="font-weight:500;color:var(--mute);font-size:12.5px">학회원에게는 '익명'으로 보여요</span></label>
      <p class="err" id="err"></p>
      <div class="row"><a class="btn sec" href="#board" id="cancel">취소</a><button class="btn pri" id="save" style="flex:1">${editing?"고치기":"올리기"}</button></div>
    </section>`+foot();
    const keep=()=>{ d.title=val("ptitle"); d.body=$("#pbody").value; d.anon=$("#anon").checked; };
    bindChips(d, ()=>{ keep(); viewPost(id); });
    $("#cancel").onclick=()=>{ S.draft=null; };
    $("#save").onclick=async()=>{ keep();
      if(!d.title) return showErr("제목을 입력해 주세요"); if(!d.body.trim()) return showErr("내용을 입력해 주세요");
      const b=$("#save"); b.disabled=true;
      try{
        if(editing) await F.updatePost(editing.id,{cat:d.cat,title:d.title,body:d.body,anon:d.anon});
        else await F.addPost({cat:d.cat,title:d.title,body:d.body,anon:d.anon,uid:S.user.uid,authorName:myName()});
        S.draft=null; drop("posts"); location.hash = editing?`#post/${editing.id}`:"#board";
      }catch(e){ b.disabled=false; showErr(authMsg(e)); }
    };
    return;
  }
  app.innerHTML = header("","")+`<div class="skel"></div>`;
  try{
    const p=await F.getPost(id);
    if(!p){ app.innerHTML=header("","")+`<section class="card"><p class="desc">지워진 글이에요.</p><div class="row"><a class="btn sec" href="#board">목록으로</a></div></section>`; return; }
    const cs=await F.listComments(id), mine=p.uid===myUid();
    app.innerHTML = header("","")+`<section class="card">
      <span class="badge">${esc(p.cat)}</span>
      <h2 style="margin-top:8px">${esc(p.title)}</h2>
      <p class="hint">${esc(p.anon?"익명":p.authorName)} · ${day(p.createdAt)}</p>
      <p class="body" style="margin-top:14px">${nl(p.body)}</p>
      <div class="row"><a class="btn sec sm" href="#board">목록</a>${mine?`<a class="btn sec sm" href="#post/edit:${p.id}">고치기</a>`:""}${mine||isExec()?`<button class="btn sec sm" id="pdel" style="color:var(--red)">지우기</button>`:""}</div>
    </section>
    <section class="card">
      <h3>댓글 ${cs.length}</h3>
      ${cs.map(c=>`<div class="cmt"><b>${esc(c.anon?"익명":c.authorName)}</b><small>${day(c.createdAt)}</small>
        <p>${nl(c.body)}</p>${(c.uid===myUid()||isExec())?`<button class="link" data-cdel="${c.id}">지우기</button>`:""}</div>`).join("")||`<p class="desc">첫 댓글을 남겨 보세요.</p>`}
      ${field("cbody","댓글 쓰기","",{area:1,rows:3})}
      <label class="check"><input type="checkbox" id="canon"> 익명으로</label>
      <p class="err" id="err"></p>
      <div class="row"><button class="btn pri" id="cadd">댓글 올리기</button></div>
    </section>`+foot();
    if($("#pdel")) $("#pdel").onclick=async()=>{ const b=$("#pdel"); if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 지울까요?"; return; }
      try{ await F.deletePost(id); drop("posts"); location.hash="#board"; }catch(e){ alert(authMsg(e)); } };
    $$("[data-cdel]").forEach(b=>b.onclick=async()=>{ try{ await F.deleteComment(id,b.dataset.cdel); drop("posts"); viewPost(id); }catch(e){ alert(authMsg(e)); } });
    $("#cadd").onclick=async()=>{ const body=$("#cbody").value.trim(); if(!body) return showErr("댓글을 입력해 주세요");
      try{ await F.addComment(id,{body,anon:$("#canon").checked,uid:S.user.uid,authorName:myName()}); drop("posts"); viewPost(id); }catch(e){ showErr(authMsg(e)); } };
  }catch(e){ app.innerHTML=header("","")+`<section class="card"><p class="err" style="display:block">${authMsg(e)}</p></section>`; }
}

/* ───────── 강의실 ───────── */
/* 3강 기록: 연사와 현장 사진. 사진은 잠긴 파일이고, 학회원만 받는 열쇠로 화면에서 풀어 보여줌 */
const L3_INFO = {
  attended: 70,
  speakers: [["PM","신지환","카카오페이","kakaopay"],["전략기획","황성준","현대기아자동차","hyundai"],["IB","봉찬희","NH투자증권","nh"],
             ["PE","백승현","J&M Partners","jm"],["컨설팅","백재웅","PwC컨설팅","pwc"],["VC","장원준","Google","google"]],
  photos: [
    ["01","10월 28일, 강연장"],["02","김추연 담당교수님 오프닝"],["03","컨설팅 백재웅"],
    ["04","VC 장원준"],["05","PE 백승현"],["06","IB 봉찬희"],["07","전략기획 황성준"],["08","PM 신지환"],
    ["09","뒤풀이"],["10","뒤풀이"],["11","뒤풀이"]
  ]
};
let galKey = null; const galCache = {};
async function galOpen(){
  if(galKey) return galKey;
  const c = await F.getConfig("gallery");
  if(!c || !c.key) return null;
  const raw = Uint8Array.from(atob(c.key), ch=>ch.charCodeAt(0));
  galKey = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  return galKey;
}
async function galImg(id, size){
  const k = id+size; if(galCache[k]) return galCache[k];
  const buf = new Uint8Array(await (await fetch(`img/l3/${k}.bin`)).arrayBuffer());
  const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv:buf.slice(0,12)}, await galOpen(), buf.slice(12));
  return (galCache[k] = URL.createObjectURL(new Blob([plain], {type:"image/jpeg"})));
}
async function galRender(){   /* data-ph="번호" 자리에 사진을 풀어 넣고, 누르면 크게 보기 */
  const spots=[...document.querySelectorAll("[data-ph]")]; if(!spots.length) return;
  let key=null; try{ key=await galOpen(); }catch(e){}
  if(!key){ spots.forEach(s=>s.classList.add("locked")); const n=$("#galnote"); if(n) n.textContent="현장 사진을 준비하고 있어요."; return; }
  spots.forEach(s=>s.onclick=()=>galView(+s.dataset.ph));
  for(const s of spots){
    try{ const id=L3_INFO.photos[+s.dataset.ph][0]; const u=await galImg(id, s.dataset.size||"t");
      s.insertAdjacentHTML("afterbegin", `<img src="${u}" alt="">`); }catch(e){}
  }
}
async function galView(i){
  const P=L3_INFO.photos, n=P.length; i=(i+n)%n;
  let lb=$("#lb"); if(!lb){ lb=document.createElement("div"); lb.id="lb"; lb.className="lb"; document.body.appendChild(lb); }
  lb.innerHTML=`<div class="lbbg" data-x></div><figure><div class="lbimg"><div class="skel"></div></div><figcaption>${esc(P[i][1])} <small>${i+1} / ${n}</small></figcaption></figure>
    <button class="lbx" data-x aria-label="닫기">×</button><button class="lbp" aria-label="이전 사진">‹</button><button class="lbn" aria-label="다음 사진">›</button>`;
  lb.hidden=false; document.body.style.overflow="hidden";
  const close=()=>{ lb.hidden=true; document.body.style.overflow=""; document.onkeydown=null; };
  lb.querySelectorAll("[data-x]").forEach(x=>x.onclick=close);
  lb.querySelector(".lbp").onclick=()=>galView(i-1); lb.querySelector(".lbn").onclick=()=>galView(i+1);
  document.onkeydown=e=>{ if(e.key==="Escape") close(); if(e.key==="ArrowLeft") galView(i-1); if(e.key==="ArrowRight") galView(i+1); };
  try{ const u=await galImg(P[i][0],"f"); const w=lb.querySelector(".lbimg"); if(w) w.innerHTML=`<img src="${u}" alt="${esc(P[i][1])}">`; }catch(e){}
}
function viewL3(){
  const P=L3_INFO.photos, idx=id=>P.findIndex(x=>x[0]===id);
  const ph=(id,size,cls)=>`<button class="ph3 ${cls||""}" data-ph="${idx(id)}" data-size="${size}" aria-label="${esc(P[idx(id)][1])} 크게 보기"><em>${esc(P[idx(id)][1])}</em></button>`;
  const SP={PM:"08","전략기획":"07",IB:"06",PE:"05","컨설팅":"03",VC:"04"};
  const LINE={PM:"제품을 낸 다음, 모르는 고객을 어떻게 데려오는지","전략기획":"차를 정의하는 첫 단계, 상품전략",IB:"기업에 돈이 필요한 순간, 가장 알맞은 조달을 설계하는 일",
    PE:"기업을 인수하고 가치를 키운 뒤 회수하는 구조","컨설팅":"정답이 아니라 해답을 찾아주는 일",VC:"스타트업을 둘러싼 돈의 흐름과 그 안에서 일하는 사람들"};
  app.innerHTML = header("","")+`<a class="back" href="#class">← 강의실</a>
  <div class="story">
    <section class="st hero">
      <div class="lesson">3강 · 그날의 현장 돌아보기</div>
      <h2>10월 28일 저녁,<br>101호에 약 ${L3_INFO.attended}명이 모였어요</h2>
      <p>KUSC가 경영대학과 함께 연 첫 공개 행사였어요.<br>학회원뿐 아니라 직무가 궁금한 학우라면 누구나 신청할 수 있었어요.</p>
      ${ph("01","f","wide")}
      ${ph("02","f","wide")}
    </section>
    <section class="st">
      <h2>여섯 직무를,<br>그 일을 하는 선배에게 직접 들었어요</h2>
      <div class="sp3">${[...L3_INFO.speakers].sort((a,b)=>SP[a[0]].localeCompare(SP[b[0]])).map(([j,n,c,lg])=>`<div class="sprow">${ph(SP[j],"t","sq")}
        <div><small>${esc(j)}</small><b>${esc(n)} <img class="lg" src="img/logo/${lg}.png" alt="${esc(c)}" title="${esc(c)}"></b><p>${esc(LINE[j])}</p></div></div>`).join("")}</div>
    </section>
    <section class="st">
      <h2>화려한 이력보다,<br>어떻게 들어갔는지를 물었어요</h2>
      <p>연사마다 순서는 같았어요.<br>나는 누구인지, 이 직무는 무엇인지, AI가 무엇을 바꿨는지, 그리고 남들과 다른 길로 들어간 나만의 틈.<br>미리 받은 질문에도 직무별로 답해 줬어요.</p>
    </section>
    <section class="st">
      <h2>쉽게 모실 수 없는 선배들이<br>한자리에</h2>
      <p>평소라면 한 분 모시기도 어려운, 우리 학교 최고의 아웃풋들이에요.<br>같은 강의실에 앉았던 선배들이라, 이야기가 더 가깝게 들렸어요.</p>
    </section>
    <section class="st">
      <h2>강연이 끝나도<br>이야기는 이어졌어요</h2>
      <p>뒤풀이에서는 관심 직무별로 테이블을 나눠, 선배 옆자리에서 묻고 싶었던 걸 마저 물었어요.</p>
      <div class="trio3">${ph("09","t","")}${ph("10","t","")}${ph("11","t","")}</div>
    </section>
    <section class="st">
      <h2>학장님도<br>함께해 주셨어요</h2>
      <p>김추연 지도교수님뿐 아니라 유재욱 경영대학장님께서도 직접 참석해 학회에 대한 지원과 관심을 약속해 주셨어요.<br>학회 행사에 학장님이 오시는 일은 거의 없어서, 더 뜻깊은 자리였어요.</p>
    </section>
    <section class="st next">
      <h2>다음은<br>여러분 차례예요</h2>
      <p>오늘 무대에 선 선배들도 몇 년 전에는 여러분과 같은 자리에 앉아 있었어요.<br>원하는 자리에 가게 되면, 그때는 여러분이 돌아와 주세요.<br>후배들 앞에서 길을 들려주고, 기회를 나눠 주는 선배로요.<br>KUSC는 그렇게 이어지는 학회예요.</p>
    </section>
    <p class="hint" id="galnote" style="text-align:center">사진을 누르면 크게 볼 수 있어요.</p>
    <div class="row" style="justify-content:center"><a class="btn sec sm" href="apply.html">그날의 신청 기록 보기</a></div>
  </div>`+foot();
  galRender();
}
function viewClass(){
  const p=S.prof, g=p.progress||{}, done=[!!p.diag,!!g.l2,!!g.l3,!!g.l4];
  const mark=k=>`data-mark="${k}"`, ok=i=>done[i]?' <span class="badge ku">완료</span>':"";
  app.innerHTML = header("강의실","강의마다 쓰는 도구와 자료를 모았어요.")+`
  <div class="grid">
    <section class="card lec">
      <div class="art"><svg viewBox="0 0 220 140" width="220" height="140" aria-hidden="true">
        <polygon points="110,14 186,52 186,108 110,136 34,108 34,52" fill="none" stroke="var(--line)" stroke-width="2"/>
        <polygon points="110,40 160,62 160,98 110,114 60,98 60,62" fill="none" stroke="var(--line)" stroke-width="2"/>
        <polygon points="110,30 172,58 150,102 110,124 52,94 76,62" fill="rgba(3,107,63,.18)" stroke="var(--ku)" stroke-width="3" stroke-linejoin="round"/></svg></div>
      <div class="lesson" style="margin-top:20px">1강 · 전략 직무 정의하기${ok(0)}</div>
      <h2 style="margin-top:4px">직무 성향 진단</h2>
      <p class="desc">일상 속 상황 17개로 나의 역량 모양을 그리고, 여섯 전략 직무 중 어디와 닮았는지 확인해요.</p>
      <a class="go" href="${p.diag?"#growth":diagHref("new")}">${p.diag?"처음과 지금 비교하기":"진단 시작하기"}<b>→</b></a>
    </section>
    <section class="card lec">
      <div class="art" id="cast"></div>
      <div class="lesson" style="margin-top:20px">2강 · 전략 직무 구조화하기${ok(1)}</div>
      <h2 style="margin-top:4px">전략 직무 시뮬레이션</h2>
      <p class="desc">디저트 브랜드 ‘하프’가 매각되기까지 7년. 회사가 커질 때마다 어떤 직무가 왜 필요해지는지 따라가요.</p>
      <a class="go" href="simulation.html" ${mark("l2")}>시뮬레이션 열기<b>→</b></a>
    </section>
    <section class="card lec l3">
      <div class="lesson">3강 · 전략 직무 검증하기${ok(2)}</div>
      <h2 style="margin-top:4px">여섯 직무 현직자 강연</h2>
      <p class="desc">10월 28일, 여섯 직무의 현직자 선배들과 학회원, 비학회원 약 ${L3_INFO.attended}명이 함께한 경영대학 공동 행사였어요.</p>
      <div class="spkmini">${L3_INFO.speakers.map(([j,n,c,lg])=>`<span><small>${esc(j)}</small>${esc(n)}<img src="img/logo/${lg}.png" alt="${esc(c)}" title="${esc(c)}"></span>`).join("")}</div>
      <a class="go" href="#l3" ${mark("l3")}>그날의 현장 돌아보기<b>→</b></a>
    </section>
    <section class="card lec">
      <div class="lesson">4강 · 전략 직무 진입하기${ok(3)}</div>
      <h2 style="margin-top:4px">서류 양식과 작성 요령</h2>
      <p class="desc">국문 이력서와 영문 레쥬메 양식, 그리고 옆에 펴 두고 보는 작성 요령이에요.</p>
      <div class="files">${FILES.map(f=>`<div class="file"><div class="ic ${f.ext==="DOC"?"doc":""}">${f.ext}</div>
        <div class="t"><b>${f.n}</b><small>${f.s}</small></div>
        <a class="btn ${f.ext==="PDF"?"sec":"pri"} sm" href="${f.href}" ${f.ext==="PDF"?'target="_blank" rel="noopener"':`download="${f.save}"`} ${mark("l4")}>${f.ext==="PDF"?"보기":"받기"}</a></div>`).join("")}</div>
    </section>
  </div>
  <section class="card" id="fbcard">
    <div class="lesson">강의 후기</div>
    <h2 style="margin-top:4px">${SURVEY.title}</h2>
    <p class="desc">${SURVEY.intro}</p>
    <div id="fbgo" style="margin-top:16px"><div class="skel" style="height:52px"></div></div>
  </section>`+foot();
  if(S.prof.master && !S.prof.viewAs){ const g=$("#fbgo"); if(g) g.innerHTML=`<p class="hint" style="margin:0">마스터 계정은 응답하지 않아요. 응답은 운영실의 강의 후기 탭에서 볼 수 있어요.</p>`; }
  else F.getFeedbackDone(myUid(), SURVEY.term).then(done=>{ const g=$("#fbgo"); if(!g) return;
    g.innerHTML = done ? `<p class="ok" style="margin:0">후기를 남겨 주셔서 고마워요. 다음 학기 설계에 그대로 쓸게요.</p>`
      : `<a class="btn pri" href="#feedback">후기 남기기</a>`; }).catch(()=>{ const g=$("#fbgo"); if(g) g.innerHTML=`<a class="btn pri" href="#feedback">후기 남기기</a>`; });
  if(typeof chr==="function") $("#cast").innerHTML=["VC","PM","BP","CS","PE","IB"].map(k=>chr(k)).join("");
  $$("[data-mark]").forEach(a=>a.addEventListener("click",()=>{ const k=a.dataset.mark;
    if(!(S.prof.progress||{})[k]){ F.markProgress(S.user.uid,k).catch(()=>{}); S.prof.progress={...(S.prof.progress||{}),[k]:new Date().toISOString()}; } }));
}

/* ───────── 내 역량의 변화: 처음과 지금 비교 + 목표 실행 기록 ───────── */
/* 점수 대신 단계와 말로 보여 줌 (역량마다 0~50) */
const LEVEL = v => v>=45?"두드러진 강점":v>=35?"강점":v>=25?"보통":v>=13?"기초":"시작 단계";
const CHANGE = d => d>=12?["크게 늘었어요","up"]:d>=4?["늘었어요","up"]:d>-4?["비슷해요",""]:d>-12?["줄었어요","down"]:["크게 줄었어요","down"];
/* 목표 기록 요약 문장 */
function goalLine(goals, T, short){
  const n=goals.length; if(!n) return "";
  const c={done:0,doing:0}; goals.forEach(g=>{ const s=(T[g.t]||{}).status; if(c[s]!==undefined) c[s]++; });
  if(!c.done && !c.doing) return short?`아직 시작한 목표가 없어요.`:`학기 초에 정한 목표 ${n}개, 얼마나 했는지 아직 기록하지 않았어요.`;
  if(c.done===n) return short?`${n}개 모두 해냈어요.`:`학기 초에 정한 목표 ${n}개를 모두 해냈어요.`;
  const parts=[]; if(c.done) parts.push(`${c.done}개는 해냈고`); if(c.doing) parts.push(`${c.doing}개는 하는 중`);
  let t=parts.join(", "); t=t.endsWith("해냈고")?t.slice(0,-1)+"어요":t+"이에요";
  return short?`${n}개 중 ${t}.`:`학기 초에 정한 목표 ${n}개 중 ${t}.`;
}
async function goalsDoc(p){
  const gid=p.master?"lab":(p.viewAs||S.user.uid);
  if(S.gtFor!==gid){ S.gtFor=gid;
    if(p.master) S.gd={track:p.goalTrack||{}};
    else if(String(gid).startsWith("r:")) S.gd={};
    else { try{ S.gd=(await F.getGoals(gid))||{}; }catch(e){ S.gd={}; } } }
  return S.gd||{};
}
/* ───────── 목표 트래킹: 상태는 바로 저장, 기록은 덮어쓰지 않고 쌓임 ─────────
   저장 형태 track[목표 이름] = { status, at, log:[{t, kind:"status"|"note", status?, text?}] } */
const GST={todo:"아직",doing:"하는 중",done:"해냈어요"};
/* 가장 닮은 직무가 원하는 직무와 같으면 축하 표시 (다르면 아무 표시 안 함) */
const matchBadge=(r,newly)=>(r&&r.fit&&r.want&&r.want!=="NONE"&&r.fit===r.want)?`<span class="match">✓ 원하는 직무와 일치해요${newly?"<em>이번에 처음</em>":""}</span>`:"";
/* 기록 시각: 날짜와 시간까지 */
const stamp=t=>{ const d=toD(t); return d&&!isNaN(d)?`${day(d)} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`:""; };
const GEV={todo:"아직 시작 전으로 바꿨어요",doing:"시작했어요",done:"해냈어요"};
const clone=o=>JSON.parse(JSON.stringify(o||{}));
const ago=t=>{ const d=Math.floor((Date.now()-new Date(t).getTime())/864e5); return d<=0?"오늘":d===1?"어제":`${d}일 전`; };
function gNorm(v){ v=v||{}; const log=Array.isArray(v.log)?v.log.slice():[];
  /* 예전 형태(상태 + 메모 한 칸)는 첫 기록으로 옮김 */
  if(!log.length){ const t=v.at||new Date().toISOString(); if(v.status&&v.status!=="todo") log.push({t,kind:"status",status:v.status}); if(v.note&&v.note.trim()) log.push({t,kind:"note",text:v.note.trim()}); }
  return {status:v.status||"todo", at:v.at||"", log}; }
function gNotes(v){ return v.log.filter(e=>e.kind==="note"); }
function gLast(v){ return v.log.length?v.log[v.log.length-1].t:""; }
function gBar(goals,T,ro){ return `<div class="gprog" role="group" aria-label="목표 진행">${goals.map((g,i)=>{ const s=T[g.t].status;
  return `<button class="${s}" data-gx="${i}" aria-label="${i+1}번 목표, ${GST[s]}" title="${esc(g.t)}"><span>${s==="done"?"✓ ":""}${i+1}</span></button>`; }).join("")}</div>
  <div class="glegend"><span><i class="done"></i>해냈어요</span><span><i class="doing"></i>하는 중</span><span><i class="todo"></i>아직</span></div>`; }
function gTimeline(v, i, ro, limit){
  const L=v.log.slice().reverse(), shown=limit?L.slice(0,limit):L;
  if(!L.length) return `<p class="hint gempty">아직 남긴 기록이 없어요.</p>`;
  return `<ol class="tl">${shown.map(e=>e.kind==="status"
    ? `<li class="ev ${e.status}"><span class="d">${stamp(e.t)}</span><span>${GEV[e.status]||""}</span></li>`
    : `<li class="nt"><span class="d">${stamp(e.t)}</span><p>${nl(e.text)}</p>${ro?"":`<button class="x" data-gd="${i}" data-t="${esc(e.t)}">지우기</button>`}</li>`).join("")}</ol>`;
}
/* box: 그릴 자리, mode: "home"(접어서) | "full"(펼쳐서 전체 기록) */
function goalsUI(box, goals, p, mode){
  if(!box) return;
  const ro=!!p.viewAs;
  const T=clone((S.gd&&S.gd.track)||p.goalTrack||{}); goals.forEach(g=>{ T[g.t]=gNorm(T[g.t]); });
  if(!box._open) box._open=new Set(mode==="full"?goals.map((_,i)=>i):[]);
  const open=box._open;
  const lastAll=goals.map(g=>gLast(T[g.t])).filter(Boolean).sort().pop();
  const idle=lastAll?Math.floor((Date.now()-new Date(lastAll).getTime())/864e5):null;
  box.innerHTML=`<div class="gsum"><p><b>${goalLine(goals,T,true)}</b></p>${gBar(goals,T,ro)}</div>
    ${!ro&&idle!==null&&idle>=14?`<p class="gnudge">마지막 기록이 ${idle}일 전이에요.<br>요즘 한 일을 한 줄 남겨 보세요.</p>`:""}
    ${goals.map((g,i)=>{ const v=T[g.t], n=gNotes(v).length, op=open.has(i);
      return `<div class="gitem ${op?"open":""}" id="gi${i}">
        <button class="ghead" data-gx="${i}" aria-expanded="${op}">
          <span class="gn ${v.status}">${v.status==="done"?"✓":i+1}</span>
          <span class="gt"><b>${esc(g.t)}</b><small>${n?`기록 ${n}개, 마지막 ${ago(gLast(v))}`:"아직 기록이 없어요"}</small></span>
          <span class="gpill ${v.status}">${GST[v.status]}</span></button>
        ${op?`<div class="gbody">
          <p class="hint">기준: ${esc(g.goal||"")}</p>
          ${ro?"":`<div class="seg3" role="radiogroup" aria-label="진행 상태">${["todo","doing","done"].map(k=>`<button class="${v.status===k?"on "+k:""}" data-gs="${i}" data-v="${k}" role="radio" aria-checked="${v.status===k}">${GST[k]}</button>`).join("")}</div>
          <div class="gadd"><textarea id="ga${i}" rows="2" placeholder="오늘 한 일이나 다음에 할 일을 짧게 남겨 두세요"></textarea><button class="btn pri sm" data-ga="${i}">기록 남기기</button></div>`}
          ${gTimeline(v,i,ro,mode==="home"?3:0)}
          ${mode==="home"&&v.log.length>3?`<a class="hint more" href="#growth">지난 기록 모두 보기</a>`:""}
        </div>`:""}</div>`; }).join("")}
    <p class="gtoast" role="status" aria-live="polite"></p>`;
  const flash=(m,bad)=>{ const t=box.querySelector(".gtoast"); if(!t) return; t.textContent=m; t.className="gtoast show"+(bad?" bad":""); clearTimeout(box._ft); box._ft=setTimeout(()=>{ t.className="gtoast"; },1800); };
  const save=async(next,msg)=>{ const prev=(S.gd&&S.gd.track)||p.goalTrack||{};
    S.gd={...(S.gd||{}), track:clone(next)}; p.goalTrack=clone(next); goalsUI(box,goals,p,mode);
    try{ await (p.master?F.setLab(S.user.uid,{goalTrack:next}):F.setGoalTrack(S.user.uid,next)); flash(msg); }
    catch(e){ S.gd={...(S.gd||{}), track:clone(prev)}; p.goalTrack=clone(prev); goalsUI(box,goals,p,mode); flash(authMsg(e),true); } };
  box.querySelectorAll("[data-gx]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.gx;
    if(b.classList.contains("ghead")){ open.has(i)?open.delete(i):open.add(i); }
    else open.add(i);
    goalsUI(box,goals,p,mode); const el=box.querySelector("#gi"+i); if(el && !b.classList.contains("ghead")) el.scrollIntoView({block:"nearest",behavior:"smooth"}); });
  if(ro) return;
  box.querySelectorAll("[data-gs]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.gs, k=b.dataset.v, g=goals[i], v=T[g.t];
    if(v.status===k) return;
    const now=new Date().toISOString(), last=v.log[v.log.length-1];
    /* 10분 안에 상태를 다시 바꾸면 기록을 하나로 합침 */
    if(last && last.kind==="status" && Date.now()-new Date(last.t).getTime()<6e5) v.log.pop();
    const before=v.log.filter(e=>e.kind==="status").pop(), base=before?before.status:"todo";
    if(k!==base) v.log.push({t:now,kind:"status",status:k});
    v.status=k; v.at=now; save(T, k==="done"?"해냈어요로 바꿨어요":`'${GST[k]}'으로 바꿨어요`); });
  box.querySelectorAll("[data-ga]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.ga, ta=box.querySelector("#ga"+i), txt=(ta.value||"").trim();
    if(!txt){ ta.focus(); return; }
    const g=goals[i], v=T[g.t], now=new Date().toISOString();
    v.log.push({t:now,kind:"note",text:txt.slice(0,1000)});
    /* 아직인데 기록을 남기면 시작한 걸로 봄 */
    if(v.status==="todo"){ v.status="doing"; v.log.splice(v.log.length-1,0,{t:now,kind:"status",status:"doing"}); }
    v.at=now; save(T,"기록을 남겼어요"); });
  box.querySelectorAll("[data-gd]").forEach(b=>b.onclick=()=>{
    if(!b.classList.contains("arm")){ b.classList.add("arm"); b.textContent="한 번 더 누르면 지워요"; setTimeout(()=>{ if(b.isConnected){ b.classList.remove("arm"); b.textContent="지우기"; } },3000); return; }
    const i=+b.dataset.gd, g=goals[i], v=T[g.t]; v.log=v.log.filter(e=>!(e.kind==="note"&&e.t===b.dataset.t)); save(T,"기록을 지웠어요"); });
}

async function viewGrowth(){
  const p=S.prof;
  if(S.gtFor!==(p.master?"lab":(p.viewAs||S.user.uid))) app.innerHTML=header("내 역량의 변화","")+`<div class="skel"></div>`+foot();
  const gd=await goalsDoc(p);
  const H=(p.diagHist&&p.diagHist.length) ? [...p.diagHist].sort((x,y)=>String(x.ts).localeCompare(String(y.ts))) : (p.diag?[{...p.diag}]:[]);
  /* 마스터 미리보기로 해 본 학기말 진단: 이 창에서만 지금 결과로 겹쳐 보여 줌 */
  let pvRec=null; if(p.viewAs){ try{ pvRec=JSON.parse(sessionStorage.getItem("kusc:preview:"+p.viewAs)||"null"); }catch(e){} }
  if(pvRec && H.length) H.push({...F.diagSummary(pvRec), preview:true});
  if(!H.length){ app.innerHTML=header("내 역량의 변화","")+`<section class="card"><p class="desc">아직 진단 기록이 없어요.<br>1강 직무 성향 진단을 먼저 해 주세요.</p>
    <div class="row" style="margin-top:14px"><a class="btn pri" href="${diagHref("new")}">진단 시작하기</a></div></section>`+foot(); return; }
  const f=H[0], l=H[H.length-1], two=H.length>1;
  const goals=(f.goals&&f.goals.length)?f.goals:((p.diag&&p.diag.goals)||[]);
  const sum=a=>(a||[]).reduce((x,y)=>x+(+y||0),0);
  const sign=n=>n>0?`+${n}`:`${n}`;
  app.innerHTML = header("내 역량의 변화","학기 초 진단과 지금을 나란히 놓고, 그때 정한 목표를 얼마나 해냈는지 기록해요.")+`
  <section class="card">
    <div class="lesson">${two?`처음 ${day(f.ts)} → ${l.preview?"마스터 미리보기":"지금"} ${day(l.ts)}`:`처음 진단 ${day(f.ts)}`}</div>
    <h2 style="margin-top:4px">${two?"처음과 지금, 이렇게 달라졌어요":"학기말에 한 번 더 진단해 보세요"}</h2>
    ${l.preview?`<p class="desc">방금 마스터 미리보기로 해 본 진단을 지금 결과로 겹쳐 보여 드리고 있어요.<br>이 결과는 저장되지 않았고, 이 창을 닫으면 사라져요.</p>
      <div class="row" style="margin-top:10px"><button class="btn sec sm" id="pvclr">미리보기 지우기</button></div>`:""}
    ${two?"":`<p class="desc">같은 진단을 다시 하면 처음 결과와 겹쳐서 비교해 드려요.<br>진단은 몇 번이든 할 수 있고, 할 때마다 기록이 쌓여요.</p>`}
    <div class="hexwrap">${two?hexCmp(f.a,l.a):hexSVG(f.a)}
      <div class="facts">
        ${two?`<div class="legend2"><span><i class="ln0"></i>처음</span><span><i class="ln1"></i>지금</span></div>`:""}
        <div class="fact"><small>가장 닮은 직무</small><b>${esc(JOBNAME[f.fit]||f.fit||"-")}${two&&l.fit!==f.fit?` → ${esc(JOBNAME[l.fit]||l.fit)}`:""}</b>${matchBadge(two?l:f, two&&!(f.fit&&f.want&&f.fit===f.want))}</div>
        <div class="fact"><small>원하는 직무</small><b>${esc(JOBNAME[f.want]||f.want||"-")}${two&&l.want!==f.want?` → ${esc(JOBNAME[l.want]||l.want)}`:""}</b></div>
      </div></div>
    ${two?(()=>{ const ch=AXES.map((t,i)=>(+(l.a[i]||0))-(+(f.a[i]||0))), up=ch.filter(x=>x>=4).length, dn=ch.filter(x=>x<=-4).length;
      const sum1=up&&dn?`여섯 역량 중 ${up}개는 늘고, ${dn}개는 줄었어요.`:up?`여섯 역량 중 ${up}개가 늘었어요.`:dn?`여섯 역량 중 ${dn}개가 줄었어요.`:"여섯 역량 모두 처음과 비슷해요.";
      return `<p class="desc" style="margin-top:14px"><b>${sum1}</b></p>
      <div class="scroll"><table class="tbl"><tr><th>역량</th><th>처음</th><th>지금</th><th>변화</th></tr>
      ${AXES.map((t,i)=>{ const [w,c]=CHANGE(ch[i]); return `<tr><td>${t}</td><td>${LEVEL(+(f.a[i]||0))}</td><td><b>${LEVEL(+(l.a[i]||0))}</b></td><td class="${c}">${w}</td></tr>`; }).join("")}</table></div>
      <p class="hint" style="margin-top:8px">단계는 역량마다 고른 답을 다섯 단계로 나눈 거예요.<br>시작 단계, 기초, 보통, 강점, 두드러진 강점 순으로 높아요.<br>변화는 같은 역량에서 처음과 지금 고른 답이 얼마나 달라졌는지 보여 줘요.<br>같은 단계 안에서도 늘거나 줄 수 있어요.</p>`; })():""}
    <div class="gos"><a class="go" href="${diagHref("new")}">${two?"한 번 더 진단하기":"학기말 진단하고 비교하기"}<b>→</b></a><a class="go" href="${diagHref("view")}">최근 결과 자세히 보기<b>→</b></a></div>
  </section>
  <section class="card" id="goals">
    <h2>학기 초에 정한 목표, 어디까지 왔나요?</h2>
    <p class="desc">처음 진단이 제안한 세 가지 목표예요.<br>상태를 누르면 바로 저장돼요.<br>한 일을 남길 때마다 기록이 지워지지 않고 쌓이고, 가장 최근 기록이 맨 위에 보여요.<br>${p.master?"마스터 테스트 공간이라 여기 기록은 나만 봐요.":"남긴 기록은 나와 백재웅 선배만 볼 수 있어요."}<br>학기말에 레쥬메를 쓸 때 이 기록이 그대로 재료가 돼요.</p>
    ${goals.length?`<div id="gbox" style="margin-top:16px"></div>`
      :`<p class="desc" style="margin-top:12px">처음 진단의 목표를 불러오는 중이에요.<br>1강 결과 화면을 한 번 열면 여기에 채워져요.</p><div class="row"><a class="btn sec sm" href="${diagHref("view")}">결과 화면 열기</a></div>`}
  </section>
  ${H.length>1?`<section class="card"><h3>진단 기록</h3>
    <div class="scroll"><table class="tbl"><tr><th>날짜</th><th>가장 닮은 직무</th><th>가장 강한 역량</th></tr>
    ${H.map(h=>`<tr><td>${day(h.ts)}${h.preview?" (미리보기)":""}</td><td>${esc(JOBNAME[h.fit]||h.fit||"")}</td><td>${(h.a&&h.a.length)?AXES[h.a.indexOf(Math.max(...h.a))]:""}</td></tr>`).join("")}</table></div></section>`:""}`+foot();
  if($("#pvclr")) $("#pvclr").onclick=()=>{ try{ sessionStorage.removeItem("kusc:preview:"+p.viewAs); }catch(e){} viewGrowth(); };
  if(goals.length) goalsUI($("#gbox"), goals, p, "full");
  if(location.hash==="#growth/goals"){ const g=$("#goals"); if(g) g.scrollIntoView({block:"start"}); }
}

/* ───────── 커리큘럼 피드백 설문 ───────── */
const ETC = "기타";
/* 엑셀에 쓰는 열: 질문마다 한 열, 행이 있는 질문은 행마다 한 열 */
function fbColumns(){ const cols=[]; let i=0;
  allQs().forEach(q=>{ i++; if(q.type==="grid") allRows(q).forEach(r=>cols.push([q.id,r,`${i}. ${q.q} - ${r}`])); else cols.push([q.id,null,`${i}. ${q.q}`]); });
  return cols; }
function fbRow(ans, cols){ return cols.map(([id,row])=>{ const v=(ans||{})[id]; return row?((v||{})[row]||""):Array.isArray(v)?v.join(" / "):(v===undefined?"":v); }); }
function sheetFeedback(ans, who, tag=""){   /* 응답 기록 사본. tag가 있으면 '_tag' 탭에 따로 쌓임(미저장 응답 구조용) */
  const cols=fbColumns();
  const body=JSON.stringify({type:"feedback",term:SURVEY.term+(tag?"_"+tag:""),cols:["이름","학번",...(tag?["계정","상태"]:[]),...cols.map(c=>c[2])],
    row:[who.name||"","'"+(who.sid||""),...(tag?[who.email||who.uid||"",who.status||tag]:[]),...fbRow(ans,cols)]});   /* 원래 탭은 열 구성을 그대로 둠 */
  const once=()=>new Promise(res=>{ const t=setTimeout(()=>res(false),8000);
    try{ fetch(ENDPOINT,{method:"POST",mode:"no-cors",keepalive:body.length<60000,headers:{"Content-Type":"text/plain;charset=utf-8"},body})
      .then(()=>{ clearTimeout(t); res(true); },()=>{ clearTimeout(t); res(false); }); }catch(e){ clearTimeout(t); res(false); } });
  return once().then(ok=>ok||new Promise(r=>setTimeout(r,1500)).then(once));
}
/* 쓰던 후기는 이 기기에 계속 저장해 둠. 보내다 실패해도 답이 날아가지 않게 */
const fbKey=()=>"kusc:fb:"+((S.user&&S.user.uid)||"")+":"+SURVEY.term;
function fbDraftSave(st){ try{ localStorage.setItem(fbKey(), JSON.stringify({p:st.p,a:st.a})); }catch(e){} }
function fbDraftLoad(){ try{ const d=JSON.parse(localStorage.getItem(fbKey())||"null"); if(d&&d.a) return {p:d.p||0,a:d.a}; }catch(e){} return null; }
function fbDraftClear(){ try{ localStorage.removeItem(fbKey()); }catch(e){} }
const withTimeout=(pr,ms)=>Promise.race([pr,new Promise((_,rej)=>setTimeout(()=>rej({code:"timeout"}),ms))]);
const SCALE = ["1","2","3","4","5"];
function fbAnswers(a){   /* 화면용 임시 값(a)을 저장용 답으로 정리. 안 보인 질문은 버림 */
  const out={};
  for(const q of allQs()){
    if(!shown(q,a)) continue;
    if(q.type==="grid"){ const o={}; rowsOf(q,a).forEach(r=>{ if(a[q.id+"|"+r]!==undefined) o[r]=a[q.id+"|"+r]; }); if(Object.keys(o).length) out[q.id]=o; continue; }
    let v=a[q.id]; if(v===undefined||(typeof v==="string"&&!v.trim())||(Array.isArray(v)&&!v.length)) continue;
    if(q.etc){ const t=(a[q.id+"_etc"]||"").trim();
      if(Array.isArray(v)) v=v.map(x=>x===ETC?(t?ETC+": "+t:ETC):x); else if(v===ETC) v=t?ETC+": "+t:ETC; }
    out[q.id]= q.type==="nps" ? Number(v) : (typeof v==="string" ? v.trim() : v);
  }
  return out;
}
function fbMissing(q,a){
  if(!q.req || !shown(q,a)) return false;
  if(q.type==="grid") return rowsOf(q,a).some(r=>a[q.id+"|"+r]===undefined);
  const v=a[q.id]; if(v===undefined||(typeof v==="string"&&!v.trim())||(Array.isArray(v)&&!v.length)) return true;
  if(q.optsFrom && !optsOf(q,a).includes(v)) return true;
  if(q.etc && (v===ETC||(Array.isArray(v)&&v.includes(ETC))) && !(a[q.id+"_etc"]||"").trim()) return true;
  return false;
}
function fbNumber(a){ const m={}; let n=0; allQs().forEach(q=>{ if(shown(q,a)) m[q.id]=++n; }); return m; }
function fbQuestion(q,a,no){
  const head=`<label class="l">${no}. ${esc(q.q)}${q.req?'<span class="req">*</span>':""}${q.sub?`<span class="opt">${esc(q.sub)}</span>`:""}</label>`;
  if(q.type==="one"||q.type==="many"){
    const opts=[...optsOf(q,a), ...(q.etc?[ETC]:[])];
    const showEtc=q.etc && (a[q.id]===ETC || (Array.isArray(a[q.id])&&a[q.id].includes(ETC)));
    return `<div class="field fq">${head}${chips(q.id,opts,q.type==="many",a)}
      ${showEtc?`<input type="text" class="etc" id="${q.id}_etc" placeholder="직접 적어 주세요" value="${esc(a[q.id+"_etc"]||"")}">`:""}</div>`;
  }
  if(q.type==="scale"){
    return `<div class="field fq">${head}<p class="hint" style="margin:2px 0 10px">1 = ${esc(q.lo)}, 5 = ${esc(q.hi)}</p>
      <div class="sc">${chips(q.id,[...SCALE,...(q.na?[q.na]:[])],false,a)}</div></div>`;
  }
  if(q.type==="grid"){
    const sc=[...SCALE,...(q.na?[q.na]:[])];
    return `<div class="field fq">${head}<p class="hint" style="margin:2px 0 10px">1 = ${esc(q.lo)}, 5 = ${esc(q.hi)}</p>
      ${rowsOf(q,a).map(r=>`<div class="grow"><div class="gl">${esc(r)}</div>${chips(q.id+"|"+r,sc,false,a)}</div>`).join("")}</div>`;
  }
  if(q.type==="nps"){
    return `<div class="field fq">${head}<p class="hint" style="margin:2px 0 10px">0 = 전혀 추천하지 않음, 10 = 적극 추천</p>
      <div class="sc">${chips(q.id,Array.from({length:11},(_,i)=>String(i)),false,a)}</div></div>`;
  }
  return `<div class="field fq">${head}<textarea id="${q.id}" rows="${q.rows||4}" placeholder="${esc(q.ph||"")}">${esc(a[q.id]||"")}</textarea></div>`;
}
async function viewFeedback(){
  if(S.prof.master && !S.prof.viewAs){ location.hash="#class"; return; }
  const T=SURVEY, st=S.fb||(S.fb=fbDraftLoad()||{p:0,a:{}});
  if(st.done===undefined){ app.innerHTML=header("","")+`<div class="skel"></div>`; try{ st.done=await F.getFeedbackDone(myUid(),T.term); }catch(e){ st.done=false; } }
  if(st.done){ app.innerHTML=header("강의 후기","")+`<section class="card"><h2>${st.justSent?"후기가 저장됐어요":"이미 후기를 남겼어요"}</h2>
      <p class="desc">${esc(T.title)}에 답해 줘서 고마워요.${st.justSent?` 저장 확인: ${esc(st.justSent)}`:" 한 학기에 한 번만 낼 수 있어요."}</p>
      <div class="row" style="margin-top:18px"><a class="btn pri" href="#class">강의실로</a></div></section>`+foot(); return; }
  fbDraftSave(st);
  const a=st.a, P=T.pages, page=P[st.p], num=fbNumber(a), vis=page.qs.filter(q=>shown(q,a));
  app.innerHTML = header("","")+`<section class="card" style="margin-top:22px">
    <div class="steps">${P.map((_,i)=>`<i class="${i<=st.p?"on":""}"></i>`).join("")}</div>
    <div class="stepname">${st.p+1} / ${P.length} · ${esc(page.t)}</div>
    ${st.p===0?`<h2>${esc(T.title)}</h2><p class="desc">${esc(T.intro)}</p>
      <ul class="fbnote">${T.notes.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`
      :`<h2>${esc(page.t.replace(/^[A-Z]\.\s*/,""))}</h2>`}
    ${page.d?`<p class="desc" style="margin-top:${st.p===0?14:4}px">${esc(page.d)}</p>`:""}
    ${vis.map(q=>fbQuestion(q,a,num[q.id])).join("")}
    <p class="err" id="err"></p>
    <div class="row" style="margin-top:24px"><button class="btn sec" id="back" style="flex:0 0 96px">${st.p===0?"나가기":"이전"}</button>
      <button class="btn pri" id="next" style="flex:1">${st.p===P.length-1?"후기 보내기":"다음"}</button></div>
  </section>`+foot();
  const keep=()=>{ vis.forEach(q=>{ if(q.type==="text"){ const e=$("#"+q.id); if(e) a[q.id]=e.value; } const t=$("#"+q.id+"_etc"); if(t) a[q.id+"_etc"]=t.value; }); fbDraftSave(st); };
  $$("textarea, input").forEach(x=>x.addEventListener("input",()=>{ clearTimeout(st._t); st._t=setTimeout(keep,400); }));
  const before={}; vis.forEach(q=>{ if(q.none) before[q.id]=[...(a[q.id]||[])]; });
  bindChips(a, ()=>{ keep();
    vis.forEach(q=>{ if(!q.none) return; const now=a[q.id]||[];   /* '아직 없음' 같은 선택지는 다른 것과 같이 못 고름 */
      if(now.includes(q.none) && !before[q.id].includes(q.none)) a[q.id]=[q.none];
      else if(now.includes(q.none) && now.length>1) a[q.id]=now.filter(x=>x!==q.none); });
    viewFeedback(); });
  $("#back").onclick=()=>{ keep(); if(st.p===0){ location.hash="#class"; } else { st.p--; viewFeedback(); scrollTo(0,0); } };
  $("#next").onclick=async()=>{
    keep();
    const miss=vis.find(q=>fbMissing(q,a));
    if(miss) return showErr(`${num[miss.id]}번 질문에 답해 주세요`);
    if(st.p<P.length-1){ st.p++; viewFeedback(); scrollTo(0,0); return; }
    const b=$("#next"); b.disabled=true; b.textContent="보내는 중…";
    const ans=fbAnswers(a), who={name:S.prof.name, sid:S.prof.sid, uid:S.user.uid, email:S.user.email||""};
    try{
      await withTimeout(F.submitFeedback(S.user.uid, T.term, ans, who), 20000);
      const ok=await withTimeout(F.getFeedbackDone(S.user.uid, T.term), 10000).catch(()=>true);   /* 서버에 진짜 들어갔는지 한 번 더 확인 */
      if(!ok) throw {code:"not-saved"};
      b.textContent="기록 사본 남기는 중…"; await sheetFeedback(ans, who);
      F.setAttendance(S.user.uid, TERM, ans.a4||[]).catch(()=>{}); fbDraftClear();
      const t=new Date(); S.fb={done:true, justSent:`${t.getMonth()+1}월 ${t.getDate()}일 ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`};
      viewFeedback(); scrollTo(0,0);
    }
    catch(e){
      const code=(e&&e.code)||String(e&&e.message||e||"unknown");
      if(code==="view-only"){ b.disabled=false; b.textContent="후기 보내기"; return showErr(authMsg(e)); }
      /* 저장이 막혀도 답은 운영진 시트로 따로 보내 살려 둠 */
      const rescued=await sheetFeedback(ans, {...who, status:"저장 실패: "+code}, "미저장");
      b.disabled=false; b.textContent="다시 보내기";
      showErr(`저장이 안 됐어요 (${code}).${rescued?" 답은 운영진에게 따로 전달했어요.":""} 쓴 답은 이 기기에 남아 있어요. 다시 보내기를 눌러 주시고, 또 안 되면 이 화면을 캡처해 임원진에게 보내 주세요. 로그인 계정: ${S.user.email||S.user.uid}`);
    }
  };
}

/* ───────── 내 정보 ───────── */
function viewMe(){
  if(S.prof.master){
    app.innerHTML = header("내 정보","")+`<section class="card"><div class="lesson">마스터 계정</div>
      <h2 style="margin-top:4px">${esc(S.prof.name)}</h2><p class="desc">${esc(S.user.email||"")}</p>
      <p class="desc" style="margin-top:10px">학회원이 아닌 관리자 계정이라 회원 정보, 회비, 진단 기록이 없어요.</p>
      <div class="row" style="margin-top:16px"><a class="btn pri sm" href="admin.html">운영실로 가기</a><button class="btn sec sm" data-out>로그아웃</button></div></section>`+foot();
    return;
  }
  const p=S.prof, d=S.me||(S.me={phone:p.phone||"",grade:p.grade||"",age:p.age||"",gender:p.gender||"",major:p.major||"",major2:p.major2||"",jobs:[...(p.jobs||[])],stage:p.stage||""});
  const provider = (S.user.providerData[0]||{}).providerId==="google.com" ? "구글 계정" : "이메일";
  const dues = Object.entries(p.dues||{}).sort((a,b)=>b[0].localeCompare(a[0]));
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  app.innerHTML = header("내 정보","")+`
  <section class="card">
    <h2>기본 정보</h2>
    <div class="two">${field("n","이름",p.name,{ro:1})}${field("s","학번",p.sid,{ro:1})}</div>
    <p class="hint">이름과 학번은 학회원 명단과 연결돼 있어요. 바꿔야 하면 임원진에게 알려주세요.</p>
    ${field("phone","휴대폰 번호",d.phone,{type:"tel",num:1})}
    <div class="field"><label class="l">학년</label>${chips("grade",GRADES,false,d)}</div>
    <div class="two">${field("age","나이",d.age,{num:1})}<div class="field"><label class="l">성별</label>${chips("gender",GENDERS,false,d)}</div></div>
    ${field("major","주전공",d.major)}${field("major2","복수·부전공",d.major2)}
    <div class="field"><label class="l">관심 직무</label>${chips("jobs",[...JOBS,"아직 모르겠다"],true,d)}</div>
    <div class="field"><label class="l">준비 단계</label>${chips("stage",STAGES,false,d)}</div>
    <p class="err" id="err"></p><p class="ok" id="saved" style="display:none">저장했어요</p>
    <div class="row"><button class="btn pri" id="save">저장하기</button></div>
  </section>
  <div class="grid">
    <section class="card">
      <h3>회비 납부 기록</h3>
      ${dues.length?dues.map(([t,at])=>`<div class="kv"><span>${esc(t.replace("-","년 "))}학기</span><b>${day(at)} 확인</b></div>`).join(""):`<p class="desc">아직 확인된 기록이 없어요.</p>`}
      <p class="hint">학기 회비 ${DUES}. 입금 계좌는 소식의 정산 공지에 있어요.</p>
    </section>
    <section class="card">
      <h3>앱처럼 쓰기</h3>
      <p class="desc">${ios?"사파리 아래 <b>공유 버튼(네모에 화살표)</b>을 누르고 <b>홈 화면에 추가</b>를 고르면 앱처럼 열려요."
        :"크롬 오른쪽 위 <b>⋮ 메뉴</b>에서 <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 고르면 앱처럼 열려요."}</p>
      <div class="row" id="instwrap" style="display:none"><button class="btn sec sm" id="inst">지금 설치하기</button></div>
    </section>
  </div>
  <section class="card">
    <h3>계정</h3>
    ${p.viewAs?`<p class="desc">${esc(p.email||"이메일 정보 없음")}</p>`:`<p class="desc">${esc(S.user.email||"")} · ${provider}로 로그인</p>`}
    <p class="err" id="err3"></p>
    <div class="row"><button class="btn sec" id="out" ${p.viewAs?"disabled":""}>로그아웃</button><button class="btn sec" id="del" style="color:var(--red)" ${p.viewAs?"disabled":""}>회원 탈퇴</button></div>
    ${p.viewAs?`<p class="hint">마스터 보기에서는 이 학회원의 계정 버튼을 누를 수 없어요.</p>`:""}
  </section>`+foot();
  const keep=()=>{ d.phone=val("phone"); d.age=val("age"); d.major=val("major"); d.major2=val("major2"); };
  bindChips(d, ()=>{ keep(); viewMe(); });
  if(window.__bip){ $("#instwrap").style.display="flex"; $("#inst").onclick=()=>{ window.__bip.prompt(); window.__bip=null; }; }
  $("#save").onclick=async()=>{ keep();
    if(d.phone && !/^01\d{8,9}$/.test(d.phone.replace(/\D/g,""))) return showErr("휴대폰 번호를 확인해 주세요");
    try{ const patch={phone:fmtPhone(d.phone),grade:d.grade,age:d.age,gender:d.gender,major:d.major,major2:d.major2,jobs:d.jobs,stage:d.stage};
      await F.updateProfile(S.user.uid,patch); Object.assign(S.prof,patch); $("#saved").style.display="block"; $("#err").style.display="none"; }
    catch(e){ showErr(authMsg(e)); } };
  $("#out").onclick=()=>{ if(!p.viewAs) F.signOut(); };
  $("#del").onclick=async()=>{ if(p.viewAs) return; const b=$("#del");
    if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 탈퇴할게요 (한 번 더 누르기)"; return; }
    b.disabled=true; try{ await F.deleteMe(S.user, S.prof); }catch(e){ b.disabled=false; showErr(authMsg(e),"err3"); } };
}

/* ───────── 임원진 공간 ───────── */
const EXEC_TABS = [["dash","현황"],["roster","명단·요청"],["members","회원·회비"],["post","공지·일정"],["money","재정"],["minutes","회의록"],["fb","강의 후기"],["growth","성장 기록"],["system","운영 체계"]];
const ADMIN_TABS = ["fb","growth"];
async function viewExec(){
  if(!S.role){ location.hash="#home"; return; }
  const tab = route().arg || "dash";
  app.innerHTML = header("운영실","")+`<div class="seg scrollx">${EXEC_TABS.filter(([k])=>!ADMIN_TABS.includes(k)||S.role==="admin").map(([k,t])=>`<a href="#exec/${k}" class="${tab===k?"on":""}">${t}</a>`).join("")}</div>
    ${S.role!=="exec"||S.ownProf?"":`<div class="notice">아직 학회원 가입을 하지 않은 임원진 계정이에요. 명단·요청 탭에서 명단을 올린 뒤 <a href="#join" style="color:inherit;font-weight:800">학회원 사이트에서 가입하면</a> 내 공간, 소식, 커뮤니티도 쓸 수 있어요.</div>`}
    <div id="xbody"><div class="skel"></div></div>`+foot();
  const box=$("#xbody");
  const err=e=>{ box.innerHTML=`<section class="card"><p class="err" style="display:block">${authMsg(e)}</p></section>`; };
  try{ await ({dash:xDash,roster:xRoster,members:xMembers,post:xPost,money:xMoney,minutes:xMinutes,fb:S.role==="admin"?xFeedback:xDash,growth:S.role==="admin"?xGrowth:xDash,system:xSystem}[tab]||xDash)(box); }catch(e){ err(e); }
}
const bars=(o,order)=>{ const max=Math.max(1,...Object.values(o)); return (order||Object.keys(o)).map(k=>`<div class="bar"><span>${esc(k)}</span><span class="t"><i style="width:${(o[k]||0)/max*100}%"></i></span><b>${o[k]||0}</b></div>`).join(""); };
const cnt=a=>a.reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{});
function csv(name,H,rows){ const L=rows.map(r=>r.map(v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`).join(","));
  const b=new Blob(["﻿"+[H.join(","),...L].join("\n")],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=name; a.click(); }

async function xDash(box){
  const [users, roster, reqs, posts, evs] = await Promise.all([F.listUsers(), F.listRoster(), F.listRequests(), load("posts",F.listPosts,1), load("events",F.listEvents,1)]);
  const paid=users.filter(u=>u.dues&&u.dues[TERM]).length, dg=users.filter(u=>u.diag).length;
  const rate=(a,b)=>b?Math.round(a/b*100)+"%":"-";
  box.innerHTML = `<section class="card">
    <h2>한눈에 보기</h2>
    <div class="stat"><div><small>명단</small><b>${roster.length}</b></div><div><small>가입 완료</small><b>${users.length}</b></div>
      <div><small>진단 완료</small><b>${dg}</b></div><div><small>${TERM_LABEL} 회비</small><b>${paid}</b></div></div>
    <div class="stat" style="margin-top:8px"><div><small>가입률</small><b>${rate(users.length,roster.length)}</b></div><div><small>회비 납부율</small><b>${rate(paid,users.length)}</b></div>
      <div><small>가입 요청</small><b>${reqs.length}</b></div><div><small>커뮤니티 글</small><b>${posts.length}</b></div></div>
    <p class="hint" style="margin-top:10px">가입률 = 가입 완료 ÷ 명단, 회비 납부율 = 이번 학기 납부 ÷ 가입 완료</p>
    ${reqs.length?`<div class="row"><a class="btn pri" href="#exec/roster">가입 요청 ${reqs.length}건 확인하기</a></div>`:""}
  </section>
  <div class="grid">
    <section class="card"><h3>관심 직무</h3>${bars(cnt(users.flatMap(u=>u.jobs||[])),[...JOBS,"아직 모르겠다"])}</section>
    <section class="card"><h3>준비 단계</h3>${bars(cnt(users.map(u=>u.stage||"-")),STAGES)}<div style="height:10px"></div><h3>학년</h3>${bars(cnt(users.map(u=>u.grade||"-")),GRADES)}</section>
  </div>
  <section class="card">
    <h3>학회 KPI</h3>
    ${tbu("KPI 정의","정체성과 연결한 학기 목표 지표. 임원진 확정 후 여기에 숫자로 걸어 둘 예정")}
    <p class="hint" style="margin-top:8px">지금 바로 볼 수 있는 지표: 가입률, 진단 완료, 회비 납부율, 일정별 참석 응답, 커뮤니티 활동</p>
  </section>`;
  if(S.role==="admin" && S.ownProf){   /* 관리자 본인이 학회원으로 가입돼 있으면: 마스터 계정으로 전환 */
    const mc=document.createElement("section"); mc.className="card";
    mc.innerHTML=`<div class="lesson">관리자 전용</div><h3 style="margin-top:6px">마스터 계정으로 전환</h3>
      <p class="desc">지금 이 계정은 학회원으로도 가입돼 있어요. 전환하면 학회원 명단과 회원 정보에서 빠지고, 관리자 권한과 로그인은 그대로예요. 학회원 화면도 계속 둘러볼 수 있어요.</p>
      <p class="err" id="merr"></p><div class="row"><button class="btn pri sm" id="mgo">학회원에서 빼고 마스터로 쓰기</button></div>`;
    box.prepend(mc);
    $("#mgo").onclick=async()=>{ const b=$("#mgo"); if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 전환하기"; return; }
      try{ await F.leaveMembership(S.user.uid, S.ownProf.rosterId); location.reload(); }catch(e){ showErr(authMsg(e),"merr"); } };
  }
  if(S.role==="admin"){   /* 관리자만: 3강 사진 열쇠 등록 */
    let has=false; try{ const c=await F.getConfig("gallery"); has=!!(c&&c.key); }catch(e){}
    const sec=document.createElement("section"); sec.className="card";
    sec.innerHTML=`<div class="lesson">관리자 전용</div><h3 style="margin-top:6px">강의실 현장 사진 열쇠</h3>
      <p class="desc">${has?"등록돼 있어요. 학회원은 강의실에서 3강 사진을 볼 수 있어요.":"사진은 잠긴 파일로 올라가 있어요. 열쇠를 한 번 등록하면 학회원에게만 보여요."}</p>
      ${has?"":`${field("gkey","열쇠","",{ph:"받은 열쇠 문자열을 붙여 넣으세요"})}<p class="err" id="gerr"></p><div class="row"><button class="btn pri sm" id="gsave">등록</button></div>`}`;
    box.appendChild(sec);
    if($("#gsave")) $("#gsave").onclick=async()=>{ const k=val("gkey");
      if(!/^[A-Za-z0-9+/]{43}=$/.test(k)) return showErr("열쇠 형식이 맞지 않아요. 받은 문자열 전체를 붙여 넣어 주세요","gerr");
      try{ await F.setConfig("gallery",{key:k}); galKey=null; viewExec(); }catch(e){ showErr(authMsg(e),"gerr"); } };
  }
}

async function xRoster(box){
  const [roster, reqs] = await Promise.all([F.listRoster(), F.listRequests()]);
  roster.sort((a,b)=>String(a.name).localeCompare(String(b.name),"ko"));
  box.innerHTML = `
  <section class="card">
    <h2>가입 요청 <span class="badge ${reqs.length?"ku":""}">${reqs.length}</span></h2>
    <p class="desc">명단에 없어서 가입하지 못한 사람들이에요. 학회원이 맞으면 '명단에 추가'를 누르세요. 본인이 '확인하기'를 누르면 가입이 이어져요.</p>
    ${reqs.map(r=>{ const added=roster.some(x=>x.id===F.rosterId(r.sid,r.name)); return `<div class="file"><div class="t"><b>${esc(r.name)} · ${esc(r.sid)}</b><small>${esc(r.phone)} · ${esc(r.major||"")} · ${esc(r.email||"")}${r.msg?` · "${esc(r.msg)}"`:""}</small></div>
      ${added?`<span class="badge ku">명단 추가됨 · 본인 가입 대기</span>`:`<button class="btn pri sm" data-acc="${r.uid}">명단에 추가</button><button class="btn sec sm" data-rej="${r.uid}">거절</button>`}</div>`; }).join("")||`<p class="desc muted" style="margin-top:8px">대기 중인 요청이 없어요.</p>`}
  </section>
  <section class="card">
    <h2>한 명 추가하기</h2>
    <div class="two">${field("an","이름","",{req:1})}${field("as","학번","",{req:1,num:1})}</div>
    <div class="two">${field("ap","휴대폰 번호","",{type:"tel",num:1})}${field("am","주전공","")}</div>
    <p class="err" id="err"></p><div class="row"><button class="btn pri" id="addone">명단에 추가</button></div>
  </section>
  <section class="card">
    <h2>학회원 명단 <span class="badge">${roster.length}명</span></h2>
    <p class="desc">${roster.filter(r=>r.uid).length}명이 가입을 마쳤어요. 새 학기에는 명단 파일을 통째로 올려도 돼요. 이미 가입한 사람의 연결은 그대로 유지돼요.</p>
    <p class="hint">올릴 수 있는 파일: '명단 올리기용 JSON', 또는 첫 줄에 '이름', '학번'이 있는 CSV (연락처, 학년, 주전공, 복수·부전공 열이 있으면 같이 올라가요)</p>
    <div class="row"><input type="file" id="rf" accept=".json,.csv,text/csv,application/json"><button class="btn sec sm" id="rcsv">명단 CSV 내려받기</button></div>
    <p class="err" id="err2"></p><p class="ok" id="rok" style="display:none"></p>
    <div class="scroll"><table class="tbl"><tr><th>이름</th><th>학번</th><th>학년</th><th>주전공</th><th>연락처</th><th>가입</th><th></th></tr>
      ${roster.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.sid)}</td><td>${esc(r.grade||"")}</td><td>${esc(r.major||"")}</td><td>${esc(r.phone||"")}</td><td>${r.uid?"완료":"-"}</td>
        <td>${r.uid?"":`<button class="link" data-rdel="${esc(r.id)}">빼기</button>`}</td></tr>`).join("")}</table></div>
  </section>`;
  $$("[data-acc]").forEach(b=>b.onclick=async()=>{ const r=reqs.find(x=>x.uid===b.dataset.acc);
    try{ await F.importRoster([{name:r.name,sid:r.sid,phone:r.phone,major:r.major}]); viewExec(); }catch(e){ alert(authMsg(e)); } });
  $$("[data-rej]").forEach(b=>b.onclick=async()=>{ if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 거절"; return; }
    try{ await F.deleteRequest(b.dataset.rej); viewExec(); }catch(e){ alert(authMsg(e)); } });
  $$("[data-rdel]").forEach(b=>b.onclick=async()=>{ if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 빼기"; return; }
    try{ await F.deleteRoster(b.dataset.rdel); viewExec(); }catch(e){ alert(authMsg(e)); } });
  $("#addone").onclick=async()=>{ const n=val("an"), s=val("as");
    if(n.length<2||s.replace(/\D/g,"").length<6) return showErr("이름과 학번을 정확히 입력해 주세요");
    try{ await F.importRoster([{name:n,sid:s,phone:fmtPhone(val("ap")),major:val("am")}]); viewExec(); }catch(e){ showErr(authMsg(e)); } };
  $("#rcsv").onclick=()=>csv("KUSC_학회원명단.csv",["이름","학번","학년","주전공","복수·부전공","연락처","가입"],roster.map(r=>[r.name,r.sid,r.grade,r.major,r.major2,r.phone,r.uid?"완료":""]));
  $("#rf").onchange=async e=>{
    const f=e.target.files[0]; if(!f) return;
    try{
      const txt=(await f.text()).replace(/^﻿/,"");
      let rows;
      if(/\.json$/i.test(f.name)) rows=JSON.parse(txt);
      else{ const lines=txt.split(/\r?\n/).filter(Boolean).map(l=>l.split(",").map(x=>x.replace(/^"|"$/g,"").trim()));
        const h=lines[0], ix=k=>h.indexOf(k), ni=ix("이름"), si=ix("학번");
        if(ni<0||si<0) throw new Error("첫 줄에 '이름'과 '학번' 열이 있어야 해요");
        const pick=(c,k)=>ix(k)>-1?c[ix(k)]:"";
        rows=lines.slice(1).map(c=>({name:c[ni],sid:c[si],grade:pick(c,"학년"),major:pick(c,"주전공"),major2:pick(c,"복수·부전공"),phone:pick(c,"연락처")})); }
      const n=await F.importRoster(rows.filter(r=>r.name&&r.sid));
      let k=0; try{ k=await F.syncRosterDiag(); }catch(e){}
      $("#rok").textContent=`${n}명을 명단에 올렸어요.${k?` 이미 가입한 ${k}명에게 1강 진단 결과도 채웠어요.`:""}`; $("#rok").style.display="block"; setTimeout(viewExec,900);
    }catch(err){ showErr(err.code?authMsg(err):(err.message||"파일을 읽지 못했어요"),"err2"); }
  };
}

async function xMembers(box){
  const [users, admins] = await Promise.all([F.listUsers(), F.listAdmins()]);
  const role=uid=>(admins.find(a=>a.uid===uid)||{}).role;
  users.sort((a,b)=>String(a.name).localeCompare(String(b.name),"ko"));
  const paid=users.filter(u=>u.dues&&u.dues[TERM]).length;
  setTimeout(()=>{ const b=$("#tosheet"); if(b && S.role==="admin") b.onclick=async()=>{ b.disabled=true;
    for(const u of users){ sheetLog("가입", u); await new Promise(r=>setTimeout(r,350)); }
    b.textContent=`${users.length}명을 보냈어요`; }; },0);
  box.innerHTML = `<section class="card">
    <h2>회원과 회비</h2>
    <p class="desc">${TERM_LABEL} 회비 ${DUES}: ${users.length}명 중 ${paid}명 확인. 입금을 확인하면 체크하세요. 본인 화면에도 바로 표시돼요.</p>
    <div class="row"><button class="btn pri sm" id="mcsv">회원 연락망 CSV</button><button class="btn sec sm" id="unpaid">미납자 이름 복사</button>${S.role==="admin"?`<button class="btn sec sm" id="tosheet">가입자 전체를 기록 사본에 쓰기</button>`:""}</div>
    <p class="ok" id="cp" style="display:none"></p>
    <div class="scroll"><table class="tbl"><tr><th>회비</th><th>이름</th><th>학년</th><th>주전공</th><th>연락처</th><th>희망 직무</th>${S.role==="admin"?"<th>임원진</th>":""}</tr>
      ${users.map(u=>`<tr><td><input type="checkbox" class="due" data-uid="${u.uid}" ${u.dues&&u.dues[TERM]?"checked":""} aria-label="${esc(u.name)} 회비"></td>
        <td>${esc(u.name)}${role(u.uid)?` <span class="badge ku">${role(u.uid)==="admin"?"관리자":"임원진"}</span>`:""}</td><td>${esc(u.grade)}</td><td>${esc(u.major)}</td><td>${esc(u.phone||"")}</td>
        <td>${(u.jobs&&u.jobs.length)?esc(u.jobs.join(", ")):(u.diag&&u.diag.want&&u.diag.want!=="NONE")?esc(JOBNAME[u.diag.want]||u.diag.want):"-"}</td>
        ${S.role==="admin"?`<td>${role(u.uid)==="admin"?"":`<button class="link" data-role="${u.uid}" data-name="${esc(u.name)}" data-on="${role(u.uid)?1:0}">${role(u.uid)?"해제":"지정"}</button>`}</td>`:""}</tr>`).join("")}
    </table></div>
  </section>`;
  $$(".due").forEach(c=>c.onchange=async()=>{ try{ await F.setDues(c.dataset.uid,TERM,c.checked); }catch(e){ c.checked=!c.checked; alert(authMsg(e)); } });
  $$("[data-role]").forEach(b=>b.onclick=async()=>{ try{ await F.setRole(b.dataset.role,b.dataset.name,b.dataset.on==="1"?null:"exec"); viewExec(); }catch(e){ alert(authMsg(e)); } });
  $("#mcsv").onclick=()=>csv("KUSC_회원연락망.csv",["이름","학번","연락처","이메일","학년","주전공","복수·부전공","관심직무","준비단계",`${TERM} 회비`],
    users.map(u=>[u.name,u.sid,u.phone,u.email,u.grade,u.major,u.major2,(u.jobs||[]).join("/"),u.stage,u.dues&&u.dues[TERM]?"납부":""]));
  $("#unpaid").onclick=async()=>{ const t=users.filter(u=>!(u.dues&&u.dues[TERM])).map(u=>u.name).join(", ");
    try{ await navigator.clipboard.writeText(t); }catch(e){} $("#cp").textContent="미납자: "+(t||"없음"); $("#cp").style.display="block"; };
}

async function xPost(box){
  const [ns, evs] = await Promise.all([load("notices",F.listNotices,1), load("events",F.listEvents,1)]);
  const n = S.xn || (S.xn={tag:"공지"});
  box.innerHTML = `<div class="grid">
  <section class="card">
    <h2>공지 올리기</h2>
    <div class="field"><label class="l">종류</label>${chips("tag",NOTICE_TAGS,false,n)}</div>
    ${field("nt","제목","",{req:1})}${field("nb","내용","",{req:1,area:1,rows:6,ph:n.tag==="정산"?"예: 학기 회비 15,000원 / 입금 계좌: (공금 계좌) / 입금자명: 이름+학번 뒤 4자리":""})}
    <label class="check"><input type="checkbox" id="np"> 맨 위에 고정</label>
    <p class="err" id="err"></p><div class="row"><button class="btn pri" id="nadd">공지 올리기</button></div>
    <p class="hint" style="margin-top:10px">정산 안내는 화면에 한 번 띄우지 말고, '정산' 공지로 고정해 두면 자리를 비운 사람도 언제든 볼 수 있어요.</p>
  </section>
  <section class="card">
    <h2>일정 올리기</h2>
    ${field("et","행사 이름","",{req:1})}
    <div class="two">${field("ed","날짜","",{type:"date",req:1})}${field("eh","시간","",{type:"time"})}</div>
    ${field("ep","장소","")}${field("epa","뒤풀이 장소","",{opt:"있다면, 미리 정해서",hint:"적어 두면 학회원이 뒤풀이 참석도 따로 응답해요"})}
    <div class="two">${field("ef","참가비","",{ph:"예: 뒤풀이 1인 15,000원"})}${field("ea","입금 계좌","",{ph:"공금 계좌"})}</div>
    ${field("edesc","설명","",{area:1,rows:3})}
    <p class="err" id="err2"></p><div class="row"><button class="btn pri" id="eadd">일정 올리기</button></div>
  </section></div>
  <section class="card"><h2>올린 공지</h2>${ns.map(x=>`<div class="file"><div class="t"><b>${x.pinned?"📌 ":""}[${esc(x.tag)}] ${esc(x.title)}</b><small>${day(x.createdAt)}</small></div><button class="link" data-ndel="${x.id}">지우기</button></div>`).join("")||`<p class="desc">없음</p>`}</section>
  <section class="card"><h2>올린 일정과 참석 현황</h2><div id="evlist">${evs.length?"":`<p class="desc">없음</p>`}</div></section>`;
  bindChips(n, ()=>xPost(box));
  $("#nadd").onclick=async()=>{ const t=val("nt"), b=$("#nb").value.trim(); if(!t||!b) return showErr("제목과 내용을 입력해 주세요");
    try{ await F.addNotice({tag:n.tag,title:t,body:b,pinned:$("#np").checked,authorName:myName()}); S.xn={tag:"공지"}; drop("notices"); xPost(box); }catch(e){ showErr(authMsg(e)); } };
  $("#eadd").onclick=async()=>{ const t=val("et"), d=val("ed"); if(!t||!d) return showErr("행사 이름과 날짜를 입력해 주세요","err2");
    try{ await F.addEvent({title:t,date:d,time:val("eh"),place:val("ep"),party:val("epa"),fee:val("ef"),account:val("ea"),desc:$("#edesc").value.trim()}); drop("events"); xPost(box); }catch(e){ showErr(authMsg(e),"err2"); } };
  $$("[data-ndel]").forEach(b=>b.onclick=async()=>{ try{ await F.deleteNotice(b.dataset.ndel); drop("notices"); xPost(box); }catch(e){ alert(authMsg(e)); } });
  if(evs.length){
    const blocks = await Promise.all([...evs].sort((a,b)=>b.date.localeCompare(a.date)).map(async e=>{ const rs=await F.listRsvp(e.id);
      const by=k=>rs.filter(r=>r.status===k).map(r=>esc(r.name)).join(", ")||"-";
      return `<div class="evx"><div class="file" style="border:0"><div class="t"><b>${esc(e.title)}</b><small>${ymd(e.date)} ${esc(e.time||"")} · ${esc(e.place||"")}</small></div>
        <button class="btn sec sm" data-ecsv="${e.id}">참석 CSV</button><button class="link" data-edel="${e.id}">지우기</button></div>
        <div class="kv"><span>참석 ${rs.filter(r=>r.status==="참석").length}</span><b>${by("참석")}</b><span>미정</span><b>${by("미정")}</b><span>불참</span><b>${by("불참")}</b>
        ${e.party?`<span>뒤풀이</span><b>${rs.filter(r=>r.party==="참석").map(r=>esc(r.name)).join(", ")||"-"}</b>`:""}</div></div>`; }));
    $("#evlist").innerHTML = blocks.join("");
    $$("[data-ecsv]").forEach(b=>b.onclick=async()=>{ const rs=await F.listRsvp(b.dataset.ecsv); csv("참석응답.csv",["이름","참석","뒤풀이"],rs.map(r=>[r.name,r.status,r.party])); });
    $$("[data-edel]").forEach(b=>b.onclick=async()=>{ if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 지우기"; return; }
      try{ await F.deleteEvent(b.dataset.edel); drop("events"); xPost(box); }catch(e){ alert(authMsg(e)); } });
  }
}

async function xMoney(box){
  const L=[...await load("ledger",F.listLedger,1)].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const m = S.xm || (S.xm={type:"수입"});
  box.innerHTML = `<section class="card">
    <h2>재정 기록</h2>
    <p class="desc">여기 올린 기록은 학회원 모두가 '소식 → 재정 공개'에서 볼 수 있어요. 공금 계좌 기준으로 적어 주세요.</p>
    <div class="field"><label class="l">구분</label>${chips("type",["수입","지출"],false,m)}</div>
    <div class="two">${field("ld","날짜",today(),{type:"date"})}${field("la","금액 (원)","",{num:1,ph:"예: 15000"})}</div>
    ${field("li","항목","",{ph:m.type==="수입"?"예: 2026-2 회비 (12명)":"예: 3강 연사 다과"})}${field("ln","메모","",{opt:"선택",ph:"영수증 위치 등"})}
    <p class="err" id="err"></p><div class="row"><button class="btn pri" id="ladd">기록 올리기</button></div>
  </section>
  <section class="card"><h2>올린 기록</h2>${L.map(x=>`<div class="file"><div class="t"><b>${esc(x.date)} · ${esc(x.item)}</b><small>${esc(x.type)} ${won(x.amount)}${x.note?` · ${esc(x.note)}`:""}</small></div><button class="link" data-ldel="${x.id}">지우기</button></div>`).join("")||`<p class="desc">없음</p>`}</section>
  <section class="card"><h3>재정 계획</h3>
    ${tbu("혁신지원금","지원 시기와 방식 조사 후 확보 계획 (최우선 과제)")}
    ${tbu("행사별 예산안","조달 → 배분 → 정산 순서로 행사마다 예산을 미리 세우기")}
  </section>`;
  bindChips(m, ()=>xMoney(box));
  $("#ladd").onclick=async()=>{ const a=Number(val("la").replace(/\D/g,"")), it=val("li");
    if(!a||!it) return showErr("금액과 항목을 입력해 주세요");
    try{ await F.addLedger({type:m.type,date:val("ld"),amount:a,item:it,note:val("ln")}); drop("ledger"); xMoney(box); }catch(e){ showErr(authMsg(e)); } };
  $$("[data-ldel]").forEach(b=>b.onclick=async()=>{ try{ await F.deleteLedger(b.dataset.ldel); drop("ledger"); xMoney(box); }catch(e){ alert(authMsg(e)); } });
}

/* 성장 기록 (관리자만): 학회원별 진단 횟수, 목표 실행 기록, 한마디 남기기 */
async function xGrowth(box){
  const [users, gs] = await Promise.all([F.listUsers(), F.listGoals().catch(()=>[])]);
  const G=Object.fromEntries(gs.map(g=>[g.uid,g]));
  const rows=users.filter(u=>u.diag).map(u=>{ const H=(u.diagHist&&u.diagHist.length)?[...u.diagHist].sort((x,y)=>String(x.ts).localeCompare(String(y.ts))):[u.diag];
    const goals=(H[0].goals&&H[0].goals.length)?H[0].goals:(u.diag.goals||[]); const g=G[u.uid]||{}, T=g.track||{};
    const c={done:0,doing:0,todo:0}; goals.forEach(x=>{ const s=(T[x.t]||{}).status; if(c[s]!==undefined) c[s]++; });
    return {u,H,goals,g,T,c,wrote:goals.some(x=>gNorm(T[x.t]).log.length>0)}; })
    .sort((x,y)=>(y.wrote-x.wrote)||String(x.u.name).localeCompare(String(y.u.name),"ko"));
  const twice=rows.filter(r=>r.H.length>1).length, wrote=rows.filter(r=>r.wrote).length;
  box.innerHTML=`<section class="card">
    <h2>성장 기록</h2>
    <p class="desc">학회원이 학기 초 진단의 목표를 어디까지 했는지 남긴 기록이에요.<br>이 화면과 기록은 관리자만 볼 수 있고, 임원진에게는 보이지 않아요.</p>
    <div class="stat"><div><small>진단 결과 있음</small><b>${rows.length}</b></div><div><small>두 번 이상 진단</small><b>${twice}</b></div><div><small>목표 기록 남김</small><b>${wrote}</b></div></div>
  </section>
  ${rows.length?rows.map((r,ri)=>`<section class="card tight">
    <details><summary style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:12px;align-items:center">
      <span><b>${esc(r.u.name)}</b> <span class="hint">${esc(r.u.grade||"")}</span><br>
      <span class="hint">진단 ${r.H.length}번, 처음 ${day(r.H[0].ts)}${r.H.length>1?`, 최근 ${day(r.H[r.H.length-1].ts)}`:""}</span></span>
      <span class="badge ${r.c.done?"ku":""}">${r.wrote?`해냄 ${r.c.done} / 하는 중 ${r.c.doing}`:"기록 없음"}</span></summary>
      <div style="margin-top:14px">${r.goals.map((x,i)=>{ const v=gNorm(r.T[x.t]);
        return `<div style="padding:12px 0;border-top:1px solid var(--line)"><b>${i+1}. ${esc(x.t)}</b> <span class="gpill ${v.status}">${GST[v.status]}</span>
          ${gTimeline(v,i,true,0)}</div>`; }).join("")}
      </div></details></section>`).join("")
    :`<section class="card"><p class="desc">아직 진단 결과가 있는 학회원이 없어요.<br>명단을 올리면 1강 결과가 채워져요.</p></section>`}`;
}

async function xFeedback(box){
  const T=SURVEY;
  const [rs, doneUids, users] = await Promise.all([F.listFeedback(T.term), F.listFeedbackDone(T.term), F.listUsers()]);
  const n=rs.length, A=rs.map(r=>r.answers||{});
  const pct=(k,t)=>t?Math.round(k/t*100):0;
  const bars=(pairs,t)=>pairs.map(([l,k])=>`<div class="bar fbbar"><span>${esc(l)}</span><span class="t"><i style="width:${pct(k,t)}%"></i></span><b>${k}</b></div>`).join("");
  const count=(q,vals)=>{ const m=new Map(); vals.forEach(v=>{ (Array.isArray(v)?v:v!==undefined?[v]:[]).forEach(o=>{ const key=String(o).startsWith(ETC)?ETC:String(o); m.set(key,(m.get(key)||0)+1); }); });
    const order=[...(q.type==="scale"?[...SCALE,...(q.na?[q.na]:[])]:allRows({rowsFrom:q.optsFrom,rows:q.opts})),...(q.etc?[ETC]:[])], ix=k=>{ const i=order.indexOf(k); return i<0?999:i; };
    return [...m.entries()].sort((x,y)=>ix(x[0])-ix(y[0])||y[1]-x[1]); };
  const avg=v=>v.length?(v.reduce((s,y)=>s+y,0)/v.length).toFixed(2):"-";
  const nums=vals=>vals.filter(v=>/^[1-5]$/.test(v)).map(Number);
  let no=0;
  const blocks=allQs().map(q=>{ no++;
    const vals=A.map(x=>x[q.id]).filter(v=>v!==undefined), k=vals.length;
    const h=`<h3 style="margin-top:24px">${no}. ${esc(q.q)}</h3><p class="hint" style="margin:2px 0 6px">응답 ${k}명${q.showIf?` (해당 회차 참석자만)`:""}</p>`;
    if(q.type==="one"||q.type==="many"){ const etc=vals.flat().filter(v=>typeof v==="string"&&v.startsWith(ETC+":"));
      return h+bars(count(q,vals),k)+(etc.length?`<p class="hint">기타 직접 입력: ${etc.map(v=>esc(v.slice(ETC.length+2))).join(", ")}</p>`:""); }
    if(q.type==="scale"){ const v=nums(vals);
      return h+`<p style="margin:4px 0 6px">평균 <b>${avg(v)}</b> / 5${q.na?` <span class="hint">(${esc(q.na)} ${vals.filter(x=>x===q.na).length}명은 평균에서 뺌)</span>`:""}</p>`+bars(count(q,vals),k); }
    if(q.type==="grid") return h+`<table class="tbl"><tr><th>항목</th><th>평균 (5점 만점)</th><th>응답 수</th></tr>${allRows(q).map(r=>{ const v=nums(A.map(x=>(x[q.id]||{})[r]));
      return `<tr><td>${esc(r)}</td><td><b>${avg(v)}</b></td><td>${v.length}</td></tr>`; }).join("")}</table>`;
    if(q.type==="nps"){ const v=vals.filter(x=>typeof x==="number");
      const pro=v.filter(x=>x>=9).length, det=v.filter(x=>x<=6).length, nps=v.length?Math.round((pro-det)/v.length*100):"-";
      return h+`<div class="stat three"><div><small>평균 (10점 만점)</small><b>${v.length?(v.reduce((s,y)=>s+y,0)/v.length).toFixed(1):"-"}</b></div><div><small>추천 지수 (NPS)</small><b>${nps}</b></div><div><small>응답 수</small><b>${v.length}</b></div></div>
        <p class="hint" style="margin-top:8px">추천 지수 = (9~10점 비율 − 0~6점 비율) × 100<br>9~10점을 준 사람의 비율에서 0~6점을 준 사람의 비율을 뺀 값이에요. 이번에는 9~10점 ${pro}명, 0~6점 ${det}명이에요. −100부터 100까지 나오고, 0보다 크면 추천하는 사람이 더 많다는 뜻이에요.</p>`; }
    const tx=rs.filter(r=>(r.answers||{})[q.id]!==undefined);
    return h+(k?`<ul class="dl">${tx.map(r=>`<li>${nl(r.answers[q.id])}<br><span class="hint">${esc(r.name||"")}</span></li>`).join("")}</ul>`:`<p class="desc muted">아직 답이 없어요.</p>`);
  });
  /* 계정(uid)으로 먼저 맞추고, 안 맞으면 학번으로도 맞춰 봄. 다른 계정으로 낸 사람을 '안 냄'으로 잘못 세지 않게 */
  const dg=x=>String(x||"").replace(/\D/g,""), fbSids=new Set(rs.map(r=>dg(r.sid)).filter(Boolean)), fbUids=new Set(rs.map(r=>r.uid));
  const isDone=u=>doneUids.includes(u.uid)||fbUids.has(u.uid)||(dg(u.sid)&&fbSids.has(dg(u.sid)));
  const left=users.filter(u=>!isDone(u)).map(u=>u.name);
  const other=users.filter(u=>!doneUids.includes(u.uid)&&!fbUids.has(u.uid)&&isDone(u)).map(u=>u.name);
  const doneN=users.filter(isDone).length;
  box.innerHTML = `<section class="card">
    <h2>${esc(T.title)}</h2>
    <p class="desc">관리자만 보는 화면이에요. 임원진 화면에는 이 탭이 없어요.</p>
    <div class="stat three"><div><small>응답</small><b>${n}</b></div><div><small>가입한 학회원</small><b>${users.length}</b></div><div><small>응답률</small><b>${users.length?pct(doneN,users.length)+"%":"-"}</b></div></div>
    ${left.length?`<p class="desc" style="margin-top:12px">안 낸 사람 ${left.length}명: ${esc(left.join(", "))}</p>`:`<p class="desc" style="margin-top:12px">가입한 학회원 모두 냈어요.</p>`}
    ${other.length?`<p class="hint">다른 계정으로 낸 사람(학번으로 확인): ${esc(other.join(", "))}</p>`:""}
    <div class="row" style="margin-top:14px"><button class="btn pri sm" id="fbcsv"${n?"":" disabled"}>응답 엑셀(CSV) 받기</button>${left.length?`<button class="btn sec sm" id="fbleft">안 낸 사람 이름 복사</button>`:""}${n?`<button class="btn sec sm" id="fbsync">구글 시트로 전체 다시 보내기</button>`:""}</div>
    <p class="hint">시트 사본이 빠졌을 때 쓰세요. 서버에 저장된 응답 ${n}개를 시트의 'feedback_${esc(T.term)}_복구' 탭에 새로 씁니다. 학생 쪽 저장이 막혀 따로 전달된 답은 'feedback_${esc(T.term)}_미저장' 탭에 쌓여요.</p>
    <p class="ok" id="fbcopied" style="display:none">복사했어요</p>
  </section>
  ${n?`<section class="card"><h3>응답한 사람</h3><p class="desc">테스트 응답처럼 지워야 할 응답이 있으면 지우세요. 지우면 그 사람은 다시 낼 수 있어요.</p>
    <div class="scroll"><table class="tbl"><tr><th>응답 날짜</th><th>이름</th><th>학번</th><th></th></tr>
    ${rs.map(r=>`<tr><td>${day(r.createdAt)}</td><td>${esc(r.name||"")}</td><td>${esc(r.sid||"")}</td><td><button class="link" data-fdel="${r.id}" data-fuid="${esc(r.uid||"")}" style="color:var(--red)">지우기</button></td></tr>`).join("")}</table></div></section>`:""}
  <section class="card">${n?blocks.join(""):`<p class="desc">아직 응답이 없어요. 학회원이 강의실의 '후기 남기기'에서 낼 수 있어요.</p>`}</section>`;
  $$("[data-fdel]").forEach(b=>b.onclick=async()=>{ if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 지우기"; return; }
    try{ await F.deleteFeedback(b.dataset.fdel, b.dataset.fuid, T.term); viewExec(); }catch(e){ alert(authMsg(e)); } });
  if($("#fbleft")) $("#fbleft").onclick=async()=>{ try{ await navigator.clipboard.writeText(left.join(", ")); $("#fbcopied").style.display="block"; }catch(e){ prompt("복사해서 쓰세요", left.join(", ")); } };
  if($("#fbsync")) $("#fbsync").onclick=async()=>{ const b=$("#fbsync"); b.disabled=true; let ok=0;
    for(const [i,r] of [...rs].reverse().entries()){ b.textContent=`보내는 중… ${i+1}/${n}`;
      if(await sheetFeedback(r.answers, {name:r.name, sid:r.sid, uid:r.uid, status:"서버 저장 "+day(r.createdAt)}, "복구")) ok++;
      await new Promise(z=>setTimeout(z,350)); }
    b.textContent=`${ok}/${n}개 보냈어요. 시트를 확인하세요`; };
  if($("#fbcsv")) $("#fbcsv").onclick=()=>{
    const cols=fbColumns();
    csv(`KUSC_${T.term}_커리큘럼피드백.csv`,["응답 날짜","이름","학번",...cols.map(c=>c[2])], rs.map(r=>[day(r.createdAt),r.name||"",r.sid||"",...fbRow(r.answers,cols)]));
  };
}

async function xMinutes(box){
  const M=await F.listMinutes();
  box.innerHTML = `<section class="card">
    <h2>회의록 남기기</h2>
    <p class="desc">작은 회의도 결론은 남겨요. 날짜별로 쌓이고 임원진만 볼 수 있어요.</p>
    <div class="two">${field("md","회의 날짜",today(),{type:"date"})}${field("mt","제목","",{req:1,ph:"예: 2차 임원진 회의"})}</div>
    ${field("mb","결정 사항과 할 일","",{area:1,rows:6,ph:"결정 사항\n- \n\n할 일 (담당, 기한)\n- "})}
    ${field("ml","원문 링크","",{opt:"선택",ph:"구글 드라이브 등"})}
    <p class="err" id="err"></p><div class="row"><button class="btn pri" id="madd">올리기</button></div>
  </section>
  ${M.map(x=>`<section class="card tight"><div class="lesson">${esc(x.date)}</div><h3 style="margin-top:6px">${esc(x.title)}</h3>
    <p class="body">${nl(x.body)}</p>${x.link?`<a class="link" href="${esc(x.link)}" target="_blank" rel="noopener">원문 열기</a>`:""}
    <div style="margin-top:8px"><button class="link" data-mdel="${x.id}">지우기</button></div></section>`).join("")}`;
  $("#madd").onclick=async()=>{ const t=val("mt"); if(!t) return showErr("제목을 입력해 주세요");
    const link=val("ml"); if(link && !/^https?:\/\//.test(link)) return showErr("링크는 http로 시작해야 해요");
    try{ await F.addMinute({date:val("md"),title:t,body:$("#mb").value.trim(),link,authorName:myName()}); xMinutes(box); }catch(e){ showErr(authMsg(e)); } };
  $$("[data-mdel]").forEach(b=>b.onclick=async()=>{ if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 지우기"; return; }
    try{ await F.deleteMinute(b.dataset.mdel); xMinutes(box); }catch(e){ alert(authMsg(e)); } });
}

function xSystem(box){
  box.innerHTML = `<section class="card">
    <div class="lesson">11월 3일 임원진 회의</div>
    <h2 style="margin-top:4px">정한 것</h2>
    <ul class="dl">
      <li>학회원은 소수 정예로 뽑고, 학기마다 두 번 안팎 공개 행사를 함께 연다</li>
      <li>운영 체계는 바텀업: 업무 목록 → 분류(반복성, 문서화) → 역할 설계 → 규칙과 계획</li>
      <li>혁신지원금 확보를 재정 최우선 과제로 둔다</li>
      <li>직무 세션은 연사 퇴근 시간을 고려해 19시 시작을 유지한다</li>
      <li>결정 사항은 지도교수님께 먼저 보고한다</li>
    </ul>
  </section>
  <section class="card">
    <h2>이 공간에 채워 갈 것</h2>
    <div class="tbus">
      ${tbu("업무 목록과 WBS","임원진 공동 작성본을 올리고 진행 상태를 여기서 관리")}
      ${tbu("조직과 R&R","학술, 대외협력, 운영·재무, 브랜딩 등 직책별 역할과 정원")}
      ${tbu("보고 체계","회장 단일 창구 또는 국장 직접 소통, 지도교수 보고 방식")}
      ${tbu("선발 기준과 절차","소수 정예 기준의 서류, 면접, 일정")}
      ${tbu("활동과 수료 기준","회비, 최소 참여 횟수, 미충족 시 기준")}
      ${tbu("인수인계 매뉴얼","기수가 바뀌어도 같은 방향을 유지하기 위한 템플릿")}
      ${tbu("선배와 교수님 연락처","네트워크 DB. 개인정보 동의 범위 안에서만")}
      ${tbu("SNS 운영","인스타그램 운영 방향과 게시 콘텐츠")}
    </div>
  </section>
  <section class="card">
    <h3>지금 이 사이트로 이미 되는 것</h3>
    <ul class="dl">
      <li>학회원 DB: 명단과 가입 정보 (회원·회비 탭의 연락망 CSV)</li>
      <li>정산: '정산' 공지 고정과 일정별 입금 계좌, 회비 납부 체크</li>
      <li>뒤풀이: 일정에 뒤풀이 장소를 미리 적고 참석 응답 받기</li>
      <li>재정 투명성: 재정 기록을 학회원 모두에게 공개</li>
      <li>회의록: 날짜별로 쌓기</li>
    </ul>
  </section>`;
}

/* ───────── 흐름 ───────── */
async function render(){
  if(!S.ready) return;
  const {r, arg} = route();
  window.onscroll=null; document.body.style.overflow="";
  if(MODE==="exec") return renderExecDoor();
  if(r==="main" || !S.user && r!=="about") return viewLanding();   /* 사이트 첫 화면은 누구에게나 홈페이지 */
  app.className="wrap";
  if(r==="about") return viewAbout();
  if(r==="exec"){ if(S.role) return viewExec(); location.hash="#home"; return; }
  if(!S.prof){
    if(r==="join"){ if(S.join) S.join.force=true; }
    return viewJoin();
  }
  if(r==="news") return viewNews();
  if(r==="board") return viewBoard();
  if(r==="post") return viewPost(arg);
  if(r==="class") return viewClass();
  if(r==="feedback") return viewFeedback();
  if(r==="l3") return viewL3();
  if(r==="growth") return viewGrowth();
  if(r==="me") return viewMe();
  return viewHome();
}
/* 마스터 보기: 고른 학회원의 실제 화면을 읽기 전용으로 보여줌 */
async function masterPick(u, uid){
  let us=[], ro=[]; try{ [us, ro]=await Promise.all([F.listUsers(), F.listRoster()]); }catch(e){}
  /* 가입 전인 명단 학회원도 1강 진단 결과로 미리 볼 수 있게 함 */
  const pre=ro.filter(r=>!r.uid).map(r=>({uid:"r:"+r.id, name:r.name, sid:r.sid, grade:r.grade||"", major:r.major||"", major2:r.major2||"",
    jobs:r.jobs||[], stage:r.stage||"", phone:r.phone||"", progress:{}, preJoin:true,
    ...(r.diag?{diag:r.diag, diagAt:r.diag.ts||"", diagFrom:"1강 진단", diagHist:[F.diagSummary(r.diag)]}:{})}));
  /* 가입했지만 진단이 비어 있으면 명단의 1강 결과로 채워서 보여 줌 (화면에서만) */
  const rmap=Object.fromEntries(ro.map(r=>[r.uid||"", r]));
  us=us.map(u=>(!u.diag && rmap[u.uid] && rmap[u.uid].diag) ? {...u, diag:rmap[u.uid].diag, diagHist:[F.diagSummary(rmap[u.uid].diag)]} : u);
  us=[...us, ...pre].sort((a,b)=>String(a.name).localeCompare(String(b.name),"ko"));
  S.members=us;
  let pick=uid; if(!pick){ try{ pick=localStorage.getItem("kusc:viewAs"); }catch(e){} }
  const m=us.find(x=>x.uid===pick);
  if(!m){   /* 기본: 마스터 본인 화면. 진단과 목표 기록은 나만 보는 테스트 공간(lab)에 저장 */
    const a=await F.getAdmin(u.uid); let lab=null; try{ lab=await F.getLab(u.uid); }catch(e){}
    S.prof={progress:{}, ...(lab||{}), name:(a&&a.name)||"관리자", master:true}; }
  else S.prof={...m, viewAs:m.uid};
  try{ localStorage.setItem("kusc:viewAs", m?m.uid:"__me"); }catch(e){}
}
function viewAsBar(){
  if(!(S.prof && (S.prof.viewAs || S.prof.master)) || inExec()) return "";
  const me=!S.prof.viewAs;
  return `<div class="viewas"><b>마스터 보기</b><select id="vas" aria-label="화면을 볼 사람"><option value="__me" ${me?"selected":""}>마스터 (내 화면)</option>${(S.members||[]).map(m=>`<option value="${m.uid}" ${m.uid===S.prof.viewAs?"selected":""}>${esc(m.name)}${m.grade?` (${esc(m.grade)})`:""}${m.preJoin?" 가입 전":""}</option>`).join("")}</select>
    <span>${me?"학회원을 고르면 그 사람에게 보이는 화면을 읽기 전용으로 볼 수 있어요.":"님에게 보이는 화면이에요. 읽기 전용이라 아무것도 바뀌지 않아요."}</span><a href="admin.html">운영실</a></div>`;
}
document.addEventListener("change",async e=>{ if(e.target && e.target.id==="vas"){ await masterPick(S.user, e.target.value); S.cache={}; S.gtFor=null; S.fb=null; S.me=null; render(); } });

/* 운영실(admin.html) 입구: 임원진 계정만 통과 */
function renderExecDoor(){
  app.className="wrap";
  if(!S.user){
    app.innerHTML = header("","")+`<section class="card gate" id="sheetcard" style="margin-top:22px"></section>`+foot();
    return renderLogin();
  }
  if(!isExec()){
    app.innerHTML = header("","")+`<section class="card" style="margin-top:22px">
      <h2>임원진 계정이 아니에요</h2>
      ${S.prof?`<p class="desc">${esc(S.user.email||"이 계정")}은 운영실에 들어올 수 없어요. 임원진이라면 관리자에게 지정을 부탁하고, 지정된 뒤 다시 로그인해 주세요.</p>`
        :`<p class="desc">${esc(S.user.email||"이 계정")}은 아직 학회원 가입 전이에요. 임원진 지정은 가입을 마친 계정에만 할 수 있어요.</p>
          <p class="desc" style="margin-top:8px">학회원 사이트에서 이름과 학번으로 가입을 마친 뒤, 관리자에게 지정을 부탁하고 다시 로그인해 주세요.</p>`}
      <div class="row" style="margin-top:20px">${S.prof?`<a class="btn pri" href="./">학회원 사이트로</a>`:`<a class="btn pri" href="./#join">학회원 가입하러 가기</a>`}<button class="btn sec" data-out>다른 계정으로 로그인</button></div>
    </section>`+foot();
    return;
  }
  if(route().r!=="exec"){ history.replaceState(null,"","#exec"); }
  return viewExec();
}
document.addEventListener("click",e=>{ const t=e.target.closest&&e.target.closest("[data-out]"); if(t){ e.preventDefault(); F.signOut(); } });
window.addEventListener("hashchange",()=>{ S.me=null; if(!location.hash.startsWith("#post/")) S.draft=null; render(); scrollTo(0,0); });
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); window.__bip=e; });
F.onUser(async u=>{
  S.user=u; S.fb=null; S.sheetOpen=false; S.prof=null; S.ownProf=null; S.myName=""; S.role=null; S.req=null; S.join=null; S.me=null; S.cache={}; S.gtFor=null;
  if(u){
    try{ S.prof=await F.getProfile(u.uid); }catch(e){ S.prof=null; }
    S.role=await F.getRole(u.uid);
    /* 가입 전에 1강 진단을 했는데 계정에 결과가 없으면 명단에 있는 결과를 내 기록으로 가져옴 */
    if(S.prof && !S.prof.diag && S.prof.rosterId){ try{ const r=await F.getRoster(S.prof.rosterId);
      if(r && r.diag){ const add={diag:r.diag, diagAt:r.diag.ts||"", diagFrom:"1강 진단", diagHist:[F.diagSummary(r.diag)]};
        await F.updateProfile(u.uid, add); Object.assign(S.prof, add); } }catch(e){} }
    S.ownProf=S.prof;   /* 내 계정의 실제 회원 정보 (마스터는 없음) */
    S.myName=(S.prof&&S.prof.name)||"";
    if(S.role && !S.myName){ const a=await F.getAdmin(u.uid); S.myName=(a&&a.name)||"관리자"; }
    /* 마스터(관리자) 계정: 학회원이 아니어도 학회원 화면을 둘러볼 수 있게 가상의 프로필을 씀. 회원 수에는 들어가지 않음 */
    if(!S.prof && S.role==="admin" && MODE!=="exec") await masterPick(u);
    if(!S.prof){ try{ S.req=await F.getMyRequest(u.uid); }catch(e){} }
    if(S.afterLogin){ S.afterLogin=false; S.ready=true; const to = MODE==="exec" ? "#exec" : S.prof ? "#home" : "#join"; if(location.hash!==to){ location.hash = to; return; } }
  }
  S.ready=true; render();
});
if("serviceWorker" in navigator && location.protocol.indexOf("http")===0){ navigator.serviceWorker.register("sw.js").catch(function(){}); }
