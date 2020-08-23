importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

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
    console.log('[Service Worker] Fetch (data) from url /schedules/', evt.request.url);

    const cacheFirst = new strategies.CacheFirst({cacheName: 'data-cache'});
    cacheFirst.handle({request: evt.request});
    evt.respondWith(cacheFirst.handle({request: evt.request}));
  }
  else{
    console.log('[Service Worker] Fetch (static-data)', evt.request.url);
    const cacheFirst = new strategies.CacheFirst({cacheName: 'static-files'});
    cacheFirst.handle({request: evt.request})
    evt.respondWith(cacheFirst.handle({request: evt.request}));
  }
});