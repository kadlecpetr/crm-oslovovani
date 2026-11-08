/* Jednoduchý service worker: síť má přednost (bez HTTP cache), když není síť, otevře se uložená kopie. Při změně souborů zvyš verzi. */
var CACHE = 'crm-2026-11-08c';
var FILES = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) { return c.add(new Request(f, { cache: 'reload' })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
    if (res.status === 200 && res.type === 'basic') { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r.url, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r.url).then(function (m) { return m || caches.match('index.html'); });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './index.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
