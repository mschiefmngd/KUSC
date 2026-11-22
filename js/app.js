/* ─────────────────────────────────────────────
   KUSC 회원 사이트 — 화면
   데이터는 js/fb.js 를 통해서만 읽고 씁니다.
   ───────────────────────────────────────────── */
import * as F from "./fb.js";

/* ───────── 고정 값 (학기마다 여기만 고치면 됨) ───────── */
/* 임원진 공간은 admin.html 에서만 열림 (학회원 사이트에는 입구가 없음) */
const MODE = window.KUSC_MODE === "exec" ? "exec" : "site";
const ENDPOINT = "https://script.google.com/macros/s/AKfycbzr2-vwdBV4v7U6qliXPlFWWu0Mo9S7tC7_70xqGdqeCd0wPDmUB52FyB7xB510o-oT/exec";
/* 가입과 가입 요청을 구글 시트 site_members 탭에도 한 줄씩 남김 (실패해도 가입에는 영향 없음) */
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
const BOARDS = ["자유","질문","스터디·모임","정보 공유"];
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
const route = () => { const h=(location.hash||"").slice(1); const [r,arg]=h.split("/"); return {r:r||"main", arg:arg?decodeURIComponent(arg):""}; };
const toD = x => x&&x.toDate ? x.toDate() : (x ? new Date(x) : null);
const day = x => { const d=toD(x); return d&&!isNaN(d) ? `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}` : ""; };
const ymd = s => { if(!s) return ""; const [y,m,d]=String(s).split("-"); const w="일월화수목금토"[new Date(+y,+m-1,+d).getDay()]; return `${+m}월 ${+d}일(${w})`; };
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const won = n => (Number(n)||0).toLocaleString("ko-KR")+"원";
const isExec = () => !!S.role;
const isMember = () => !!S.prof;
const myName = () => (S.prof&&S.prof.name) || (S.user&&S.user.displayName) || "운영진";

