// Rhynia Intelligence PWA Service Worker (v1.6.5 - Restored Viewport Top Bar & Wider Cards)
const CACHE_NAME = "rhynia-pwa-v165";

const CORE_STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/config.js",
  "/app.js",
  "/manifest.json",
  "/modules/db.js",
  "/modules/sync.js",
  "/modules/restore.js",
  "/modules/browser_search.js",
  "/modules/device_ai.js",
  "/modules/router.js",
  "/modules/auth.js",
  "/modules/chat.js",
  "/modules/composer.js",
  "/modules/drawer.js",
  "/modules/feedback.js",
  "/modules/i18n.js",
  "/modules/ppt_viewer.js",
  "/modules/settings.js",
  "/assets/logo.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/favicon.png",
  "/assets/chat-hero-full.png",
  "/assets/chat-center-badge.png"
];

// Install Event — Pre-caching core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[Rhynia SW] Non-critical cache skip for ${asset}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate Event — Clean up stale caches from previous releases
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[Rhynia SW] Purging stale cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event — Stale-While-Revalidate for JS/CSS/Images, Network-first for Navigations, Pass-through for APIs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Direct pass-through for API calls and cross-origin requests
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  // 2. Navigation requests: Network-first, fallback to cached index.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResp;
        })
        .catch(() => {
          return caches.match("/index.html").then((fallback) => fallback || caches.match("/"));
        })
    );
    return;
  }

  // 3. Static Assets (JS, CSS, PNG, SVG): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResp) => {
      const fetchPromise = fetch(event.request)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResp;
        })
        .catch(() => cachedResp);

      return cachedResp || fetchPromise;
    })
  );
});
