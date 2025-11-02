const CACHE_NAME = 'quran-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/surahs-data.json',
  '/reciters-data.json',
  '/quran-data.sqlite',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png'
];

// Import Capacitor plugins if available
let isCapacitor = false;
if (typeof Capacitor !== 'undefined') {
  isCapacitor = true;
}

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  // في بيئة Capacitor، قد لا نحتاج إلى التخزين المؤقت
  if (isCapacitor) {
    console.log('Running in Capacitor environment, skipping cache');
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('فتح الذاكرة المؤقتة');
      return cache.addAll(urlsToCache);
    })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  // في بيئة Capacitor، قد لا نحتاج إلى تفعيل SW
  if (isCapacitor) {
    console.log('Running in Capacitor environment, skipping activation');
    return;
  }
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف الذاكرة المؤقتة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// استرجاع البيانات من الذاكرة المؤقتة
self.addEventListener('fetch', (event) => {
  // في بيئة Capacitor، نترك الطلبات كما هي
  if (isCapacitor) {
    return;
  }
  
  // تجاهل الطلبات التي لا تبدأ بـ http
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // إرجاع النسخة المحفوظة إذا كانت موجودة
      if (response) {
        return response;
      }

      // محاولة جلب البيانات من الشبكة
      return fetch(event.request).then((response) => {
        // التحقق من صحة الاستجابة
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // حفظ نسخة من الاستجابة في الذاكرة المؤقتة
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // في حالة فشل الشبكة، نعيد الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// معالجة رسائل من التطبيق الرئيسي
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});