/* ───────── 공통 조각 ───────── */
function header(title, lead){
  const {r} = route();
  if(MODE==="exec") return `<div class="top"><a class="brand" href="#exec" aria-label="KUSC 운영실"><b>KUSC</b><span>운영실</span></a>
    <nav class="tabs" aria-label="메뉴"><a href="./">학회원 사이트</a>${S.user?`<a href="#" data-out>로그아웃</a>`:""}</nav></div>
    ${title?`<h1>${title}</h1>`:""}${lead?`<p class="lead">${lead}</p>`:""}`;
  const on = k => (r===k || (k==="board"&&r==="post") || (k==="news"&&r==="news")) ? "on" : "";
  const tabs = isMember() ? `<nav class="tabs" aria-label="메뉴">
    ${isMember()?`<a href="#home" class="${on("home")}">내 공간</a><a href="#news" class="${on("news")}">소식</a>
    <a href="#board" class="${on("board")}">커뮤니티</a><a href="#class" class="${on("class")}">강의실</a>
    <a href="#me" class="${on("me")}">내 정보</a>`:""}</nav>` : "";
  return `<div class="top"><a class="brand" href="#" aria-label="KUSC 홈페이지"><b>KUSC</b><span>건국대학교 경영대학 전략학회</span></a>${tabs}</div>
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
    "permission-denied":"권한이 없어요. 임원진에게 알려주세요"
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
      <h2>우리의 목표는<br>카르텔이에요</h2>
      <p class="lsub">여기서 함께 반짝인 별들이 업계 곳곳에 자리 잡고, 서로를 끌어주는 별자리가 되는 것. 졸업한 선배는 한 번 강연하고 끝나는 손님이 아니라, 후배를 이끌고 기회를 나누며 학회를 함께 키우는 사람이에요.</p>
      <div class="lduo trio">
        <div><h3>엄격하게 고르고</h3><p>진출 의지가 분명한 학생을 서류와 면접으로 골라요. 들어오기 어려운 만큼 서로를 믿을 수 있어요.</p></div>
        <div><h3>깊게 단련하고</h3><p>실제 기업의 문제로 한 학기를 채워요. 같은 문제를 끝까지 붙들어 본 사이라 서로의 실력을 알아요.</p></div>
        <div><h3>끝까지 이어져요</h3><p>먼저 나간 선배가 멘토링과 서류 피드백, 프로젝트와 기회를 들고 다시 돌아와요. 그 후배가 또 다음 후배를 끌어줘요.</p></div>
      </div>
    </div>
  </section>

  <section class="lsec lend">
    <div class="lin narrow">
      <h2>다음 별을<br>기다리고 있어요</h2>
      <p class="lsub">전공과 학년에 관계없이, 전략 직무로 나아가려는 의지가 분명한 건국대학교 학생이라면 지원할 수 있어요. 다음 모집 일정은 정해지는 대로 이곳에 올라와요.</p>
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
    if(J.roster&&J.roster.diag){ data.diag=J.roster.diag; data.diagAt=J.roster.diag.ts||""; data.diagFrom="1강 진단"; }
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
  const done=[!!dg,!!g.l2,!!g.l3,!!g.l4], n=done.filter(Boolean).length;
  const best = dg ? AXES[dg.a.indexOf(Math.max(...dg.a))] : "";
  const paid = p.dues && p.dues[TERM];
  app.innerHTML = header(`${esc(p.name)} 님, 반가워요`,
    `${esc(p.major)} ${esc(p.grade)} <span class="badge ku">KUSC 학회원</span>${isExec()?' <span class="badge">임원진</span>':""}`)+`
  <div class="grid">
    <section class="card" id="hnot"><div class="lesson">공지</div><div class="skel sm"></div></section>
    <section class="card" id="hev"><div class="lesson">다가오는 일정</div><div class="skel sm"></div></section>
  </div>
  ${dg?`<section class="card">
      <div class="lesson">1강 · 내 역량 진단</div>
      <h2 style="margin-top:4px">내 역량의 모양</h2>
      <p class="desc">${day(p.diagAt||dg.ts)} 진단${p.diagFrom?` · ${esc(p.diagFrom)}에서 불러왔어요`:""}</p>
      <div class="hexwrap">${hexSVG(dg.a)}
        <div class="facts">
          <div class="fact"><small>가장 닮은 직무</small><b>${esc(JOBNAME[dg.fit]||dg.fit)}</b></div>
          <div class="fact"><small>내가 원했던 직무</small><b>${esc(JOBNAME[dg.want]||dg.want)}</b></div>
          <div class="fact"><small>가장 강한 역량</small><b>${esc(best)}</b></div>
        </div></div>
      <div class="row"><a class="btn pri" href="diagnostic.html?view=mine">결과 자세히 보기</a><a class="btn sec" href="diagnostic.html?from=app">다시 진단하기</a></div>
    </section>`
  :`<section class="card">
      <div class="lesson">먼저 해 볼 것</div>
      <h2 style="margin-top:4px">내 역량 진단부터 시작해요</h2>
      <p class="desc">일상 속 상황 17개로 여섯 역량의 모양을 그리고, 여섯 전략 직무 중 어디와 닮았는지 확인해요. 기본 정보는 가입할 때 받은 걸로 채워서 바로 문항부터 시작해요.</p>
      <div class="meta"><span>약 8분</span><span>개인 결과</span><span>이번 학기 목표 3가지</span></div>
      <div class="row"><a class="btn pri" href="diagnostic.html?from=app">진단 시작하기 →</a></div>
    </section>`}
  <div class="grid">
    <section class="card">
      <div class="lesson">이번 학기 강의</div>
      <h3 style="margin-top:6px">4개 중 ${n}개를 함께했어요</h3>
      <div class="prog">${["정의","구조화","검증","진입"].map((t,i)=>`<div class="${done[i]?"done":""}"><small>${i+1}강</small><b>${t}</b></div>`).join("")}</div>
      <div class="row"><a class="btn sec sm" href="#class">강의실 가기</a></div>
    </section>
    <section class="card">
      <div class="lesson">${TERM_LABEL} 회비</div>
      <h3 style="margin-top:6px">${paid?"납부 확인됐어요":"아직 확인 전이에요"} <span class="badge ${paid?"ku":""}">${DUES}</span></h3>
      <p class="desc">${paid?`${day(paid)}에 임원진이 확인했어요.`:"입금 계좌는 소식의 정산 공지에 늘 올라와 있어요. 입금 후 임원진이 확인하면 여기에 표시돼요."}</p>
      <div class="row"><a class="btn sec sm" href="#news">소식 보기</a></div>
    </section>
  </div>
  <section class="card">
    <div class="lesson">곧 열려요</div>
    <h3 style="margin-top:6px">작성실</h3>
    <p class="desc">내 경험을 정리하고, 4강 방식대로 레쥬메 불릿과 자소서를 써 보는 곳이에요. 쓴 내용은 계정에 저장돼서 어느 기기에서든 이어 쓸 수 있어요.</p>
  </section>`+foot();
  try{
    const [ns, evs] = await Promise.all([load("notices",F.listNotices), load("events",F.listEvents)]);
    const top = [...ns].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)).slice(0,3);
    $("#hnot").innerHTML = `<div class="lesson">공지</div>${top.length?top.map(x=>`<a class="li" href="#news"><span class="badge ${x.tag==="정산"?"ku":""}">${esc(x.tag||"공지")}</span><b>${x.pinned?"📌 ":""}${esc(x.title)}</b><small>${day(x.createdAt)}</small></a>`).join("")
      :`<p class="desc">아직 공지가 없어요.</p>`}`;
    const up = evs.filter(e=>e.date>=today()).sort((a,b)=>a.date.localeCompare(b.date))[0];
    $("#hev").innerHTML = `<div class="lesson">다가오는 일정</div>${up?`<h3 style="margin-top:6px">${esc(up.title)}</h3>
      <p class="desc">${ymd(up.date)} ${esc(up.time||"")} · ${esc(up.place||"장소 미정")}</p>
      <div class="row"><a class="btn pri sm" href="#news/events">참석 응답하기</a></div>`:`<p class="desc">예정된 일정이 없어요.</p>`}`;
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
        const rs=await F.listRsvp(e.id); const mine=rs.find(r=>r.uid===S.user.uid)||{};
        const yes=rs.filter(r=>r.status==="참석").length, party=rs.filter(r=>r.party==="참석").length;
        const open=e.date>=today();
        return `<section class="card tight" data-eid="${e.id}">
          <div class="lesson">${ymd(e.date)} ${esc(e.time||"")}${open?"":" · 지난 일정"}</div>
          <h3 style="margin-top:6px">${esc(e.title)}</h3>
          <div class="kv"><span>장소</span><b>${esc(e.place||"미정")}</b>${e.party?`<span>뒤풀이</span><b>${esc(e.party)}</b>`:""}${e.fee?`<span>참가비</span><b>${esc(e.fee)}</b>`:""}${e.account?`<span>입금 계좌</span><b>${esc(e.account)}</b>`:""}</div>
          ${e.desc?`<p class="body">${nl(e.desc)}</p>`:""}
          <p class="hint">참석 ${yes}명${e.party?` · 뒤풀이 ${party}명`:""}</p>
          ${open?`<div class="field"><label class="l">참석</label><div class="chips">${["참석","불참","미정"].map(o=>`<span class="chip ${mine.status===o?"on":""}" data-rs="status" data-v="${o}">${o}</span>`).join("")}</div></div>
          ${e.party?`<div class="field"><label class="l">뒤풀이</label><div class="chips">${["참석","불참","미정"].map(o=>`<span class="chip ${mine.party===o?"on":""}" data-rs="party" data-v="${o}">${o}</span>`).join("")}</div></div>`:""}`:""}
        </section>`;
      };
      box.innerHTML = (up.length?(await Promise.all(up.map(card))).join(""):`<section class="card"><p class="desc">예정된 일정이 없어요.</p></section>`)
        + (past.length?`<h3 style="margin:26px 0 0">지난 일정</h3>`+(await Promise.all(past.slice(0,6).map(card))).join(""):"");
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
    const cs=await F.listComments(id), mine=p.uid===S.user.uid;
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
        <p>${nl(c.body)}</p>${(c.uid===S.user.uid||isExec())?`<button class="link" data-cdel="${c.id}">지우기</button>`:""}</div>`).join("")||`<p class="desc">첫 댓글을 남겨 보세요.</p>`}
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
      <p class="desc">일상 속 상황 17개로 나의 역량 모양을 그리고, 여섯 전략 직무 중 어디와 닮았는지 확인합니다.</p>
      <a class="go" href="${p.diag?"diagnostic.html?view=mine":"diagnostic.html?from=app"}">${p.diag?"내 결과 보기":"진단 시작하기"}<b>→</b></a>
    </section>
    <section class="card lec">
      <div class="art" id="cast"></div>
      <div class="lesson" style="margin-top:20px">2강 · 전략 직무 구조화하기${ok(1)}</div>
      <h2 style="margin-top:4px">전략 직무 시뮬레이션</h2>
      <p class="desc">디저트 브랜드 ‘하프’가 매각되기까지 7년. 회사가 커질 때마다 어떤 직무가 왜 필요해지는지 따라갑니다.</p>
      <a class="go" href="simulation.html" ${mark("l2")}>시뮬레이션 열기<b>→</b></a>
    </section>
    <section class="card lec">
      <div class="lesson">3강 · 전략 직무 검증하기${ok(2)}</div>
      <h2 style="margin-top:4px">여섯 직무 현직자 강연</h2>
      <p class="desc">IB, PE, VC, 컨설팅, 전략기획, PM 현직자의 진출 노하우와 출근 후기. 10월 28일에 함께했어요.</p>
      ${tbu("강연 자료","연사분들께 공개 동의를 받는 대로 이곳에 올라와요")}
      <a class="go" href="apply.html" ${mark("l3")}>그날의 신청 기록<b>→</b></a>
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
  <section class="card">
    <div class="lesson">강의 후기</div>
    <h3 style="margin-top:6px">잘된 점, 아쉬운 점, 다음에 해 볼 것</h3>
    ${tbu("강의별 후기 (KPT)","임원진 회고 방식 그대로, 강의마다 남기는 짧은 후기")}
  </section>`+foot();
  if(typeof chr==="function") $("#cast").innerHTML=["VC","PM","BP","CS","PE","IB"].map(k=>chr(k)).join("");
  $$("[data-mark]").forEach(a=>a.addEventListener("click",()=>{ const k=a.dataset.mark;
    if(!(S.prof.progress||{})[k]){ F.markProgress(S.user.uid,k).catch(()=>{}); S.prof.progress={...(S.prof.progress||{}),[k]:new Date().toISOString()}; } }));
}

/* ───────── 내 정보 ───────── */
function viewMe(){
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
    <p class="desc">${esc(S.user.email||"")} · ${provider}로 로그인</p>
    <p class="err" id="err3"></p>
    <div class="row"><button class="btn sec" id="out">로그아웃</button><button class="btn sec" id="del" style="color:var(--red)">회원 탈퇴</button></div>
  </section>`+foot();
  const keep=()=>{ d.phone=val("phone"); d.age=val("age"); d.major=val("major"); d.major2=val("major2"); };
  bindChips(d, ()=>{ keep(); viewMe(); });
  if(window.__bip){ $("#instwrap").style.display="flex"; $("#inst").onclick=()=>{ window.__bip.prompt(); window.__bip=null; }; }
  $("#save").onclick=async()=>{ keep();
    if(d.phone && !/^01\d{8,9}$/.test(d.phone.replace(/\D/g,""))) return showErr("휴대폰 번호를 확인해 주세요");
    try{ const patch={phone:fmtPhone(d.phone),grade:d.grade,age:d.age,gender:d.gender,major:d.major,major2:d.major2,jobs:d.jobs,stage:d.stage};
      await F.updateProfile(S.user.uid,patch); Object.assign(S.prof,patch); $("#saved").style.display="block"; $("#err").style.display="none"; }
    catch(e){ showErr(authMsg(e)); } };
  $("#out").onclick=()=>F.signOut();
  $("#del").onclick=async()=>{ const b=$("#del");
    if(b.dataset.armed!=="1"){ b.dataset.armed="1"; b.textContent="정말 탈퇴할게요 (한 번 더 누르기)"; return; }
    b.disabled=true; try{ await F.deleteMe(S.user, S.prof); }catch(e){ b.disabled=false; showErr(authMsg(e),"err3"); } };
}

