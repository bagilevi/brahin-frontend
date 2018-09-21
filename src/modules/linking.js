define((require, exports, module) => ((Memonite) => {
  const linking = Memonite.linking = {
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
    if (!Memonite.spa) {
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
    Memonite.spa.hideCurrentResource()
    Memonite.storage.load(location.href)
      .then((resource) => {
        Memonite.spa.showResource(resource)
      })
      .catch(err => {
        console.error('Could not show resource', err)
        Memonite.showError(`Error while loading ${location.href}`)
      })
  }

  function onPopState(stateObj) {
    console.log('popState', stateObj)
    if (!Memonite.spa) {
      console.warn('spa not defined => onPopState reverting to page load')
      location.href = location.href;
      return;
    }
    replaceResourceByCurrentLocation();
  }

  function getLinkPropertiesForInsertion() {
    return new Promise((resolve, reject) => {
      var label;
      Memonite.ui.prompt('Link label or URL:').then((label) => {
        if (!label || label === '') return;

        if (isUrl(label)) {
          resolve({
            href: label
          })
          return;
        }

        const defaultHref = generateDefaultHref(label)

        // const defaultHref = `${Math.random().toString(36).substring(2)}`
        Memonite.ui.prompt('Target URL or href', defaultHref).then((href) => {
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
    if (Memonite.linkBase) {
      return `${Memonite.linkBase}${slug}`
    }
    else {
      return `/${slug}`
    }
  }

  function createResourceNX(href, title) {
    return Memonite.storage.createNX(href, _.assign({}, Memonite.defaultResource, { title: title }))
  }

  function logError(err, reject) {
    console.error(err.error, err.params, err.reason, err.original);
    if (reject) reject(err);
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
