define((require, exports, module) => ((Brahin) => {
  const linking = Brahin.linking = {
    followLink,
    getLinkPropertiesForInsertion,
  };

  window.onpopstate = onPopState

  function followLink(link, opts = {}) {
    if (opts.ifNewResource) {
      if (isUrl(link.href)) return;
      createResourceNX(link.href, link.label).then((resource) => {
        if (resource) {
          followLink(link, _.omit(opts, 'ifNewResource'))
        }
        return;
      });
      return;
    }
    if (isHrefToDifferentRealm(link.href)) {
      window.open(link.href);
      return;
    }
    if (!Brahin.spa) {
      console.warn('spa not defined => followLink reverting to page load')
      location.href = link.href;
      return;
    }
    const stateObj = { };
    console.log('pushState', stateObj, link.href, link)
    history.pushState(stateObj, '', link.href);
    replaceResourceByCurrentLocation()
  }

  function replaceResourceByCurrentLocation() {
    // Load resource from the backend // TODO: or cache
    Brahin.spa.transition({
      getResource: () => Brahin.storage.load(location.href)
    })
  }

  function onPopState(stateObj) {
    console.log('popState', stateObj)
    if (!Brahin.spa) {
      console.warn('spa not defined => onPopState reverting to page load')
      location.href = location.href;
      return;
    }
    replaceResourceByCurrentLocation();
  }

  function getLinkPropertiesForInsertion() {
    return new Promise((resolve, reject) => {
      var label;
      Brahin.ui.prompt('Link label or URL:').then((label) => {
        if (!label || label === '') return;

        if (isUrl(label)) {
          resolve({
            href: label
          })
          return;
        }

        const defaultHref = generateDefaultHref(label)

        // const defaultHref = `${Math.random().toString(36).substring(2)}`
        Brahin.ui.prompt('Target URL or href', defaultHref).then((href) => {
          resolve({
            label: label,
            href: href,
          })
        })
      })
    })
  }

  function generateDefaultHref(label) {
    const slug = label.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (Brahin.linkBase) {
      return `${Brahin.linkBase}${slug}`
    }
    else {
      return `/${slug}`
    }
  }

  function createResourceNX(href, title) {
    return Brahin.storage.createNX(href, _.assign({}, Brahin.defaultResource, { title: title }))
  }

  // Is the href target handled by the same front-end?
  function isHrefToDifferentRealm(href) {
    return !isUrlSameOrigin(href);
  }

  function isUrl(s) {
    return s.startsWith('http:') || s.startsWith('https:')
  }

  function isUrlSameOrigin(url) {
    const a = document.createElement('a');
    a.href = url;
    if (!window.location.origin) throw new Error('window.location.origin missing');
    if (!a.origin) throw new Error('a.origin missing');
    return a.origin === window.location.origin;
  }
}))
