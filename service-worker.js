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

function createDB() {
  idb.open('products', 1, function(upgradeDB) {
    var store = upgradeDB.createObjectStore('beverages', {
      keyPath: 'id'
    });
    store.put({id: 123, name: 'coke', price: 10.99, quantity: 200});
    store.put({id: 321, name: 'pepsi', price: 8.99, quantity: 100});
    store.put({id: 222, name: 'water', price: 11.99, quantity: 300});
  });
}

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
  createDB()
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

    const cacheFirst = new strategies.CacheFirst({cacheName: DATA_CACHE_NAME});
    cacheFirst.handle({request: evt.request});
    evt.respondWith(cacheFirst.handle({request: evt.request}));
    
    
  }
  else{
    //console.log('[Service Worker] Fetch (static-data)', evt.request.url);
    const cacheFirst = new strategies.CacheFirst({cacheName: CACHE_NAME});
    cacheFirst.handle({request: evt.request})
    evt.respondWith(cacheFirst.handle({request: evt.request}));
  }
});