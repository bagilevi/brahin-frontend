// SPA as in Single-Page-Application
//
// This module here makes sure that we don't need to load a new page and initialize
// a new editor, when we navigate to a new resource.
//
// It keeps the initialized editors in the DOM and hides them when we navigate away,
// and shows them again when navigate back.

const Swapper = require('./spa/Swapper')

module.exports = (Brahin) => {
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

    // Avoid flicker - don't hide if the resource is loaded quickly
    const timer = setTimeout(hideCurrentResource, 500)

    getResource()
      .then(resource => {
        clearTimeout(timer)
        showResource(resource)
      })
      .catch(err => {
        clearTimeout(timer)
        hideCurrentResource()
        showResourceLoadingError(err)
      })
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
}
