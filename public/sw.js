self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // immediately control any open clients
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // basic fetch listener for pwa compliance
  event.respondWith(fetch(event.request));
});
