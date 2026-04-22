const CACHE_NAME = 'hooked-v1';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Great+Vibes&display=swap'
];

// Instalar y cachear recursos
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Limpiar caches antiguas
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: network first, cache como fallback
self.addEventListener('fetch', function(event) {
  // No interceptar llamadas a Supabase ni a APIs externas
  if (event.request.url.includes('supabase.co') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('accounts.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Guardar copia en cache si es válida
        if (response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Sin red: usar cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./');
        });
      })
  );
});
