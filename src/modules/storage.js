// Code related to saving to storage.

const initializeStrategy = require('./storage/initializeStrategy')

module.exports = (Brahin) => {
  const storage = Brahin.storage = {
    load,
    save,
    saveFile,
    createNX,
    createEditorChangeReceiver,
  };

  const { loadPluginScript } = Brahin
  var strategies = {}

  function getStrategy(key) {
    var strategyProps = strategies[key]
    if (!strategyProps) {
      strategyProps = strategies[key] = {
        promise: initializeStrategy(key, Brahin)
      }
    }
    if (strategyProps.strategy) {
      return Promise.resolve(strategyProps.strategy)
    } else {
      return strategyProps.promise
    }
  }

  const unsavedChanges = new Set();

  function load(url) {
    return new Promise((resolve, reject) => {
      const locator = new Locator(url)
      getStrategy(locator.strategyKey).then((strategy) => {
        return strategy.load(locator)
      })
      .then(resource => {
        decorateResourceWithLocator(resource, locator)
        resolve(resource)
      })
      .catch(err => {
        // Auto-create resource when navigating to a non-existet path
        if (err.error === 'not_found') {
          const resource = _.assign({}, Brahin.defaultResource)
          decorateResourceWithLocator(resource, locator)
          resolve(resource)
        }
        else {
          reject(err)
        }
      })
    })
  }

  function save(resource, updatedAttributes) {
    const locator = new Locator(resource.url)
    return getStrategy(locator.strategyKey).then((strategy) => {
      resource.id = locator.id
      return strategy.save(resource, updatedAttributes)
    })
  }

  function saveFile(file) {
    const locator = new Locator(Brahin.currentResource.url)
    return getStrategy(locator.strategyKey).then((strategy) => {
      if (strategy.saveFile) {
        return strategy.saveFile(file)
      }
      else {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.addEventListener('load', () => {
            const dataURL = reader.result
            resolve({ url: dataURL })
          })
          reader.readAsDataURL(file)
        })
      }
    })
  }

  function createNX(url, newAttributes) {
    const locator = new Locator(url)
    return getStrategy(locator.strategyKey).then((strategy) => {
      const resource = _.assign({}, newAttributes)
      decorateResourceWithLocator(resource, locator)
      return strategy.create(resource)
    })
  }

  // Returns a function that can be passed to the editor, to be called whenever
  // a change is made by the user.
  //
  // When a user makes a change, the editor will call the `handleChange` function
  // (the return value of `createEditorChangeReceiver`), passing to it a function
  // that can be used to query the new body. It is a function because generating
  // the HTML for every keystroke can be expensive, so we do that after debouncing.
  //
  // `handleChange` will pass it to the debouncer, which ensures that changes
  // made in quick succession are recorded only after a short pause or at specific
  // intervals if there's no pause.
  //
  // After debouncing, `recordChange` is called, which gets the new body,
  // checks if it's any different from the previous value,
  // if so, saves the resource.
  //
  function createEditorChangeReceiver(resource) {
    const recordChange = (getUpdatedBody) => {
      const newBody = getUpdatedBody();
      if (newBody != resource.body) {
        console.log('change', newBody)
        const newTitle = $('<div>').html(newBody).find('h1').first().text(); // FIXME
        resource.body = newBody;
        if (newTitle) resource.title = newTitle;
        document.title = resource.title; // TODO: if this resource is current
        return save(resource, resource)
      }
      return Promise.resolve();
    }
    const debouncedChange = debounceChange(recordChange, 1000, 2000)
    const handleChange = (getUpdatedBody) => {
      debouncedChange(getUpdatedBody);
    }
    return handleChange;
  }

  // Debounce, but save within certain intervals, even if still editing.
  function debounceChange(func, wait, interval) {
    var timeout;           // Timout for delaying the latest change.
    var intervalBeginTime; // Time we started measuring the latest interval.
    var resetTimeout;      // Timeout for clearing the intervalBeginTime.
    var localUnsavedChanges = new Set();

    function callOriginal(context, args) {
      const changes = Array.from(localUnsavedChanges.values());
      console.log('saving...', changes)
      func.apply(context, args).then((ret) => {
        for (var change of changes) {
          localUnsavedChanges.delete(change);
          unsavedChanges.delete(change);
          updateOnUnloadEventHandler();
        }
        console.log('saved.', ret, changes)
      });
    }

    return function() {
      const changeId = generateChangeId()
      unsavedChanges.add(changeId);
      localUnsavedChanges.add(changeId);
      updateOnUnloadEventHandler();

      cancelReset();

      var currentTime = Date.now();
      var context = this, args = arguments;

      if (intervalBeginTime && currentTime - intervalBeginTime >= interval) {
        if (timeout) { clearTimeout(timeout); timeout = null; }
        callOriginal(context, args)
        intervalBeginTime = currentTime;

        // End the interval if no changes received within <wait> milliseconds.
        // If we don't do this, the next change will immediately trigger the original function.
        scheduleReset();
        return;
      }

      // Start an interval if not yet started.
      if (!intervalBeginTime) intervalBeginTime = currentTime;

      // Called when there's no new change for <wait> milliseconds.
      var later = function() {
        timeout = null;
        reset();
        callOriginal(context, args)
      };
      console.log('debouncing save...')
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };

    function cancelReset() {
      if (resetTimeout) { clearTimeout(resetTimeout); resetTimeout = null; }
    }

    function scheduleReset() {
      if (resetTimeout) clearTimeout(resetTimeout);
      resetTimeout = setTimeout(reset, wait)
    }

    function reset() {
      if (resetTimeout) { clearTimeout(resetTimeout); resetTimeout = null; }
      intervalBeginTime = null;
    }
  }; // end of debounceChange

  var lastChangeId = 0;
  function generateChangeId() {
    return ++lastChangeId;
  }

  function updateOnUnloadEventHandler() {
    if (unsavedChanges.size === 0) {
      window.onbeforeunload = null;
    } else if (!window.onbeforeunload) {
      window.onbeforeunload = function() {
        return 'There are unsaved changes, which might be lost if you close the window, reload or navigate away. Do you wish to continue anyway?'
      };
    }
  }

  function Locator(url) {
    if (url.startsWith('/')) url = location.origin + url
    var [, protocol, realm, path] = url.match(/^([^:]+:)\/\/([^\/]+)(.*)$/)
    var database, id

    const localMatch = path.match(/^\/_local(\/.*)?$/)
    if (localMatch) {
      database = 'main'
      id = path
      url = `${protocol}//${realm}${path}`
    }

    this.id = id
    this.path = path
    this.url = url
    this.strategyKey = localMatch ? `local:${database}` : `backend:${realm}`
  }

  function decorateResourceWithLocator(resource, locator) {
    if (!resource.id) resource.id = locator.id
    if (!resource.url) resource.url = locator.url
    if (!resource.path) resource.path = locator.path
    return resource
  }

  return storage
}
