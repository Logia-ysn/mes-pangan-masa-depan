const CACHE_NAME = 'erp-pmd-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pmd_logo.png'
];

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache v2');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            ).then(() => self.clients.claim()); // Take control of all open clients immediately
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and API calls
    if (event.request.method !== 'GET' || url.pathname.startsWith('/api')) {
        return;
    }

    // Network-First Strategy for HTML/Root to avoid stale asset hashes
    if (url.pathname === '/' || url.pathname === '/index.html') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-First Strategy for static assets (images, manifest, etc.)
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    // Only cache internal assets, ignore dynamic/external ones
                    if (!url.pathname.includes('/api/')) {
                        cache.put(event.request, responseToCache);
                    }
                });

                return response;
            });
        })
    );
});
