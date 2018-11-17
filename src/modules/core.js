const $ = require('jquery')
const EventDispatcher = require('./core/EventDispatcher')
const urlUtils = require('./core/urlUtils')

module.exports = () => {
  const Brahin = window.Brahin = {
    VERSION: '{{VERSION}}',
    editors: [],
    loadScript,
    loadCss,
    loadPluginScript,
    loadPluginCss,
    initResourceDisplay,
    define,
    require,
    showError,
    logError,
    urlUtils,
  }
  window.Memonite = Brahin // backward-compatibility

  const { display } = Brahin;
  var startupTimePrinted = false

  const eventDispatch = new EventDispatcher()
  const { dispatch, on } = eventDispatch
  Brahin.dispatch = dispatch
  Brahin.on = on

  Brahin.defaultResource = {
    body: '<h1></h1><p></p>',
    editor: 'brahin-slate-editor',
  }

  on('currentResourceChange', (event) => Brahin.currentResource = event.resource)

  window.onerror = function(message, url, lineNumber) {
    showError(message)
  }

  function showError(message) {
    var container = $('#error-container').first();
    if (container.length === 0) container = $('<div id="error-container">').appendTo($('body'))
    const msgEl = $('<div class="error-flash">').append($('<p>').text(message));
    container.append(msgEl);
    msgEl.fadeOut({ duration: 10000 }, () => msgEl.remove());
    msgEl.on('click', () => msgEl.remove())
  }

  function logError(err, reject) {
    console.error(err.error, err.params, err.reason, err.original);
    if (reject) reject(err);
  }

  $(document).ready(() => {
    window.authenticityToken = $('meta[name=csrf-token]').attr('content')
    // initServiceWorker()
    Promise.all([
      loadPluginScript('brahin-ui',      Brahin.VERSION),
      loadPluginScript('brahin-linking', Brahin.VERSION),
      loadPluginScript('brahin-spa',     Brahin.VERSION),
      loadPluginScript('brahin-storage', Brahin.VERSION),
    ]).then(() => {
      console.log('core scripts loaded')
      initResourceEditorFromDocument()
      loadPluginScript('brahin-permissions', Brahin.VERSION)
    }).catch((err) => {
      console.error('Could not load all modules, editor cannot be initialized.', err)
    })
  })

  // Find the main resource on the page and load its editor
  function initResourceEditorFromDocument() {
    console.log('initResourceEditorFromDocument')
    const el = $('.brahin-resource').first()
    if (el.length) {
      const resource = el.data('attributes') || {}
      resource.id = el.data('m-id')
      resource.url = window.location.href.replace(/[\?#].*$/, '')
      resource.path = window.location.pathname
      // resource.editor = el.data('m-editor')
      // resource.editor_url = el.data('m-editor-url')
      resource.body = el.html()
      dispatch('currentResourceChange', { resource: resource })
      initResourceDisplay(resource, el)
    }
    else {
      // In case the document is the _spa_dummy, i.e. it doesn't contain content
      initResourceEditorFromLocation()
    }
  }

  function initResourceEditorFromLocation() {
    console.log('initResourceEditorFromLocation')
    Brahin.storage.load(location.href)
      .then(resource => {
        console.log('resource loaded', resource)
        Brahin.spa.transition({
          getResource: () => Promise.resolve(resource)
        })
      })
      .catch(err => {
        console.error('Cannot initialize editor because could not get resource from storage', err)
      })
  }

  function initResourceDisplay(resource, el) {
    if (isResourceEditable(resource)) {
      initResourceEditor(resource, el)
    }
    else {
      initResourceReader(resource, el)
    }
  }

  function initResourceReader(resource, el) {
    el.find('a').on('click', event => {
      event.preventDefault()
      const el = $(event.target)
      console.log('link', el.attr('href'))
      Brahin.linking.followLink({ href: el.attr('href') })
    })
  }

  function initResourceEditor(resource, el) {
    const scriptUrl = getEditorUrl(resource)
    require([scriptUrl], (editorLoader) => {
      if (!editorLoader) {
        throw new Error(`Script loaded from "${scriptUrl}" did not return anything`)
      }
      const editor = editorLoader(Brahin)
      if (!editor) {
        throw new Error(`Script loaded from "${scriptUrl}" expected to define editor "${resource.editor}"`)
      }
      const changeReceiver = Brahin.storage.createEditorChangeReceiver(resource);
      editor.init(el, changeReceiver);
      if (BRAHIN_START_TIME && !startupTimePrinted) {
        console.log('Editor loaded in', performance.now() - BRAHIN_START_TIME, 'ms')
        startupTimePrinted = true
      }
    })
  }

  var scripts = {}

  function loadScript(url) {
    if (!url) throw new Error('blank url given to loadScript')
    var s = scripts[url];
    if (s) return Promise.resolve();
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        dataType: 'script',
        success: () => {
          scripts[url] = true;
          resolve();
        },
        error: (jqXHR, textStatus, errorThrown) => {
          console.error(`loadScript(${url})`, '$.ajax failed', textStatus, errorThrown)
          reject(errorThrown)
        },
        async: true
      });
    })
  }

  function loadCss(url) {
    return new Promise((resolve, reject) => {
      const linkEl = $('<link>').attr('rel', 'stylesheet').attr('href', url).attr('type', 'text/css')
      linkEl.get(0).onload = resolve
      $('head').append(linkEl)
    })
  }

  function loadPluginScript(name, version) {
    return new Promise((resolve, reject) => {
      const url = buildPluginUrl(name, version, 'js')
      require([url], (result) => {
        console.log('loadPluginScript', name, '=> ', result)
        const innerResult = result(Brahin);
        resolve(innerResult);
      })
    })
  }

  function buildPluginUrl(name, version, type) {
    const ver = version ? `-v${version}` : ''
    const ext = type ? `.${type}` : ''
    return `${BRAHIN_FRONTEND_URL}/${name}${ver}${ext}`
  }

  function loadPluginCss(name, version) {
    return loadCss(buildPluginUrl(name, version, 'css'))
  }

  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  function getEditorUrl(resource) {
    const { editor, editor_url } = resource
    if (!editor) throw new Error('resource does not have "editor" property')
    return buildPluginUrl(editor, null, 'js')
    // return `/plugin?name=${editor}&url=${editor_url}&type=js`
  }

  function isResourceEditable(resource) {
    if (resource.permissions && resource.permissions.write) return true
    if (resource.path && resource.path.match(/^\/_local(\/.*)?$/)) return true
    return false
  }
}
