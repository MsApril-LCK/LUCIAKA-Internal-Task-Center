/* Service worker — เก็บเฉพาะไฟล์หน้าแอปไว้เปิดเร็ว (ไม่เก็บข้อมูลงาน)
 * ดึงไฟล์ใหม่จากเซิร์ฟเวอร์ก่อนเสมอ ใช้ไฟล์ที่เก็บไว้เมื่อไม่มีอินเทอร์เน็ตเท่านั้น */
const CACHE = 'itc-shell-2026-10-12-1';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'logo.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;   // ข้อมูลงาน/ล็อกอินไม่ผ่านแคช
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
