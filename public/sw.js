// fallow-ignore-file unused-file
// Served at /sw.js and registered at runtime by src/components/blueprint/Driver.tsx.
/*
 * Offline support for previously visited pages plus the hashed build files they need.
 * Navigations go to the network first (fresh copy wins), build files come from the
 * cache first (their names change with their content), everything else is served from the cache while a fresh
 * copy is fetched.
 */
// Eidos' worker (the owner's library: background sync and replay of queued writes, e.g. the contact form) runs in
// this same worker, so one registration serves both. Copied from node_modules by `npm run eidos-sw` (pre-build).
importScripts('/eidos-sw.js');

const VERSION = 'v3';
const PAGES = `pages-${VERSION}`;
const BUILD = `build-${VERSION}`;
const OTHER = `other-${VERSION}`;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(PAGES)
            .then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon-192x192.png']))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const keep = [PAGES, BUILD, OTHER];
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    // Eidos manages its own caches (prefix "eidos"); leave them alone.
                    keys
                        .filter((k) => !keep.includes(k) && !k.startsWith('eidos'))
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);
    if (req.method !== 'GET' || url.origin !== self.location.origin) return;
    // The API is live data (inbox, presence): never cached here.
    if (url.pathname.startsWith('/api/')) return;
    // React Server Component payloads and dev/HMR traffic are never cached.
    if (req.headers.get('RSC') || url.pathname.startsWith('/_next/webpack-hmr')) return;

    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok && res.headers.get('Content-Type')?.includes('text/html')) {
                        const copy = res.clone();
                        event.waitUntil(caches.open(PAGES).then((c) => c.put(req, copy)));
                    }
                    return res;
                })
                .catch(() =>
                    caches.match(req, { cacheName: PAGES }).then(
                        (hit) =>
                            hit ||
                            new Response(
                                '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Page unavailable offline</title><style>body{font:18px/1.6 system-ui,sans-serif;max-width:36rem;margin:15vh auto;padding:1.5rem}a,button{display:inline-block;padding:.75rem}</style><main><h1>This page is not saved offline</h1><p>Reconnect to load this page. Previously visited pages may still be available.</p><p><a href="">Try again</a> <a href="/">Portfolio home</a></p></main></html>',
                                {
                                    status: 503,
                                    headers: {
                                        'Content-Type': 'text/html; charset=utf-8',
                                        'Cache-Control': 'no-store',
                                    },
                                }
                            )
                    )
                )
        );
        return;
    }

    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.open(BUILD).then((c) =>
                c.match(req).then(
                    (hit) =>
                        hit ||
                        fetch(req).then((res) => {
                            if (res.ok) c.put(req, res.clone());
                            return res;
                        })
                )
            )
        );
        return;
    }

    event.respondWith(
        caches.open(OTHER).then((c) =>
            c.match(req).then((hit) => {
                const fresh = fetch(req)
                    .then((res) => {
                        if (res.ok) c.put(req, res.clone());
                        return res;
                    })
                    .catch(() => hit || Response.error());
                return hit || fresh;
            })
        )
    );
});
