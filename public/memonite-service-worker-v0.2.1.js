importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

const r = '0.2.1-a51'
const development = true

console.log('SW: started; revision', r)
workbox.setConfig({ debug: true });
workbox.core.setLogLevel(workbox.core.LOG_LEVELS.debug);

var strategy
if (development) {
  strategy = workbox.strategies.staleWhileRevalidate
}
else {
  strategy = workbox.strategies.cacheFirst
}

workbox.routing.registerNavigationRoute('/_spa_dummy',
  {
    whitelist: [
      new RegExp('^[a-z0-9\-\/]*$')
    ],

  },
  strategy({ cacheName: 'CN-nav' })
);

workbox.routing.registerRoute(
  /^https?:\/\/[^\/]+\/[a-z0-9\-\/]+\.json$/,
  strategy({ cacheName: 'CN-data', fetchOptions: { credentials: 'include' } })
)

workbox.precaching.precacheAndRoute(
  [
    '/',
    '/_spa_dummy',
    '/require.js',
    '/init.js',
    '/main.css',
    '/fonts/OpenSans-Regular.woff',
    '/fonts/OpenSans-Bold.woff',
    '/jquery/jquery-3.3.1.min.js',
    '/jquery-ui/jquery-ui.min.js',
    '/jquery-ui/jquery-ui.min.css',
    '/jquery-ui/jquery-ui.structure.min.css',
    '/jquery-ui/jquery-ui.theme.min.css',
    '/jquery-ui/images/ui-icons_777777_256x240.png',
    '/jquery-ui/images/ui-icons_444444_256x240.png',
    '/memonite-core-v0.2.1.js',
    '/memonite-ui-v0.2.1.js',
    '/memonite-ui-v0.2.1.css',
    '/memonite-linking-v0.2.1.js',
    '/memonite-spa-v0.2.1.js',
    '/memonite-storage-v0.2.1.js',
    '/memonite-slate-editor-v1.js',
  ]
)

workbox.skipWaiting()
workbox.clientsClaim()
