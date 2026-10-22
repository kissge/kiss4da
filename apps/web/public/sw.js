const CACHE_NAME = "kiss4da-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const responseForCache = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseForCache)),
          );
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((response) => response ?? caches.match("/"))),
  );
});