/* ───────── 임원진 공간 ───────── */
const EXEC_TABS = [["dash","현황"],["roster","명단·요청"],["members","회원·회비"],["post","공지·일정"],["money","재정"],["minutes","회의록"],["system","운영 체계"]];
async function viewExec(){
  if(!isExec() || MODE!=="exec"){ location.hash="#home"; return; }
  const tab = route().arg || "dash";
  app.innerHTML = header("운영실","")+`<div class="seg scrollx">${EXEC_TABS.map(([k,t])=>`<a href="#exec/${k}" class="${tab===k?"on":""}">${t}</a>`).join("")}</div>
    ${isMember()?"":`<div class="notice">아직 학회원 가입을 하지 않은 임원진 계정이에요. 명단·요청 탭에서 명단을 올린 뒤 <a href="./#join" style="color:inherit;font-weight:800">학회원 사이트에서 가입하면</a> 내 공간, 소식, 커뮤니티도 쓸 수 있어요.</div>`}
    <div id="xbody"><div class="skel"></div></div>`+foot();
  const box=$("#xbody");
  const err=e=>{ box.innerHTML=`<section class="card"><p class="err" style="display:block">${authMsg(e)}</p></section>`; };
  try{ await ({dash:xDash,roster:xRoster,members:xMembers,post:xPost,money:xMoney,minutes:xMinutes,system:xSystem}[tab]||xDash)(box); }catch(e){ err(e); }
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
      $("#rok").textContent=`${n}명을 명단에 올렸어요.`; $("#rok").style.display="block"; setTimeout(viewExec,900);
    }catch(err){ showErr(err.code?authMsg(err):(err.message||"파일을 읽지 못했어요"),"err2"); }
  };
}

