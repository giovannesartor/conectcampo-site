/* ConectCampo — Service Worker (PWA)
 * Conservador de propósito: cacheia APENAS estáticos (cache-first).
 * Navegações e API passam direto pela rede (network) para nunca servir
 * conteúdo dinâmico/autenticado desatualizado.
 */
const CACHE = 'cc-static-v1';
const STATIC_DESTINATIONS = ['style', 'script', 'font', 'image'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // não intercepta terceiros
  if (url.pathname.startsWith('/api/')) return; // API sempre na rede

  // Estáticos: cache-first com atualização em background
  if (STATIC_DESTINATIONS.includes(req.destination) || url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
  // Demais requisições (navegações, dados): rede normal (sem cache)
});
