/* Service worker — เก็บเฉพาะไฟล์หน้าแอปไว้เปิดเร็ว (ไม่เก็บข้อมูลงาน)
 * ดึงไฟล์ใหม่จากเซิร์ฟเวอร์ก่อนเสมอ ใช้ไฟล์ที่เก็บไว้เมื่อไม่มีอินเทอร์เน็ตเท่านั้น */
const CACHE = 'itc-shell-2026-10-17-6';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'logo.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;   // ข้อมูลงาน/ล็อกอินไม่ผ่านแคช
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {   // ถามเซิร์ฟเวอร์ทุกครั้งว่ามีไฟล์ใหม่ไหม (ไม่ใช้แคชของเบราว์เซอร์ 10 นาที)
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
// แจ้งเตือนจากเซิร์ฟเวอร์ (Firebase) — มาแม้ปิดแอปอยู่ · แสดงทุกครั้ง (iPhone บังคับ) · อัปเดตตัวเลขบนไอคอน
self.addEventListener('push', e => {
  let d = {};
  try { const j = e.data ? e.data.json() : {}; d = j.data || j.notification || j; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  const n = parseInt(d.badge, 10);
  const jobs = [
    self.registration.showNotification(d.title || 'LUCIAKA Task Center', {
      body: d.body || 'มีงานอัปเดตใหม่', tag: d.tag || 'itc-push', renotify: true,
      icon: 'icons/icon-192.png', badge: 'icons/favicon-48.png', data: { url: './' }
    }),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => list.forEach(c => c.postMessage({ type: 'itc-push' })))
  ];
  if (!isNaN(n) && self.navigator && 'setAppBadge' in self.navigator) jobs.push((n > 0 ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge()).catch(() => {}));
  e.waitUntil(Promise.all(jobs));
});
// กดการแจ้งเตือน → เปิดแอป (ถ้าเปิดค้างอยู่ให้สลับไปหน้าแอป)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
