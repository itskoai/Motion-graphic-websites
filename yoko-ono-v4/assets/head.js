/* Runs before first paint: decides whether the walk runs or the poster stands still. */
(function () {
  var html = document.documentElement;
  html.classList.add('js');
  var c = navigator.connection || {};
  var slow = c.saveData === true || /(^|[^a-z])2g/.test(String(c.effectiveType || ''));
  var canvas = !!(document.createElement('canvas').getContext && document.createElement('canvas').getContext('2d'));
  if (slow || !canvas) html.classList.add('is-static');
})();
