importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

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
  fetch(url).then((response)=>{
      if(response.status === 200){
        return response.json().then(function(json) {
          // process your JSON further
          var dbPromise = self.indexedDB.open("taller1_db", 1);
          dbPromise.onerror = function(event) {
            // Do something with request.errorCode!
            console.log("error");
          };

          dbPromise.onupgradeneeded = function(event) { 
            // Save the IDBDatabase interface 
            var db = event.target.result;
            if (!db.objectStoreNames.contains('metros')) {
              // Create an objectStore for this database
              db.createObjectStore("metros", {keyPath: 'url'});
            }
          };

          dbPromise.onsuccess = function(event){
            var db = event.target.result;
            var tx = db.transaction(['metros'], 'readwrite');
            var store = tx.objectStore('metros');
            var data = json;
            data['url'] = url;
            store.add(data);
            tx.complete
          }
          return json.result
        });
      }
  });
});

const {strategies} = workbox;

self.addEventListener('fetch', (evt) => {
  
  if (evt.request.url.includes('/schedules/')) {
    console.log('[Service Worker] Fetch (data) from url /schedules/', evt.request.url);
      evt.respondWith(
        fetch(evt.request).then((response)=>{
          if(response.status === 200){
            var data2 = response.clone();
            data2.json().then(function(json) {
              // process your JSON further
              var dbPromise = self.indexedDB.open("taller1_db", 1);
              dbPromise.onerror = function(event) {
                // Do something with request.errorCode!
                console.log("error");
              };

              dbPromise.onupgradeneeded = function(event) { 
                // Save the IDBDatabase interface 
                var db = event.target.result;
                if (!db.objectStoreNames.contains('metros')) {
                  // Create an objectStore for this database
                  db.createObjectStore("metros", {keyPath: 'url'});
                }
              };
              
              dbPromise.onsuccess = function(event){
                var db = event.target.result;
                var tx = db.transaction(['metros'], 'readwrite');
                var store = tx.objectStore('metros');
                var data = json;
                data['url'] = evt.request.url;
                store.add(data);
                tx.complete
              }
            });
            return response;
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