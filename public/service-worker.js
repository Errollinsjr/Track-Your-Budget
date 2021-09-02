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

//adding our fetch call to the service worker
self.addEventListener("fetch", function(event) {
    //looks for a successful response
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        //if the fetch call gives us a good response we will store the response or cache the response
                        if(response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(error => {
                        //so if there is an error we will try to look to the cache to get our matching response
                        return cache.match(event.request);
                    });
            })
            .catch(error => console.log(error))
        );
        return;
    }
    //use off-line if no api response
    event.respondWith(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            });
        })
    );
});