// Service Worker for jamesblair.me
// Provides enhanced caching for AI models and static resources

const CACHE_NAME = 'jamesblair-v1';
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

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip non-HTTP(S) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // Handle requests
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response since it can only be consumed once
                        const responseClone = response.clone();

                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // Only cache certain types of resources
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
                    .catch((error) => {
                        console.log('Network request failed:', error);
                        // You could return a fallback response here
                        throw error;
                    });
            })
    );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});