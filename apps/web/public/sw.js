const CACHE_NAME = "kiss4da-shell-v2";
const APP_SHELL_URL = new URL("./", self.registration.scope).href;

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isArrangementApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes("/arrangements/");
}

function offlineResponse() {
  return new Response(JSON.stringify({ message: "オフラインのため通信できません。" }), {
    headers: { "Content-Type": "application/json" },
    status: 503,
    statusText: "Service Unavailable",
  });
}

async function cacheResponse(request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(APP_SHELL_URL))
      .then(() => self.skipWaiting()),
  );
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
  if (event.request.method !== "GET") {
    return;
  }

  if (isArrangementApiRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheResponse(event.request, response))
        .catch(async () => (await caches.match(event.request)) ?? offlineResponse()),
    );
    return;
  }

  if (new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheResponse(event.request, response))
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          return cachedPage ?? caches.match(APP_SHELL_URL);
        }),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => cacheResponse(event.request, response))
      .catch(() => caches.match(event.request)),
  );
});
