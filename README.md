# KUSC 사이트 파일 안내

| 파일 | 역할 | GitHub 업로드 |
|---|---|---|
| index.html | 첫 화면 (진단 · 시뮬레이션 · 3강 신청 입구) | O |
| apply.html | 3강 신청 폼 (ENDPOINT 입력 후 업로드) | O |
| download.html | 4강 서류 양식 받기 (학회원 확인, 비학회원 정보 입력) | O |
| files/ | 양식 2종(Word), 작성 요령 2종(PDF), 묶음 zip | O |
| simulation.html | 2강 하프의 7년 | O (변경 없음) |
| sw.js | 오프라인 캐시 (apply.html 포함, 버전 v3) | O |
| manifest.json | 앱 정보 | O (변경 없음) |
| README.md | 이 안내 | O |
| diagnostic.html | 1강 진단 — 저장소에 있는 ENDPOINT 입력본을 그대로 둘 것 | X |
| appsscript-backend.js | 구글 시트 Apps Script 코드 | X (Apps Script에 붙여넣기) |
| appsscript-download-addon.js | 양식 다운로드용 추가 코드 (기존 Apps Script에 새 파일로) | X (Apps Script에 붙여넣기) |

## 주소
- 첫 화면: https://mschiefmngd.github.io/KUSC.st.tool/
- 신청: https://mschiefmngd.github.io/KUSC.st.tool/apply.html
- 서류 양식: https://mschiefmngd.github.io/KUSC.st.tool/download.html
- 다운로드 현황(운영진): .../download.html?admin
- 내 폰 다운로드 기록 초기화(테스트용): .../download.html?reset
- 신청 현황(운영진): .../apply.html?admin
- 내 폰 신청 기록 초기화(테스트용): .../apply.html?reset

## 설정
- 신청 마감 시각: apply.html 상단 `DEADLINE`
- 운영진 비밀번호: Apps Script 스크립트 속성 `ADMIN_KEY`
- 저장 위치: 같은 구글 시트 — 진단은 `responses` 탭, 신청은 `apply` 탭, 양식 다운로드는 `downloads` 탭
- 학회원 명단: 같은 시트의 `members` 탭 (A열 이름, B열 학번). 학기마다 갱신
- 양식 교체: files/ 안의 파일을 같은 이름으로 덮어쓰면 링크가 그대로 유지됨

## 회원 사이트 (Firebase)
- 첫 화면(index.html)이 로그인, 가입, 내 홈, 강의실, 내 정보, 운영진 화면을 모두 담당
- Firebase 프로젝트: kusc-77206 (Authentication: 구글, 이메일 / Firestore: 서울)
- 연결 코드: js/fb.js — 화면은 이 파일의 함수만 사용
- 보안 규칙: firestore.rules — 고치면 Firebase 콘솔 → Firestore → 규칙에 다시 붙여넣고 게시
- 운영진 지정: Firestore의 admins 컬렉션에 문서 ID = 계정 번호(내 정보 화면 맨 아래)로 문서 추가
- 학회원 명단: 운영진 화면 → 학회원 명단 → 파일 올리기 (JSON 또는 '이름','학번' 열이 있는 CSV)
- 진단(diagnostic.html)은 로그인한 회원이면 결과를 계정에도 저장, ?view=mine 으로 내 결과 다시 보기
