/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * Offline support for vocab review only.
 *
 * - The built app (JS/CSS) plus fonts, icons and the manifest are precached.
 *   The rest of /static (hundreds of MB of audio, games, video) is not.
 * - /review and its data are network-first: every good response is kept, and
 *   the kept copy is served when there's no connection. The review page then
 *   reads the learner's words from IndexedDB (src/lib/srs/offline-store.ts).
 * - Other pages are left to the network, with a small offline page if it fails.
 * - Logging out clears the kept pages and the on-device review data.
 */
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const ASSET_CACHE = `assets-${version}`;
const PAGE_CACHE = 'review-pages';
// Same name as OFFLINE_DB_NAME in src/lib/srs/offline-store.ts.
const OFFLINE_DB = 'pa-review';

const PRECACHE_STATIC = /^\/(fonts|icons)\/|^\/(manifest\.json|favicon\.(png|ico|svg))$/;
const ASSETS = [...build, ...files.filter((f) => PRECACHE_STATIC.test(f))];
const ASSET_SET = new Set(ASSETS);

// Pages kept for offline use, by pathname.
const OFFLINE_PAGES = new Set(['/review', '/review/__data.json']);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(ASSET_CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				// Kept pages point at this deploy's JS files, so they go when the assets do;
				// the next online visit to /review stores a fresh copy.
				if (key !== ASSET_CACHE) await caches.delete(key);
			}
			await sw.clients.claim();
		})()
	);
});

async function clearLearnerData() {
	await caches.delete(PAGE_CACHE);
	await new Promise<void>((resolve) => {
		const req = indexedDB.deleteDatabase(OFFLINE_DB);
		req.onsuccess = req.onerror = req.onblocked = () => resolve();
	});
}

function offlinePage() {
	return new Response(
		`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're offline · Parallel Arabic</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#d3dde3;color:#0d2733;text-align:center;padding:1.5rem}
a{display:inline-block;margin-top:1.25rem;padding:.8rem 1.3rem;border-radius:.9rem;background:#22c55e;color:#fff;font-weight:600;text-decoration:none}
@media (prefers-color-scheme:dark){body{background:#17191a;color:#c9d0d4}}</style></head>
<body><main><h1>You're offline</h1><p>This page needs a connection. Your vocab review works offline.</p><a href="/review">Go to Review</a></main></body></html>`,
		{ status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	if (request.method === 'POST' && url.pathname === '/auth/logout') {
		// Let the logout go through; drop this learner's offline copy alongside it.
		event.waitUntil(clearLearnerData());
		return;
	}
	if (request.method !== 'GET') return;

	if (ASSET_SET.has(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((hit) => hit ?? fetch(request)));
		return;
	}

	if (OFFLINE_PAGES.has(url.pathname)) {
		event.respondWith(
			(async () => {
				try {
					const response = await fetch(request);
					// Only a real page for a signed-in learner (not a redirect to /login or an error).
					if (response.ok && !response.redirected && response.type === 'basic') {
						const copy = response.clone();
						event.waitUntil(caches.open(PAGE_CACHE).then((cache) => cache.put(url.pathname, copy)));
					}
					return response;
				} catch (error) {
					const kept = await caches.open(PAGE_CACHE).then((cache) => cache.match(url.pathname));
					if (kept) return kept;
					if (request.mode === 'navigate') return offlinePage();
					throw error;
				}
			})()
		);
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(fetch(request).catch(() => offlinePage()));
	}
});
