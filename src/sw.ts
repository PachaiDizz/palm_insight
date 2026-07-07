import { Serwist, CacheFirst, NetworkFirst, ExpirationPlugin } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: unknown[];
  }
}

const serwist = new Serwist({
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: new NetworkFirst({
        cacheName: "supabase-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },
    {
      matcher: /\/_next\/static\/.*/i,
      handler: new CacheFirst({
        cacheName: "next-static",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    {
      matcher: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: new CacheFirst({
        cacheName: "images-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();

// @ts-ignore — injected at build time by @serwist/next
self.__SW_MANIFEST = [];
