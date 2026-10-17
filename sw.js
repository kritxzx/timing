// ชื่อแคชสำหรับเก็บไฟล์เพื่อให้ใช้งานแบบออฟไลน์ได้ (v2: Obsidian Luxury iOS UI)
const CACHE_NAME = 'timing-pwa-v2';

// รายการไฟล์หลักที่ต้องแคชไว้ตั้งแต่ติดตั้งแอป (ใช้ relative path เพื่อรองรับ GitHub Pages)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png'
];

// เหตุการณ์ Install: แคชไฟล์หลักทั้งหมดลงในเครื่อง
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// เหตุการณ์ Activate: ลบแคชเวอร์ชันเก่าออกเมื่อมีการอัปเดต Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// เหตุการณ์ Fetch: ดึงข้อมูลจากแคชก่อน (Cache-First) หากไม่มีให้ดึงจากเน็ตและเก็บลงแคช
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' ||
              event.request.url.includes('fonts.googleapis.com') ||
              event.request.url.includes('fonts.gstatic.com'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
