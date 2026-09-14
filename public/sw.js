const CACHE_NAME = 'lastlink-shell-v2'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cacheAppShell(cache))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    !isAppShellRequest(request, url)
  ) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response.ok) return response
        const copy = response.clone()
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/'))),
  )
})

function isAppShellRequest(request, url) {
  return (
    (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/icon-192.png' ||
    url.pathname === '/icon-512.png' ||
    url.pathname.startsWith('/assets/')
  )
}

async function cacheAppShell(cache) {
  await cache.addAll(APP_SHELL)
  const index = await cache.match('/index.html')
  if (!index) throw new Error('The application shell could not be cached')

  const html = await index.text()
  const assets = [
    ...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
  ].map((match) => match[1])

  if (assets.length === 0) throw new Error('No built application assets found')
  await cache.addAll([...new Set(assets)])
}
