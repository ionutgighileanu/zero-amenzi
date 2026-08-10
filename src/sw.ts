/// <reference lib="webworker" />
import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DAY = 60 * 60 * 24;

const runtimeCaching: RuntimeCaching[] = [
  // JS/CSS/fonturi — se schimbă rar odată publicate, cache-first
  {
    matcher: ({ request }) =>
      request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font",
    handler: new CacheFirst({
      cacheName: "static-resources",
      plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * DAY })],
    }),
  },
  // Imagini
  {
    matcher: ({ request }) => request.destination === "image",
    handler: new CacheFirst({
      cacheName: "images",
      plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * DAY })],
    }),
  },
  // Fișiere statice Next (_next/static) — imuabile, hash în nume, cache-first
  {
    matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 365 * DAY })],
    }),
  },
  // API — niciodată din cache, mereu rețea
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  // Rutele aplicației — network-first; cade pe cache dacă rețeaua nu răspunde
  {
    matcher: ({ url }) => url.pathname.startsWith("/app/"),
    handler: new NetworkFirst({
      cacheName: "app-pages",
      networkTimeoutSeconds: 10,
      plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: DAY })],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  // Dacă /app/* eșuează și la rețea și la cache, arată pagina statică de
  // offline (precache-uită automat din public/, vezi globPublicPatterns).
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher: ({ request }) => {
          if (request.destination !== "document") return false;
          try {
            return new URL(request.url).pathname.startsWith("/app/");
          } catch {
            return false;
          }
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ---------------------------------------------------------------------------
// Web Push (D-013) — canal suplimentar față de in-app + email. Payload-ul e
// controlat de server (vezi src/lib/push/send-alert.ts): { title, body, url,
// notificationId }. notificationId identifică rândul din notifications_log,
// folosit pentru tracking (push_clicked_at / push_dismissed_at).
// ---------------------------------------------------------------------------
type PushPayload = { title: string; body: string; url: string; notificationId: string };

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload | null = null;
  try {
    payload = event.data?.json() ?? null;
  } catch {
    payload = null;
  }
  if (!payload) return;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url, notificationId: payload.notificationId },
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  const { url, notificationId } = (event.notification.data ?? {}) as {
    url?: string;
    notificationId?: string;
  };
  event.notification.close();

  event.waitUntil(
    (async () => {
      const target = url ?? "/app/garage";
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clientsList.find((c) => new URL(c.url).pathname === target);
      if (existing) await existing.focus();
      else await self.clients.openWindow(target);

      if (notificationId) {
        await fetch("/api/push/clicked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId }),
        }).catch(() => {});
      }
    })()
  );
});

self.addEventListener("notificationclose", (event: NotificationEvent) => {
  const { notificationId } = (event.notification.data ?? {}) as { notificationId?: string };
  if (!notificationId) return;

  // Best-effort — browserul poate omite trimiterea dacă tab-ul se închide
  // imediat după dismiss.
  event.waitUntil(
    fetch("/api/push/dismissed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    }).catch(() => {})
  );
});
