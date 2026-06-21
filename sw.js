// Service worker — painel do salão (PWA)
const CACHE = "painel-salao-v1";
const SHELL = ["./", "./painel.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Firebase / dados em tempo real: sempre rede (não cachear).
  if (req.url.includes("firebaseio.com") ||
      req.url.includes("googleapis.com") ||
      req.url.includes("gstatic.com")) return;
  // App shell: cache primeiro, com atualização em segundo plano.
  e.respondWith(
    caches.match(req).then(hit =>
      hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./painel.html"))
    )
  );
});
