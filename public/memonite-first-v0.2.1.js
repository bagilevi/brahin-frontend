(function() {

  function Editor(el, onChange) {
    el.attr('contenteditable', 'true')

    el.on('input', () => {
      onChange(() => el.html())
    })
  }

  const editor = Memonite.editors['first-v0.0.1'] = {
    init: (el, onChange) => {
      const editor = new Editor(el, onChange);
    }
  }

})()
