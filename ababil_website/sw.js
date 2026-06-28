const CACHE_NAME = 'ababil-admin-v2'; // পরবর্তীতে কোডে বড় পরিবর্তন আনলে এখানে v2 পরিবর্তন করে v3 লিখে দেবেন
const urlsToCache = [
  'admin.html',
  'css/style.css',
  'js/admin_app.js',
  'logo.png'
];

// ইনস্টলেশন এবং ফাইল ক্যাশ করা
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// নতুন কোড আপডেট করা হলে পুরনো ক্যাশ মুছে ফেলার ইভেন্ট
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// রিকোয়েস্ট হ্যান্ডলিং
self.addEventListener('fetch', event => {
  // Supabase API, EmailJS বা অন্য কোনো বাহ্যিক API রিকোয়েস্ট ক্যাশ থেকে বাদ দেওয়া হলো
  if (event.request.url.includes('supabase.co') || event.request.url.includes('emailjs') || event.request.url.includes('api')) {
    return; // সরাসরি নেটওয়ার্ক থেকে নতুন ডেটা আনবে
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ক্যাশে ফাইলটি থাকলে ক্যাশ থেকে দেবে, অন্যথায় নেটওয়ার্ক থেকে লোড করবে
        return response || fetch(event.request);
      })
  );
});

// রিকোয়েস্ট হ্যান্ডলিং
self.addEventListener('fetch', event => {
  // Supabase API, EmailJS বা অন্য কোনো বাহ্যিক API রিকোয়েস্ট ক্যাশ থেকে বাদ দেওয়া হলো
  if (event.request.url.includes('supabase.co') || event.request.url.includes('emailjs') || event.request.url.includes('api')) {
    return; // সরাসরি নেটওয়ার্ক থেকে নতুন ডেটা আনবে
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ক্যাশে ফাইলটি থাকলে ক্যাশ থেকে দেবে, অন্যথায় নেটওয়ার্ক থেকে লোড করবে
        // নেটওয়ার্ক ফেইল হলে যাতে ERR_FAILED ক্র্যাশ না করে, সেজন্য .catch যোগ করা হয়েছে
        return response || fetch(event.request).catch(err => {
          console.log("Network fetch failed: ", err);
        });
      })
  );
});
