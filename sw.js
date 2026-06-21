// Service worker — painel do salão (PWA)
// v2: "rede primeiro" — sempre pega a versão mais nova quando há internet,
// e usa o cache só quando estiver offline. Assim, atualizações aparecem na hora.
const CACHE = "painel-salao-v3";
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
  // Firebase / bibliotecas: sempre rede direto (não mexe).
  if (req.url.includes("firebaseio.com") ||
      req.url.includes("googleapis.com") ||
      req.url.includes("gstatic.com")) return;
  // Rede primeiro: tenta baixar a versão atual; se falhar (offline), usa o cache.
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./painel.html")))
  );
});
