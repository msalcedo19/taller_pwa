importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

/*workbox.routing.registerRoute(
   ({request}) => request.destination === 'script',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-files',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      })
    ]
  })
);*/

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // CODELAB: Remove previous cached data from disk.
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
  
  const url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/metros/1/bastille/A';
  caches.open(DATA_CACHE_NAME).then((cache) => {
    fetch(url).then((response)=>{
      if(response.status === 200){
        cache.put(url, response.clone());
      }
    });
  });
});

const {strategies} = workbox;

self.addEventListener('fetch', (evt) => {
  /*if (event.request.url.endsWith('.css')) {
    console.log("entree22");
    // Using the previously-initialized strategies will work as expected.
    const cacheFirst = new strategies.CacheFirst({cacheName: 'static-files'});
    cacheFirst.handle({request: event.request}).then(data=> console.log(data.body));
    event.respondWith(cacheFirst.handle({request: event.request}));
  }*/
  
  if (evt.request.url.includes('/schedules/')) {
    //console.log('[Service Worker] Fetch (data) from url /schedules/', evt.request.url);
      evt.respondWith(
        fetch(evt.request).then((response)=>{
          if(response.status === 200){
            var dbPromise = self.indexedDB.open("taller1_db", 1);
            var clone1 = response;
            response.json().then(function(json) {
              // process your JSON further
            console.log(json.result);
            });
            dbPromise.onerror = function(event) {
              // Do something with request.errorCode!
              console.log("error");
            };

            dbPromise.onupgradeneeded = function(event) { 
              // Save the IDBDatabase interface 
              var db = event.target.result;
              if (!db.objectStoreNames.contains('metros')) {
                console.log("entre en updgtesa");
                // Create an objectStore for this database
                db.createObjectStore("metros", {autoIncrement: true});
              }
            };
            console.log("por aqui");
            dbPromise.onsuccess = function(event){
              console.log("entre");
              var db = event.target.result;
              var tx = db.transaction(['metros'], 'readwrite');
              var store = tx.objectStore('metros');
              store.add(clone1);
              tx.complete
              return response;
            }
          }
        })
      );
  }
  else{
    //console.log('[Service Worker] Fetch (static-data)', evt.request.url);
    const cacheFirst = new strategies.CacheFirst({cacheName: CACHE_NAME});
    cacheFirst.handle({request: evt.request})
    evt.respondWith(cacheFirst.handle({request: evt.request}));
  }
});