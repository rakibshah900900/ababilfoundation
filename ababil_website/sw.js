// Service Worker - Network Only (No Cache)
// এটি ক্যাশ জ্যাম বা ERR_FAILED এরর চিরতরে দূর করবে।

const CACHE_NAME = 'ababil-admin-nocache-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

// পুরনো সকল ক্যাশ মুছে ফেলা
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          return caches.delete(cache); 
        })
      );
    }).then(() => self.clients.claim())
  );
});

// সরাসরি ইন্টারনেট থেকে নতুন ফাইল লোড করা
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(err => {
      // ইন্টারনেট না থাকলে স্বাভাবিকভাবে লোড ফেইল হবে, কিন্তু ক্র্যাশ করবে না
      console.log("Network error: ", err);
    })
  );
});
