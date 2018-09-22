const $ = require('jquery')
const _ = require('lodash')

module.exports = (Brahin) => {
  const { ui } = Brahin
  const CREATE = 1
  const READ = 2
  const WRITE = 3
  const ADMIN = 4

  $('footer').append(
    $('<a>').attr('href', 'javascript:').text('Share').on('click', handleShare)
  )

  function handleShare(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    const resource = Brahin.currentResource
    if (!resource) throw new Error('No current resource found.')
    if (!resource.admin) throw new Error('You are not authorized to edit sharing settings.')
    invokeShareDialog(resource)
  }

  function invokeShareDialog(resource) {
    const dialog = $('<div style="display: none"></div>')
    dialog.attr('title', 'Sharing')
    dialog.html('Loading data...')

    $('body').append(dialog)

    dialog.dialog({
      autoOpen: false,
      modal: true,
      width: 600,
      height: 400,
      classes: {
        "ui-dialog": "ui-brahin ui-brahin-prompt-dialog",
        "ui-dialog-titlebar": "ui-brahin  ui-brahin-prompt-titlebar",
      }
    })
    dialog.dialog('open')

    loadState(resource).then((state) => {
      addStateToDialog(dialog, state, resource)
    })
  }

  function addStateToDialog(dialog, state, resource) {
    const contents = $('<div>')
      .append($('<p>').text('Share this page and all its subpages via this link:'))

    const container = $('<div class="container">')

    state.forEach((itemState, index) => {
      buildEntry(container, resource,  index, state)
    })

    const addButton = $('<a>').attr('href', 'javascript:').text('Add new rule')
    addButton.on('click', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      addEntry()
    })

    function addEntry() {
      const itemState = { token: generateToken(), level: 2 }
      state.push(itemState)
      buildEntry(container, resource, state.length - 1, state)
    }

    if (!state.length) addEntry();

    contents.append(container)
    contents.append($('<div class="add-button-container" style="margin: 1em 0">').append(addButton))

    const saveButton = $('<input class="ui-button ui-widget ui-corner-all" type="submit" value="Save">')
    saveButton.button()
    saveButton.on('click', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      console.log(state)
      console.log(JSON.stringify(state, null, 2))
      saveState(resource, state).then(() =>
        dialog.dialog('close')
      )
    })

    contents.append(saveButton)

    dialog.html(contents)
  }

  function buildEntry(container, resource, itemIndex, mainState) {
    const entryEl = $('<div class="sharing-entry" style="margin-bottom: 1em; margin-top: 1em;">')

    const groupId = itemIndex
    const itemState = mainState[itemIndex]
    const originalToken = itemState.token || generateToken()

    const linkInput = $('<input style="width: 100%;" readonly="readonly">')
    linkInput.select()
    linkInput.on('focus', () => linkInput.select())
    linkInput.on('dblclick', () => linkInput.select())

    const publicCheckBox = $('<input type="checkbox" id="share-' + groupId + '-public">')
    const levelRadios = []
    levelRadios[1] = $('<input type="radio" name="level" id="share-' + groupId +'-level1" value="1">')
    levelRadios[2] = $('<input type="radio" name="level" id="share-' + groupId +'-level2" value="2">')
    levelRadios[3] = $('<input type="radio" name="level" id="share-' + groupId +'-level3" value="3">')
    levelRadios[4] = $('<input type="radio" name="level" id="share-' + groupId +'-level4" value="4">')

    const removeButton = $('<a>').attr('href', 'javascript:').text('Remove this rule')
    removeButton.on('click', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      delete mainState[itemIndex]
      entryEl.remove()
    })

    const form = $('<form>')
      .append(linkInput)
      .append(publicCheckBox)
      .append($('<label for="share-' + groupId + '-public">').text('public').attr('title', 'Accessible to anyone without a secret token'))
      .append(levelRadios[1])
      .append($('<label for="share-' + groupId + '-level1">').text('add').attr('title', 'Can create new pages under this path'))
      .append(levelRadios[2])
      .append($('<label for="share-' + groupId + '-level2">').text('read').attr('title', 'Can read anything under this path'))
      .append(levelRadios[3])
      .append($('<label for="share-' + groupId + '-level3">').text('edit').attr('title', 'Can edit anything under this path'))
      .append(levelRadios[4])
      .append($('<label for="share-' + groupId + '-level4">').text('own').attr('title', 'Can edit and share edit anything under this path'))
      .append($('<div>')
        .append(removeButton)
      )

    publicCheckBox.on('change', updateState)
    levelRadios[1].on('change', updateState)
    levelRadios[2].on('change', updateState)
    levelRadios[3].on('change', updateState)
    levelRadios[4].on('change', updateState)

    function updateState() {
      itemState.token = publicCheckBox.is(':checked') ? '' : originalToken
      itemState.level = parseInt(form.find('input[name=level]:checked').val())
      console.log('state', itemState)
      updateUi()
    }
    function updateUi() {
      console.log('ui state', itemState)
      const { token, level } = itemState
      const url = resource.url + (token ? ('?access_token=' + token) : '')
      linkInput.val(url)
      publicCheckBox.prop('checked', !token)
      levelRadios[level].prop('checked', true)
    }

    updateUi()
    entryEl.append(form)
    container.append(entryEl)
  }

  function generateToken(n = 40) {
    var a = 'qwertuiopasdfghjkxcvbnmQWERTUPASDFGHJKLXCVBNM123456789'.split('')
    var b = [];
    for (var i = 0; i < n; i++) {
      var j = (Math.random() * (a.length - 1)).toFixed(0)
      b[i] = a[j]
    }
    return b.join('')
  }

  function saveState(resource, state) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: resource.url + '/_sharing.json',
        dataType: 'json',
        method: 'put',
        data: { entries: state },
        success: () => {
          console.log('sharing settings saved successfully');
          resolve();
        },
        error: (err) => {
          console.error('error while saving sharing settings', err);
          Brahin.showError(`Error while saving sharing settings`)
          reject(err);
        },
      })
    })
  }

  function loadState(resource) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: resource.url + '/_sharing.json',
        dataType: 'json',
        method: 'get',
        success: (data) => {
          console.log('received: ', data)
          resolve(data);
        },
        error: (err) => {
          console.error('error while loading sharing settings', err);
          Brahin.showError(`Error while loading sharing settings`)
          reject(err);
        },
      })
    })
  }
}
