importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

const r = '0.2.1-a44'
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
  new RegExp('.*\.js'),
  strategy({ cacheName: 'CN-app' })
)
workbox.routing.registerRoute(
  /.*\/assets\/.*/,
  strategy({ cacheName: 'CN-assets' })
)

workbox.precaching.precacheAndRoute(
  [
    { revision: r, url: '/' },
    { revision: r, url: '/_spa_dummy' },
    { revision: r, url: '/require.js' },
    { revision: r, url: '/init.js' },
    { revision: r, url: '/main.css' },
    { revision: r, url: '/fonts/OpenSans-Regular.woff' },
    { revision: r, url: '/fonts/OpenSans-Bold.woff' },
    { revision: r, url: '/jquery/jquery-3.3.1.min.js' },
    { revision: r, url: '/jquery-ui/jquery-ui.min.js' },
    { revision: r, url: '/jquery-ui/jquery-ui.min.css' },
    { revision: r, url: '/jquery-ui/jquery-ui.structure.min.css' },
    { revision: r, url: '/jquery-ui/jquery-ui.theme.min.css' },
    { revision: r, url: '/memonite-core-v0.2.1.js' },
    { revision: r, url: '/memonite-ui-v0.2.1.js' },
    { revision: r, url: '/memonite-ui-v0.2.1.css' },
    { revision: r, url: '/memonite-linking-v0.2.1.js' },
    { revision: r, url: '/memonite-spa-v0.2.1.js' },
    { revision: r, url: '/memonite-storage-v0.2.1.js' },
    { revision: r, url: '/memonite-slate-editor-v1.js' },
  ]
)
