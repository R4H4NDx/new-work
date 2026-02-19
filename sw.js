const CACHE_NAME = 'exam-app-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// نصبکردن - هەموو فایلەکان کاش بکە
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                ASSETS.map(url => cache.add(url).catch(() => {}))
            );
        })
    );
    self.skipWaiting();
});

// چالاکبوون - کاشی کۆنەکان پاک بکەرەوە
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// هەر داواکاری - یەکەم کاشەکە چەک بکە، دواتر ئینتەرنێت
self.addEventListener('fetch', e => {
    // Supabase API calls - هەمیشە ئۆنلاین
    if (e.request.url.includes('supabase.co')) {
        e.respondWith(
            fetch(e.request).catch(() => {
                return new Response(JSON.stringify({ error: 'ئینتەرنێت نییە' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // فایلەکانی ئەپ - کاش یەکەم
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(resp => {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return resp;
            }).catch(() => caches.match('./index.html'));
        })
    );
});