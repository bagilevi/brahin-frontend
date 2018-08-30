console.log('core module loaded');

define(['jquery'], ($) => {
  const Memonite = window.Memonite = {
    VERSION: '0.2.1',
    editors: [],
    loadScript,
    loadCss,
    loadPluginScript,
    loadPluginCss,
    initResourceEditor,
    define,
    require,
  }

  const { display } = Memonite;

  window.onerror = function(message, url, lineNumber) {
    var container = $('#error-container').first();
    if (container.length === 0) container = $('<div id="error-container">').appendTo($('body'))
    const msgEl = $('<div class="error-flash">').append($('<p>').text(message));
    container.append(msgEl);
    msgEl.fadeOut({ duration: 10000 }, () => msgEl.remove());
    msgEl.on('click', () => msgEl.remove())
  }

  $(document).ready(() => {
    Promise.all([
      loadPluginScript('memonite-ui',      Memonite.VERSION),
      loadPluginScript('memonite-linking', Memonite.VERSION),
      loadPluginScript('memonite-spa',     Memonite.VERSION),
      loadPluginScript('memonite-storage', Memonite.VERSION),
    ]).then(() => {
      console.log('core scripts loaded')
      initResourceEditorFromDocument()
    }).catch((err) => {
      console.error('Could not load all modules, editor cannot be initialized.', err)
    })
  })

  // Find the main resource on the page and load its editor
  function initResourceEditorFromDocument() {
    const el = $('.m-resource').first()
    const resource = {
      id: el.data('m-id'),
      url: window.location.href,
      path: window.location.pathname,
      editor: el.data('m-editor'),
      editor_url: el.data('m-editor-url'),
      body: el.html(),
    }
    initResourceEditor(resource, el)
  }

  function initResourceEditor(resource, el) {
    const scriptUrl = getEditorUrl(resource)
    require([scriptUrl], (editorLoader) => {
      console.log('editorLoader', editorLoader)
      const editor = editorLoader(Memonite)
      if (!editor) {
        throw new Error(`Script loaded from "${resource.editor_url}" expected to define editor "${resource.editor}"`)
      }
      const changeReceiver = Memonite.storage.createEditorChangeReceiver(resource);
      editor.init(el, changeReceiver);
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
      require([`/plugin?name=${name}-v${version}&type=js`], (result) => {
        console.log('loadPluginScript', name, '=> ', result)
        result(Memonite);
        resolve();
      })
    })
  }

  function loadPluginCss(name, version) {
    return loadCss(`/plugin?name=${name}-v${version}&type=css`)
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
    return `/plugin?name=${editor}&url=${editor_url}&type=js`
  }

})
