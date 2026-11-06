/* YOKO ONO: a small members' club button and panel. All the words come from assets/club.json,
   so the owner's rules can be added later without touching code. Empty fields are not shown.
   Also marks the event cards as in view, which starts their animations. No innerHTML. */
(function () {
  'use strict';

  /* events: start the van and the market table when each card enters */
  var cards = document.querySelectorAll('.event-card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .45 });
    Array.prototype.forEach.call(cards, function (c) { io.observe(c); });
  } else { Array.prototype.forEach.call(cards, function (c) { c.classList.add('in'); }); }

  /* club */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'club-btn'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'club-panel');
  var star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  star.setAttribute('viewBox', '0 0 24 24'); star.setAttribute('aria-hidden', 'true');
  var sp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  sp.setAttribute('d', 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z');
  star.appendChild(sp);
  var label = document.createElement('span'); label.textContent = 'מועדון יוקו';
  btn.appendChild(star); btn.appendChild(label);

  var panel = document.createElement('div');
  panel.className = 'club-panel'; panel.id = 'club-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'club-title');
  var close = document.createElement('button'); close.type = 'button'; close.className = 'club-close'; close.setAttribute('aria-label', 'סגירה'); close.textContent = '×';
  var h = document.createElement('h2'); h.id = 'club-title';
  var intro = document.createElement('p'); intro.className = 'club-intro';
  var perks = document.createElement('ul'); perks.className = 'club-perks';
  var terms = document.createElement('ul'); terms.className = 'club-terms';
  var cta = document.createElement('a'); cta.className = 'btn btn-primary btn-sm club-cta';
  [close, h, intro, perks, terms, cta].forEach(function (el) { panel.appendChild(el); });
  document.body.appendChild(panel); document.body.appendChild(btn);

  function fill(list, items) {
    while (list.firstChild) list.removeChild(list.firstChild);
    (items || []).filter(Boolean).forEach(function (t) { var li = document.createElement('li'); li.textContent = String(t); list.appendChild(li); });
    list.hidden = !list.children.length;
  }
  function apply(d) {
    if (d.button) label.textContent = d.button;
    h.textContent = d.title || 'מועדון יוקו';
    intro.textContent = d.intro || ''; intro.hidden = !d.intro;
    fill(perks, d.perks); fill(terms, d.terms);
    var link = String(d.cta_link || '');
    if (d.cta_label && /^(https:|tel:|mailto:)/.test(link)) {
      cta.textContent = d.cta_label; cta.href = link; cta.hidden = false;
      if (/^https:/.test(link)) { cta.target = '_blank'; cta.rel = 'noopener'; }
    } else { cta.hidden = true; }
  }
  apply({ title: 'מועדון החברים של יוקו אונו', intro: 'הפרטים יעלו בקרוב.' });
  fetch('assets/club.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) apply(d); }).catch(function () {});

  function open() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); requestAnimationFrame(function () { panel.classList.add('open'); }); close.focus(); }
  function shut() { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); setTimeout(function () { panel.hidden = true; }, 220); btn.focus(); }
  btn.addEventListener('click', function () { panel.hidden ? open() : shut(); });
  close.addEventListener('click', shut);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) shut(); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) shut(); });

  /* stay clear of the phone booking bar: rise when it shows */
  var bar = document.getElementById('mobile-bar');
  if (bar && 'MutationObserver' in window) {
    new MutationObserver(function () { document.body.classList.toggle('bar-on', bar.classList.contains('is-on')); }).observe(bar, { attributes: true, attributeFilter: ['class'] });
  }
})();
