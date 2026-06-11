// XPIPEDREAM service worker — network-first so the installed app ALWAYS gets the latest version.
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  // For the page itself: bypass the HTTP cache entirely → freshest HTML every launch.
  if (req.mode === "navigate" || (req.destination === "document")) {
    e.respondWith(
      fetch(req, { cache: "no-store" }).catch(() => fetch(req).catch(() => caches.match(req)))
    );
  }
});
