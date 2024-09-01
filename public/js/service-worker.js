
const static = "dlsf-static-v1"
const assets = [
    "/",
    "/111672633.jpg",
    "/main.css",
    "/YUYUKO.otf",
    "/main.js",
    "/icon_192.jpg",
    "/icon_512.jpg",
    "https://cdn.staticfile.net/mdui/2.1.1/mdui.global.js",
    "https://cdn.staticfile.net/mdui/2.1.1/mdui.css",
    "https://cdn.staticfile.net/axios/1.6.5/axios.min.js",
    "https://cdn.staticfile.net/particles.js/2.0.0/particles.min.js",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "https://fonts.googleapis.com/icon?family=Material+Icons+Outlined",
    "https://fonts.googleapis.com/icon?family=Material+Icons+Two+Tone",
    "https://fonts.googleapis.com/icon?family=Material+Icons+Round",
    "https://fonts.googleapis.com/icon?family=Material+Icons+Sharp"
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