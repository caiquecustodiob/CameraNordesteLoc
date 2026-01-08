
const CACHE_NAME = 'nordeste-pro-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos paths relativos para que funcione em qualquer subdomínio da Vercel
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// Estratégia Stale-While-Revalidate: Rápido e sempre atualizado
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Apenas faz o cache se a resposta for válida
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silencia erros de rede (offline)
        return null;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
