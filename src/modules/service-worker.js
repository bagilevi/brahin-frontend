importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

const r = '{{VERSION}}'
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

workbox.precaching.precache(
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
    '/memonite-core-{{VERSION}}.js',
    '/memonite-ui-{{VERSION}}.js',
    '/memonite-ui-{{VERSION}}.css',
    '/memonite-linking-{{VERSION}}.js',
    '/memonite-spa-{{VERSION}}.js',
    '/memonite-storage-{{VERSION}}.js',
    '/memonite-slate-editor-v1.js',
  ]
)

workbox.routing.registerRoute(
  /^https?:\/\/[^\/]+\/$/,
  strategy({ cacheName: 'CN-root' })
)

workbox.routing.registerRoute(
  /^https?:\/\/[^\/]+\/_spa_dummy$/,
  strategy({ cacheName: 'CN-dummy' })
)

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

workbox.routing.registerRoute(
  /\.(js|css|woff|png)$/,
  strategy({ cacheName: 'CN-code' })
)

workbox.skipWaiting()
workbox.clientsClaim()
