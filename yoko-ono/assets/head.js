/* Runs before first paint: marks that scripts work and decides the hero mode. site.js re-checks the same queries live. */
(function () {
  var d = document.documentElement;
  d.className += ' js';
  var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mm('(prefers-reduced-motion: reduce)');
  var save = !!(navigator.connection && navigator.connection.saveData);
  d.setAttribute('data-motion', reduce || save ? 'static' : 'full');
})();
