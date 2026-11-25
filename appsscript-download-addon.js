/* ─────────────────────────────────────────────
   서류 양식 다운로드 — 기존 Apps Script에 붙이는 추가 코드

   붙이는 방법 (기존 시트의 Apps Script 편집기에서)
   1. 왼쪽 '파일' 옆 + → 스크립트 → 이름: download
      → 이 파일 내용을 전부 붙여넣고 저장
   2. 기존 코드의 doPost(e) 함수 맨 첫 줄에 아래 한 줄 추가
        var dl = KUSC_dlPost_(e); if (dl) return dl;
   3. 기존 코드의 doGet(e) 함수 맨 첫 줄에 아래 한 줄 추가
        var dl = KUSC_dlGet_(e); if (dl) return dl;
   4. 배포 → 배포 관리 → 연필(수정) → 버전: '새 버전' → 배포
      ※ '새 배포'를 누르면 주소가 바뀌어 진단·신청 페이지가 끊깁니다.
        반드시 '배포 관리'에서 기존 배포를 새 버전으로 수정하세요.
   5. 시트에 생긴 members 탭에 학회원 이름과 학번을 채운다
      (A열 이름, B열 학번, 1행은 제목)

   만들어지는 탭
   - members   : 학회원 명단 (운영진이 채움)
   - downloads : 양식을 받아 간 기록 (자동)
   - site_members : 학회원 사이트 가입과 가입 요청 기록 (자동)
                    진짜 회원 정보는 Firebase에 있고, 이 탭은 확인용 사본이에요
   - feedback_2026-2 : 커리큘럼 피드백 응답 (자동, 이름 없이). 학기마다 탭이 새로 생겨요
   ───────────────────────────────────────────── */

var KUSC_DL_MEMBERS = "members";
var KUSC_DL_LOG = "downloads";
var KUSC_DL_HEAD = ["ts", "kind", "name", "sid", "phone", "school", "major",
                    "grade", "jobs", "channel", "consent"];

function KUSC_dlSheet_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
  }
  return sh;
}

function KUSC_dlJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function KUSC_dlNorm_(s) { return String(s == null ? "" : s).replace(/\s/g, ""); }
function KUSC_dlDigits_(s) { return String(s == null ? "" : s).replace(/\D/g, ""); }

/* 비학회원 정보 저장 (POST, type: "download") */
var KUSC_SITE_TAB = "site_members";
var KUSC_SITE_HEAD = ["ts", "kind", "name", "sid", "phone", "grade", "age", "gender",
                      "major", "major2", "jobs", "stage", "email", "msg"];

function KUSC_dlPost_(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return null; }
  /* 학회원 사이트 가입 기록 (POST, type: "site")
     같은 학번의 '가입' 줄이 이미 있으면 새로 쌓지 않고 그 줄을 최신 정보로 덮어씀 */
  if (d && d.type === "site") {
    var sh = KUSC_dlSheet_(KUSC_SITE_TAB, KUSC_SITE_HEAD);
    var sid = KUSC_dlDigits_(d.sid);
    var row = [
      new Date().toISOString(), d.kind || "", d.name || "", "'" + sid,
      d.phone || "", d.grade || "", d.age || "", d.gender || "", d.major || "", d.major2 || "",
      (d.jobs || []).join("/"), d.stage || "", d.email || "", d.msg || ""
    ];
    if (d.kind === "가입" && sid) {
      var v = sh.getDataRange().getValues();
      for (var i = 1; i < v.length; i++) {
        if (v[i][1] === "가입" && KUSC_dlDigits_(v[i][3]) === sid) {
          sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
          return KUSC_dlJson_({ ok: true, updated: true });
        }
      }
    }
    sh.appendRow(row);
    return KUSC_dlJson_({ ok: true });
  }
  /* 커리큘럼 피드백 (POST, type: "feedback") — 이름 없이 한 줄씩. 학기마다 탭이 따로 생김 */
  if (d && d.type === "feedback") {
    var head = ["ts"].concat(d.cols || []);
    var lock = LockService.getScriptLock();   /* 여러 명이 동시에 내도 줄이 엉키지 않게 */
    try { lock.waitLock(20000); } catch (le) {}
    try {
      var fs = KUSC_dlSheet_("feedback_" + String(d.term || ""), head);
      if (fs.getLastColumn() < head.length) fs.getRange(1, 1, 1, head.length).setValues([head]);
      fs.appendRow([new Date().toISOString()].concat(d.row || []));
    } finally { try { lock.releaseLock(); } catch (re) {} }
    return KUSC_dlJson_({ ok: true });
  }
  if (!d || d.type !== "download") return null;
  KUSC_dlSheet_(KUSC_DL_LOG, KUSC_DL_HEAD).appendRow([
    new Date().toISOString(), "guest",
    d.name || "", "", d.phone || "", d.school || "", d.major || "",
    d.grade || "", (d.jobs || []).join("/"), d.channel || "", d.consent ? "Y" : ""
  ]);
  return KUSC_dlJson_({ ok: true });
}

/* 학회원 확인 (GET ?action=member)  /  기록 조회 (GET ?action=downloads&key=) */
function KUSC_dlGet_(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "member") {
    var name = KUSC_dlNorm_(p.name), sid = KUSC_dlDigits_(p.sid);
    if (!name || !sid) return KUSC_dlJson_({ ok: false });
    var v = KUSC_dlSheet_(KUSC_DL_MEMBERS, ["이름", "학번"]).getDataRange().getValues();
    for (var i = 1; i < v.length; i++) {
      if (KUSC_dlNorm_(v[i][0]) === name && KUSC_dlDigits_(v[i][1]) === sid) {
        KUSC_dlSheet_(KUSC_DL_LOG, KUSC_DL_HEAD).appendRow([
          new Date().toISOString(), "member", String(v[i][0]).trim(), sid,
          "", "", "", "", "", "", ""
        ]);
        return KUSC_dlJson_({ ok: true });
      }
    }
    return KUSC_dlJson_({ ok: false });
  }
  if (p.action === "downloads") {
    var key = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
    if (!key || p.key !== key) return KUSC_dlJson_({ ok: false });
    var rows = KUSC_dlSheet_(KUSC_DL_LOG, KUSC_DL_HEAD).getDataRange().getValues();
    var out = [];
    for (var j = 1; j < rows.length; j++) {
      var r = rows[j], o = {};
      for (var k = 0; k < KUSC_DL_HEAD.length; k++) o[KUSC_DL_HEAD[k]] = String(r[k]);
      out.push(o);
    }
    return KUSC_dlJson_(out);
  }
  return null;
}
