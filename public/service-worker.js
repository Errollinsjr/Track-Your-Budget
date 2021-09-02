const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/db.js",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

//add event handler
self.addEventListener("install", function(event) {
    //cached transaction data
    event.waitUntil(
        caches.open(DATA_CACHE_NAME)
        .then((cache) => 
        cache.add("/api/transaction"))
    );
    
    //prestored things in cache ready to load
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => 
        cache.addAll(FILES_TO_CACHE))
    );

    //tells serviceworker to kick off immediately after everything loads
    self.skipWaiting();
});

//activate service-worker
self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys()
        .then(keyList => {
            // return all async promises and map through keyList to delete any old cache data via key
            return Promise.all(
                keyList.map(key => {
                    if(key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Deleted old cache'd data", key);
                        return caches.delete(key);
                    };
                })
            );
        })
    );
    self.clients.claim();
});