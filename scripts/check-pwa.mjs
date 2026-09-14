import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const manifest = JSON.parse(
  readFileSync(resolve('public', 'manifest.webmanifest'), 'utf8'),
)
const serviceWorker = readFileSync(resolve('public', 'sw.js'), 'utf8')
const index = readFileSync(resolve('index.html'), 'utf8')

assert.equal(manifest.name, 'lastlink')
assert.equal(manifest.short_name, 'lastlink')
assert.equal(manifest.start_url, '/')
assert.equal(manifest.scope, '/')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.theme_color, '#ffffff')
assert.deepEqual(
  manifest.icons.map(({ src, sizes, type, purpose }) => ({ src, sizes, type, purpose })),
  [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
)

for (const [filename, signature] of [
  ['icon-192.png', Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  ['icon-512.png', Buffer.from([0x89, 0x50, 0x4e, 0x47])],
]) {
  const icon = readFileSync(resolve('public', filename))
  assert.deepEqual(icon.subarray(0, signature.length), signature)
}

assert.match(index, /<link rel="manifest" href="\/manifest\.webmanifest"\s*\/>/)
assert.match(index, /<link rel="apple-touch-icon" href="\/icon-192\.png"\s*\/>/)
assert.match(serviceWorker, /const CACHE_NAME = 'lastlink-shell-v2'/)
assert.match(serviceWorker, /\/icon-192\.png/)
assert.match(serviceWorker, /\/icon-512\.png/)
assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api'\)/)
assert.match(serviceWorker, /url\.pathname === '\/icon-192\.png'/)
assert.match(serviceWorker, /url\.pathname === '\/icon-512\.png'/)
assert.match(serviceWorker, /cacheAppShell\(cache\)/)
assert.match(serviceWorker, /cache\.match\('\/index\.html'\)/)
assert.ok(serviceWorker.includes('html.matchAll'), 'the worker must discover built asset URLs')
assert.ok(serviceWorker.includes('/assets/'), 'the worker must target built assets only')
assert.ok(
  serviceWorker.includes('cache.addAll([...new Set(assets)])'),
  'the worker must precache discovered assets',
)
assert.match(serviceWorker, /self\.skipWaiting\(\)/)
assert.match(serviceWorker, /self\.clients\.claim\(\)/)

console.log('PWA manifest, icon and service-worker checks passed')
