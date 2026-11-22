/* ─────────────────────────────────────────────
   커리큘럼 피드백 설문 — 질문 정의
   학기마다 이 파일의 term과 질문만 바꾸면 화면, 저장, 운영실 집계가 같이 바뀝니다.

   질문 종류
   - one   : 하나 고르기            opts 또는 optsFrom(앞 질문에서 고른 것), etc(기타 직접 입력)
   - many  : 여러 개 고르기          opts, etc, none(이걸 고르면 나머지는 해제)
   - scale : 1~5점 하나            lo/hi(양 끝 설명), na(해당 없음 선택지)
   - grid  : 행마다 1~5점           rows 또는 rowsFrom, lo/hi, na
   - nps   : 0~10점 추천 의향
   - text  : 서술형
   showIf : { q: 질문 id, has: 값 } 이면 그 질문에서 해당 값을 골랐을 때만 보임
   ───────────────────────────────────────────── */
const L1 = "1강", L2 = "2강", L3 = "3강 (현직자 연사 세션)", L4 = "4강 (서류·면접: 별자리와 신화)";
const AGREE = { lo: "전혀 아니다", hi: "매우 그렇다" };

export const SURVEY = {
  term: "2026-2",
  title: "2026년 2학기 커리큘럼 피드백",
  intro: "이번 학기 커리큘럼, 함께해 줘서 고마워요. 좋았던 건 이어 가고 아쉬웠던 건 고쳐서 다음 학기를 더 좋게 만들려고 해요. 솔직하게 답해 줄수록 큰 도움이 돼요.",
  notes: [
    "답변은 임원진에게 공개되지 않고, 커리큘럼을 맡은 백재웅 선배만 확인해요.",
    "5~7분이면 충분해요. 한 학기에 한 번만 낼 수 있어요."
  ],
  pages: [
    { t: "A. 나에 대해", d: "답변을 묶어서 보기 위한 기본 정보예요.", qs: [
      { id: "a1", q: "나는 지금", type: "one", req: 1, opts: ["KUSC 학회원", "KUSC 임원진"] },
      { id: "a2", q: "학년은?", type: "one", req: 1, opts: ["1학년", "2학년", "3학년", "4학년", "졸업 유예·기타"] },
      { id: "a3", q: "가장 관심 있는 직무는?", sub: "여러 개 골라도 돼요", type: "many", req: 1, etc: 1, none: "아직 모르겠다",
        opts: ["전략기획", "컨설팅", "IB", "PM", "PE", "VC", "아직 모르겠다"] },
      { id: "a4", q: "참석한 회차를 모두 골라 주세요", sub: "여기서 고른 회차만 뒤에서 물어봐요", type: "many", req: 1, opts: [L1, L2, L3, L4] },
      { id: "a5", q: "KUSC를 처음 알게 된 경로는?", type: "one", req: 1, etc: 1, opts: ["학회 단톡방", "지인 추천", "인스타그램", "학과 공지"] }
    ]},
    { t: "B. 커리큘럼 전체", d: "이번 학기 커리큘럼 전체를 떠올리며 답해 주세요.", qs: [
      { id: "b1", q: "이번 학기 커리큘럼에 전반적으로 만족해요", type: "scale", req: 1, ...AGREE },
      { id: "b2", q: "주변 친구에게 이 커리큘럼을 추천한다면?", type: "nps", req: 1 },
      { id: "b3", q: "정의하기, 구조화하기, 현직자 세션, 서류와 면접으로 이어지는 흐름이 하나로 연결됐어요", type: "scale", req: 1, ...AGREE },
      { id: "b4", q: "내용 난이도는 어땠나요?", type: "one", req: 1, opts: ["너무 쉬움", "쉬움", "적절", "어려움", "너무 어려움"] },
      { id: "b5", q: "한 회 진행 시간은 어땠나요?", type: "one", req: 1, opts: ["너무 짧음", "적절", "너무 김"] },
      { id: "b6", q: "이제 KUSC가 어떤 학회인지 한 문장으로 설명할 수 있어요", type: "scale", req: 1, ...AGREE }
    ]},
    { t: "C. 회차별 평가", d: "앞에서 고른 회차만 물어봐요.", qs: [
      { id: "c1", q: "회차별로 얼마나 만족했나요?", type: "grid", req: 1, rowsFrom: "a4", lo: "전혀 만족하지 않음", hi: "매우 만족" },
      { id: "c2", q: "가장 도움이 된 회차는?", type: "one", req: 1, optsFrom: "a4" },
      { id: "c3", q: "그 회차가 도움이 된 이유는?", type: "text", rows: 3, ph: "어떤 내용, 어떤 순간이 좋았는지 짧게라도 좋아요" },
      { id: "c4", q: "[1강] 직무 성향 진단 결과가 나를 이해하는 데 도움이 됐어요", type: "scale", req: 1, showIf: { q: "a4", has: L1 }, ...AGREE },
      { id: "c5", q: "[2강] 회사가 크는 단계마다 어떤 직무가 왜 필요해지는지 이해했어요", type: "scale", req: 1, showIf: { q: "a4", has: L2 }, ...AGREE },
      { id: "c6", q: "[3강] 연사 구성(직무와 경력)이 내 관심 직무와 맞았어요", type: "scale", req: 1, showIf: { q: "a4", has: L3 }, ...AGREE },
      { id: "c7", q: "[3강] 뒤풀이의 연사별 테이블 구성이 네트워킹에 도움이 됐어요", type: "scale", req: 1, showIf: { q: "a4", has: L3 }, ...AGREE, na: "뒤풀이 안 감" },
      { id: "c8", q: "[4강] 실제로 써먹을 내용을 모두 골라 주세요", type: "many", req: 1, showIf: { q: "a4", has: L4 }, none: "아직 없음",
        opts: ["채용 공고 속 숨은 메시지 분석", "Top-down, Bottom-up 구조화 방법", "국문, 영문 Resume 템플릿", "불릿 공식 (동사로 시작, 방법, 숫자 결과)",
               "자소서 미끼 6유형", "면접 키워드와 예상 질문 정리", "경험 데이터와 파일 정리법", "아직 없음"] },
      { id: "c9", q: "[4강] 강연을 듣고 내 서류를 고치거나 새로 쓸 생각이 생겼어요", type: "scale", req: 1, showIf: { q: "a4", has: L4 }, ...AGREE }
    ]},
    { t: "D. 나의 변화", d: "커리큘럼을 듣기 전의 나와 비교해 주세요.", qs: [
      { id: "d1", q: "듣기 전보다 이 역량이 나아졌어요", type: "grid", req: 1, ...AGREE,
        rows: ["문제 정의", "구조화", "수치화", "가설 수립", "정보 탐색", "설득 (서류와 말하기)"] },
      { id: "d2", q: "배운 방식을 수업이나 대외활동에 실제로 써 봤나요?", type: "one", req: 1, opts: ["써 봤어요", "써 볼 계획이에요", "아직 없어요"] },
      { id: "d3", q: "어디에 어떻게 써 봤나요?", type: "text", rows: 3, showIf: { q: "d2", has: "써 봤어요" }, ph: "예: 조별과제에서 이슈를 나눌 때 구조화 방식을 썼어요" }
    ]},
    { t: "E. 운영", d: "공지, 장소, 시간 같은 운영 이야기예요.", qs: [
      { id: "e1", q: "일정과 장소 공지를 제때, 분명하게 받았어요", type: "scale", req: 1, ...AGREE },
      { id: "e2", q: "공지는 주로 어디서 봤나요?", type: "one", req: 1, etc: 1, opts: ["학회 단톡방", "인스타그램", "지인 전달", "현장에서 처음 앎"] },
      { id: "e3", q: "앞으로 공지는 어디서 받는 게 가장 편한가요?", type: "one", req: 1, etc: 1, opts: ["학회 단톡방", "인스타그램", "이 학회원 사이트"] },
      { id: "e4", q: "뒤풀이 장소, 회비, 정산 안내가 분명했어요", type: "scale", req: 1, ...AGREE, na: "뒤풀이 안 감" },
      { id: "e5", q: "19시 시작은 어땠나요?", type: "one", req: 1, opts: ["적절해요", "더 일찍 시작하면 좋겠어요", "더 늦게 시작하면 좋겠어요", "상관없어요"] },
      { id: "e6", q: "강연 장소(오기 편함, 좌석, 장비)에 만족해요", type: "scale", req: 1, ...AGREE }
    ]},
    { t: "F. 다음 학기", d: "다음 학기를 설계하는 데 바로 쓰는 질문이에요.", qs: [
      { id: "f1", q: "다음 학기에도 새 커리큘럼을 이어서 진행하는 것에", type: "one", req: 1, opts: ["찬성해요", "반대해요", "잘 모르겠어요"] },
      { id: "f2", q: "그렇게 생각한 이유는?", type: "text", rows: 3, ph: "한 줄이어도 괜찮아요" },
      { id: "f3", q: "다음 커리큘럼에서 다뤘으면 하는 것은?", sub: "여러 개 골라도 돼요", type: "many", etc: 1,
        opts: ["엑셀 재무 모델링", "산업과 기업 분석 실습", "현직자 커피챗과 멘토링", "서류 1:1 피드백", "면접 실전 연습", "포트폴리오 만들기"] },
      { id: "f4", q: "다음 학기에도 참여할 생각이 있나요?", type: "one", req: 1, opts: ["꼭 참여할래요", "주제를 보고 정할래요", "어려울 것 같아요"] }
    ]},
    { t: "G. 하고 싶은 말", d: "마지막이에요. 편하게 적어 주세요.", qs: [
      { id: "g1", q: "이번 커리큘럼에서 꼭 지켜야 할 한 가지는?", type: "text", req: 1, rows: 3, ph: "다음에도 그대로 했으면 하는 것" },
      { id: "g2", q: "꼭 바꿔야 할 한 가지와, 어떻게 바꾸면 좋을지", type: "text", rows: 3, ph: "아쉬웠던 점과 함께 개선 아이디어도 적어 주면 좋아요" },
      { id: "g3", q: "백재웅 선배에게 전하고 싶은 말", sub: "분량 상관없이 자유롭게", type: "text", rows: 6,
        ph: "고마웠던 점, 아쉬웠던 점, 궁금한 점, 응원이나 쓴소리까지 무엇이든 좋아요" }
    ]}
  ]
};

export function rowsOf(q, a) { return q.rowsFrom ? (a[q.rowsFrom] || []) : (q.rows || []); }
export function optsOf(q, a) { return q.optsFrom ? (a[q.optsFrom] || []) : (q.opts || []); }
export function shown(q, a) {
  if (!q.showIf) return true;
  const v = a[q.showIf.q];
  return Array.isArray(v) ? v.includes(q.showIf.has) : v === q.showIf.has;
}
export const allQs = () => SURVEY.pages.flatMap(p => p.qs);
/* 운영실 집계용: rowsFrom/optsFrom 질문의 전체 행 */
export const allRows = q => q.rowsFrom ? allQs().find(z => z.id === q.rowsFrom).opts : (q.rows || []);
