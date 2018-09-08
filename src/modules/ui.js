console.log('ui module loaded');

define(['jquery', 'https://code.jquery.com/ui/1.12.1/jquery-ui.min.js'], ($, jui) => ((Memonite) => {
  const { loadScript, loadCss, loadPluginCss } = Memonite;
  const ui = Memonite.ui = {
    prompt,
  };
  loadPluginCss('memonite-ui', Memonite.VERSION)

  loadJqueryUi().then(() => {
    // openSampleDialog()
  }).catch(console.error)

  function loadJqueryUi() {
    return Promise.all([
      loadCss('/jquery-ui/jquery-ui.min.css'),
      loadCss('/jquery-ui/jquery-ui.structure.min.css'),
      loadCss('/jquery-ui/jquery-ui.theme.min.css'),
    ])
  }

  function dialog({ title, body} = {}) {
    const dialogEl = $('<div style="display: none"></div>')
    dialogEl.attr('title', title)
    dialogEl.html(body)

    $('body').append(dialogEl)
    dialogEl.dialog({
      autoOpen: false,
      classes: {
        "ui-dialog": "ui-memonite",
        "ui-dialog-titlebar": "ui-memonite",
      }
    })
    dialogEl.dialog('open')
  }

  function openSampleDialog() {
    dialog({
      title: "Hello",
      body: $('<h1>').html("Hello JQuery-UI")
    })
  }

  function prompt(question, defaultValue = null) {
    return new Promise((resolve, reject) => {
      const dialog = $('<div style="display: none"></div>')

      const input = $('<input>').attr('value', defaultValue);
      const button = $('<input class="ui-button ui-widget ui-corner-all" type="submit" value="OK">')
      button.button();
      const form = $('<form>').append(input).append($('<div class="buttons">').append(button));

      form.on('submit', (ev) => {
        ev.preventDefault();
        dialog.dialog('close');
        resolve(input.val());
      });

      dialog.attr('title', question)
      dialog.html(form)

      $('body').append(dialog)
      dialog.dialog({
        autoOpen: false,
        modal: true,
        classes: {
          "ui-dialog": "ui-memonite ui-memonite-prompt-dialog",
          "ui-dialog-titlebar": "ui-memonite  ui-memonite-prompt-titlebar",
        }
      })
      dialog.dialog('open')
      input.select();
    })
  }

}))
