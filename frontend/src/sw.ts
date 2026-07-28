/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// ---- Offline support ----
// Serve the precached app shell for navigations when the network is down, and
// keep a last-known copy of API GET responses so the installed app still shows
// data offline instead of a blank error screen.
const API_CACHE = "footbolski-api-v1";
const appShellHandler = createHandlerBoundToURL("index.html");

async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // App-shell fallback for page navigations.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        appShellHandler({ request, event, url: new URL(request.url), params: undefined }),
      ),
    );
    return;
  }

  // Network-first with cache fallback for API calls (same or cross origin).
  if (new URL(request.url).pathname.includes("/api/")) {
    event.respondWith(networkFirst(request));
  }
});
