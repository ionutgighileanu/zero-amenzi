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
