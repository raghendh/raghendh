// Basic service worker for PWA installation eligibility.
// You can expand this later for caching, offline support, etc.

const CACHE_NAME = 'vibe-comm-cache-v1';
const urlsToCache = [
  './', // Caches the root (usually index.html)
  './index.html',
  // Add paths to other assets you want to cache, like CSS, images, or JS files if they weren't inline
  // e.g., './style.css', './icons/icon-192x192.png'
  // Note: The current app has Tailwind via CDN and inline JS, so less to cache here initially.
];

// Install event - caches core assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Install completed');
        return self.skipWaiting(); // Force the waiting service worker to become the active service worker.
      })
  );
});

// Activate event - cleans up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activate completed');
        return self.clients.claim(); // Ensures that updates to the service worker take effect immediately.
    })
  );
});

// Fetch event - serves assets from cache if available, otherwise fetches from network
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For Firebase and CDN requests, always go to the network.
  if (event.request.url.includes('firebase') || event.request.url.includes('gstatic.com') || event.request.url.includes('tailwindcss.com') || event.request.url.includes('googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Serve from cache
          // console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        // Not in cache, fetch from network
        // console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Optionally cache new assets dynamically if needed
            // For this basic setup, we rely on the install-time caching.
            return networkResponse;
          }
        );
      })
      .catch(error => {
        console.error('Service Worker: Fetch error:', error);
        // You could return a fallback offline page here if you have one cached
      })
  );
});
