// SPA as in Single-Page-Application
//
// This module here makes sure that we don't need to load a new page and initialize
// a new editor, when we navigate to a new resource.
//
// It keeps the initialized editors in the DOM and hides them when we navigate away,
// and shows them again when navigate back.

define((require, exports, module) => ((Brahin) => {
  const { initResourceDisplay } = Brahin;
  const swapper = new Swapper();
  const spa = Brahin.spa = {
    transition,
    showResource,
    hideCurrentResource,
  };

  init();

  function init() {
    const el = $('.brahin-resource').first()
    if (el.length) {
      swapper.set(location.href, el)
    }
  }

  // Transition from showing the current resource to showing a different one,
  // e.g. when following a link.
  //
  // - options.getResource returning a promise of resource
  function transition(options = {}) {
    const { getResource } = options
    if (!getResource) throw new Error('getResource missing in spa.transition')

    hideCurrentResource()

    getResource()
      .then(showResource)
      .catch(showResourceLoadingError)
  }

  function showResourceLoadingError(err) {
    console.error('Could not show resource', err)
    if (err.error) {
      swapper.showError(err.error)
      return
    }
    else {
      Brahin.showError(`Error while loading ${location.href}`)
    }
  }

  function hideCurrentResource() {
    Brahin.dispatch('currentResourceChange', { resource: null })
    swapper.hide()
  }

  function showResource(resource) {
    Brahin.dispatch('currentResourceChange', { resource: resource })

    swapper.show(resource.url, (el) => {
      // Callback to initialize the DOM element if wasn't in the cache
      el.html(resource.body)
      document.title = resource.title || 'Brahin'; // FIXME
      initResourceDisplay(resource, el)
    })
  }

  /*
    DOM structure:

      div#page
        div.brahin-resource
        div.brahin-resource-hidden style="display: hidden"
        div.brahin-resource-hidden style="display: hidden"

    When page cannot be shown:

      div#page-error You are not authorized to see this page
      div#page{ display: hidden }
        ...

  */
  function Swapper(el) {
    const cache = {}

    this.set = (key, el) => {
      cache[key] = el;
    }

    this.show = (key, initialize) => {
      const pageEl = $('#page')
      this.hide()

      var el = cache[key]
      if (el) {
        console.log('resource element found in cache')
        document.title = el.find('h1').first().text() || 'Brahin'; // FIXME
        el.addClass('brahin-resource').removeClass('brahin-resource-hidden').show()
        pageEl.show()
      }
      else {
        console.log('resource element not in cache')
        el = $('<div class="brahin-resource">')
        pageEl.append(el)
        pageEl.show()
        cache[key] = el
        initialize(el)
      }
    }

    this.hide = () => {
      $('#page').hide()
      $('#page-error').remove()
      $('.brahin-resource').hide().removeClass('brahin-resource').addClass('brahin-resource-hidden')
    }

    this.showError = (message) => {
      $('<div id="page-error">').text(message).insertBefore($('#page'))
    }
  }
}))
