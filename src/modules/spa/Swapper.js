const $ = require('jquery')
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
module.exports = function(el) {
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
