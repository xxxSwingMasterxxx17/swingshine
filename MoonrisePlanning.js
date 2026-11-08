(function () {
  'use strict';

  var planning = document.querySelector('[data-planning]');
  var buttons = document.querySelectorAll('[data-level-filter]');
  if (!planning || !buttons.length) return;

  // The chosen level is kept in the URL (#niveau-2) so it can be shared.
  function select(level) {
    if (level) {
      planning.setAttribute('data-level-active', level);
    } else {
      planning.removeAttribute('data-level-active');
    }
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-level-filter') === level));
    });
    if (window.history.replaceState) {
      var url = window.location.pathname + window.location.search + (level ? '#niveau-' + level : '');
      window.history.replaceState(null, '', url);
    }
  }

  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener('click', function () {
      var level = button.getAttribute('data-level-filter');
      select(planning.getAttribute('data-level-active') === level ? null : level);
    });
  });

  var fromUrl = /^#niveau-([123])$/.exec(window.location.hash);
  if (fromUrl) select(fromUrl[1]);
}());
