console.log('init loaded');

require.config({
  baseUrl: MEMONITE_PLUGIN_PATH,
  paths: {
    'jquery': 'https://code.jquery.com/jquery-3.3.1.min',
    'lodash': 'https://cdn.jsdelivr.net/npm/lodash@4.17.10/lodash.min',
    'pouchdb': '//cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min',
  }
})
console.log('MEMONITE_VERSION', MEMONITE_VERSION)

define([`${MEMONITE_PLUGIN_PATH}/memonite-core-v${MEMONITE_VERSION}.js`], (coreFn) => {
  coreFn()
})
