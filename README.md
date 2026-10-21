# KUSC 사이트 파일 안내

| 파일 | 역할 | GitHub 업로드 |
|---|---|---|
| index.html | 첫 화면 (진단 · 시뮬레이션 · 3강 신청 입구) | O |
| apply.html | 3강 신청 폼 (ENDPOINT 입력 후 업로드) | O |
| simulation.html | 2강 하프의 7년 | O (변경 없음) |
| sw.js | 오프라인 캐시 (apply.html 포함, 버전 v3) | O |
| manifest.json | 앱 정보 | O (변경 없음) |
| README.md | 이 안내 | O |
| diagnostic.html | 1강 진단 — 저장소에 있는 ENDPOINT 입력본을 그대로 둘 것 | X |
| appsscript-backend.js | 구글 시트 Apps Script 코드 | X (Apps Script에 붙여넣기) |

## 주소
- 첫 화면: https://mschiefmngd.github.io/KUSC.st.tool/
- 신청: https://mschiefmngd.github.io/KUSC.st.tool/apply.html
- 신청 현황(운영진): .../apply.html?admin
- 내 폰 신청 기록 초기화(테스트용): .../apply.html?reset

## 설정
- 신청 마감 시각: apply.html 상단 `DEADLINE`
- 운영진 비밀번호: Apps Script 스크립트 속성 `ADMIN_KEY`
- 저장 위치: 같은 구글 시트 — 진단은 `responses` 탭, 신청은 `apply` 탭
