/* Runs before first paint. Decides how the hero behaves and marks that scripts work.
   The same decision runs again in site.js whenever a screen rotates, a window resizes or a
   motion preference flips, so CSS never has to guess: it reads the data attributes set here.
   Without JavaScript the page stays in its default state: the still gate photo with the words on it. */
(function () {
  var d = document.documentElement;
  d.className += ' js';
  function mm(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  function decide() {
    var reduce = mm('(prefers-reduced-motion: reduce)');
    var save = !!(navigator.connection && navigator.connection.saveData);
    var slow = !!(navigator.connection && /(^|-)2g$/.test(navigator.connection.effectiveType || ''));
    var shortLandscape = mm('(orientation: landscape) and (pointer: coarse) and (max-height: 560px)');
    var phone = mm('(max-width: 820px)') || mm('(orientation: portrait) and (pointer: coarse)');
    var hero = (reduce || save || slow || shortLandscape) ? 'static' : 'scrub';
    var stage = phone ? 'full' : 'door';
    if (d.getAttribute('data-hero') !== hero) d.setAttribute('data-hero', hero);
    if (d.getAttribute('data-stage') !== stage) d.setAttribute('data-stage', stage);
    d.setAttribute('data-reduce', reduce ? '1' : '0');
    return { hero: hero, stage: stage, reduce: reduce };
  }
  window.yokoDecide = decide;
  decide();
})();
