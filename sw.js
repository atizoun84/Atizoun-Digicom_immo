const CACHE_NAME = 'smartloc-v2';
const OFFLINE_DATA = 'smartloc-offline-data';

// Assets essentiels pour le fonctionnement offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './config.html',
  './gestion.html',
  './comptabilite.html',
  './parametres.html',
  './login.html',
  './reparation.html',
  './synchronisation.js',
  './pwa-setup.js',
  './manifest.json',
  './logo.png',
  './timbre.png',
  './logoapp.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('🔄 Installation du Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('📦 Mise en cache des assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
    .then(() => self.skipWaiting())
  );
});

// Activation et nettoyage
self.addEventListener('activate', (event) => {
  console.log('✅ Activation du Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== OFFLINE_DATA) {
            console.log(`🧹 Nettoyage ancien cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ne pas intercepter les requêtes API/Data
  if (url.pathname.includes('/api/') || url.pathname.endsWith('.json')) {
    return;
  }
  
  // Stratégie: Cache First pour les assets, Network First pour les pages
  if (ASSETS_TO_CACHE.some(asset => url.pathname.endsWith(asset.replace('./', '')))) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

// Stratégie: Cache First
async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

// Stratégie: Network First
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // Mettre à jour le cache
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    
    return response;
  } catch (error) {
    // Retourner depuis le cache en offline
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Page offline personnalisée
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    
    throw error;
  }
}

// Gestion des messages pour le stockage offline
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SAVE_DATA') {
    event.waitUntil(
      caches.open(OFFLINE_DATA).then(cache => {
        cache.put(
          new Request(`/offline-data/${event.data.key}`),
          new Response(JSON.stringify(event.data.data))
        );
      })
    );
    
    event.ports[0].postMessage({ success: true });
  }
  
  if (event.data && event.data.type === 'GET_DATA') {
    event.waitUntil(
      caches.open(OFFLINE_DATA).then(cache => {
        return cache.match(new Request(`/offline-data/${event.data.key}`))
          .then(response => {
            if (response) {
              return response.json();
            }
            return null;
          })
          .then(data => {
            event.ports[0].postMessage(data);
          });
      })
    );
  }
});

// Synchronisation en arrière-plan (futur)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Logique de synchronisation des données en arrière-plan
  console.log('🔄 Synchronisation en arrière-plan');
}