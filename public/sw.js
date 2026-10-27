// fallow-ignore-file unused-file
// Served at /sw.js and registered at runtime by src/components/blueprint/Driver.tsx.
/*
 * Offline support for the drawing set. `/` is one page, so offline means: the last good copy of `/` plus the
 * hashed build files it needs. Navigations go to the network first (fresh copy wins), build files come from the
 * cache first (their names change with their content), everything else is served from the cache while a fresh
 * copy is fetched.
 */
// Eidos' worker (the owner's library: background sync and replay of queued writes, e.g. the contact form) runs in
// this same worker, so one registration serves both. Copied from node_modules by `npm run eidos-sw` (pre-build).
importScripts('/eidos-sw.js');

const VERSION = 'v2';
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
                    if (res.ok && url.pathname === '/') {
                        const copy = res.clone();
                        caches.open(PAGES).then((c) => c.put('/', copy));
                    }
                    return res;
                })
                .catch(() => caches.match('/', { cacheName: PAGES }).then((r) => r || Response.error()))
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
