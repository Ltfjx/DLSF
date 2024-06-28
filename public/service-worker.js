
const static = "dlsf-static-v1"
const assets = [
    '/',
    '/111672633.jpg',
    '/main.css',
    '/YUYUKO.otf',
    '/main.js',
    '/icon_192.jpg',
    '/icon_512.jpg'
]

self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        caches.open(static).then(cache => {
            cache.addAll(assets)
        })
    )
})

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request)
        })
    )
})