async function xMembers(box){
  const [users, admins] = await Promise.all([F.listUsers(), F.listAdmins()]);
  const role=uid=>(admins.find(a=>a.uid===uid)||{}).role;
  users.sort((a,b)=>String(a.name).localeCompare(String(b.name),"ko"));
  const paid=users.filter(u=>u.dues&&u.dues[TERM]).length;
  box.innerHTML = `<section class="card">
    <h2>회원과 회비</h2>
    <p class="desc">${TERM_LABEL} 회비 ${DUES}: ${users.length}명 중 ${paid}명 확인. 입금을 확인하면 체크하세요. 본인 화면에도 바로 표시돼요.</p>
    <div class="row"><button class="btn pri sm" id="mcsv">회원 연락망 CSV</button><button class="btn sec sm" id="unpaid">미납자 이름 복사</button></div>
    <p class="ok" id="cp" style="display:none"></p>
    <div class="scroll"><table class="tbl"><tr><th>회비</th><th>이름</th><th>학년</th><th>주전공</th><th>연락처</th><th>진단</th>${S.role==="admin"?"<th>임원진</th>":""}</tr>
      ${users.map(u=>`<tr><td><input type="checkbox" class="due" data-uid="${u.uid}" ${u.dues&&u.dues[TERM]?"checked":""} aria-label="${esc(u.name)} 회비"></td>
        <td>${esc(u.name)}${role(u.uid)?` <span class="badge ku">${role(u.uid)==="admin"?"관리자":"임원진"}</span>`:""}</td><td>${esc(u.grade)}</td><td>${esc(u.major)}</td><td>${esc(u.phone||"")}</td>
        <td>${u.diag?esc(JOBNAME[u.diag.fit]||""):"-"}</td>
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
  if(!S.prof){
    if(r==="join"){ if(S.join) S.join.force=true; }
    return viewJoin();
  }
  if(r==="news") return viewNews();
  if(r==="board") return viewBoard();
  if(r==="post") return viewPost(arg);
  if(r==="class") return viewClass();
  if(r==="me") return viewMe();
  return viewHome();
}
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
  S.user=u; S.sheetOpen=false; S.prof=null; S.role=null; S.req=null; S.join=null; S.me=null; S.cache={};
  if(u){
    try{ S.prof=await F.getProfile(u.uid); }catch(e){ S.prof=null; }
    S.role=await F.getRole(u.uid);
    if(!S.prof){ try{ S.req=await F.getMyRequest(u.uid); }catch(e){} }
    if(S.afterLogin){ S.afterLogin=false; S.ready=true; const to = MODE==="exec" ? "#exec" : S.prof ? "#home" : "#join"; if(location.hash!==to){ location.hash = to; return; } }
  }
  S.ready=true; render();
});
if("serviceWorker" in navigator && location.protocol.indexOf("http")===0){ navigator.serviceWorker.register("sw.js").catch(function(){}); }
