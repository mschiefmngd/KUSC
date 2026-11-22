/* 오프라인 캐시 — 페이지는 최신을 먼저 받고, 안 되면 저장본을 보여줍니다 */
const CACHE = "kusc-v34";
const CORE = ["./", "./index.html", "./diagnostic.html", "./simulation.html", "./apply.html", "./download.html", "./admin.html", "./css/site.css", "./js/art.js", "./js/fb.js", "./js/app.js", "./js/survey.js", "./manifest.json", "./img/icons/icon-192.png", "./img/icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.url.indexOf("script.google.com") > -1) return;
  /* 로그인과 회원 데이터(Firebase)는 절대 저장하지 않음 */
  if (/googleapis\.com|firebaseapp\.com|firebasejs|identitytoolkit|securetoken/.test(req.url)) return;
  /* 서류 양식 파일: 항상 최신본을 받도록 저장하지 않음 */
  if (req.url.indexOf("/files/") > -1) return;
  /* 사이트 자체의 스크립트(js/)와 스타일(css/): 네트워크 우선. 브라우저 캐시도 건너뛰고 서버에 최신인지 확인, 안 되면 저장본 */
  if (req.url.indexOf(self.location.origin) === 0 && (req.url.indexOf("/js/") > -1 || req.url.indexOf("/css/") > -1)) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req)));
    return;
  }

  /* 페이지 이동: 네트워크 우선 → 실패하면 캐시 */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req, { cache: "no-cache" }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  /* 나머지(폰트 등): 캐시 우선 */
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (err) {} });
      return res;
    }))
  );
});
