// Code related to saving to storage.
console.log('storage module loaded');

define((require, exports, module) => ((Memonite) => {
  const storage = Memonite.storage = {
    createEditorChangeReceiver,
  };

  const unsavedChanges = new Set();

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
        return saveResource(resource, resource)
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

  function saveResource(resource, updatedAttributes) {
    return new Promise((resolve, reject) => {
      const data = _.assign({ authenticity_token: authenticityToken }, updatedAttributes)

      $.ajax({
        url: resource.path,
        method: 'patch',
        data: data,
        success: () => {
          console.log('saved successfully');
          resolve();
        },
        error: (err) => {
          console.error('error while saving', err);
          reject(err);
        },
      })
    })
  }

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
}))
