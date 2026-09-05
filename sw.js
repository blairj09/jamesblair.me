// Service Worker for jamesblair.me
// Provides enhanced caching for AI models and static resources

const CACHE_NAME = 'jamesblair-v2';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/chat.js',
    '/llms.txt',
    '/favicon.svg',
    '/images/profile.jpg',
    '/images/speaking.jpg',
    '/images/my-family.jpg',
    '/images/cycling.jpeg'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static resources');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .catch((error) => {
                console.log('Failed to cache some resources:', error);
                // Don't fail installation if some resources can't be cached
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - prefer the latest network response, with cached files as an offline fallback.
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip non-HTTP(S) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        const url = event.request.url;
                        if (url.includes('.js') || url.includes('.css') ||
                            url.includes('.html') || url.includes('.svg') ||
                            url.includes('.jpg') || url.includes('.jpeg') ||
                            url.includes('.png') || url.includes('.txt')) {
                            cache.put(event.request, responseClone);
                        }
                    })
                    .catch((error) => {
                        console.log('Failed to cache resource:', error);
                    });

                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
