/* Service worker de l'e-formation — portée /formation/ uniquement.
   Stratégie : network-first pour le HTML (toujours la dernière version),
   stale-while-revalidate pour les assets et les données (rapide + à jour),
   et repli sur le cache quand le réseau est absent → la formation reste
   consultable hors connexion une fois visitée. */
const CACHE = 'formation-cp-v1';
const SHELL = [
  './',
  './index.html',
  './assets/app.css',
  './assets/app.js',
  './data/curriculum.json',
  './data/glossaire.json',
  './data/defauts.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // YouTube, miniatures : on laisse passer
  if (!url.pathname.startsWith('/formation/')) return; // on ne touche pas au reste du site

  // HTML : réseau d'abord, cache en secours
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Assets et données : cache immédiat, mise à jour en arrière-plan
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(r => {
        if (r && r.status === 200) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
