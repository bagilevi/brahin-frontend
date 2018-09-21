console.log('init loaded');

require.config({
  baseUrl: BRAHIN_FRONTEND_URL,
  paths: {
    'jquery': 'https://code.jquery.com/jquery-3.3.1.min',
    'lodash': 'https://cdn.jsdelivr.net/npm/lodash@4.17.10/lodash.min',
    'pouchdb': '//cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min',
  }
})
console.log('BRAHIN_VERSION', BRAHIN_VERSION)

define([`${BRAHIN_FRONTEND_URL}/brahin-core-v${BRAHIN_VERSION}.js`], (coreFn) => {
  coreFn()
})
