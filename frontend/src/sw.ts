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

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = {};
  try {
    payload = event.data ? (event.data.json() as PushPayload) : {};
  } catch {
    payload = { body: event.data?.text() ?? "" };
  }
  const title = payload.title || "Footbolski";
  const body = payload.body || "You have a new notification.";
  const url = payload.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: { url },
      tag: "footbolski-reminder",
      renotify: true,
    } as NotificationOptions),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const target = (event.notification.data as { url?: string } | null)?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target).catch(() => undefined);
          return (client as WindowClient).focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
