# Japanese evening background (from the first Yoko Ono site, 29 Oct)

Gold paper umbrellas, red lantern light (soft bokeh that flickers like a flame behind paper) and hanging paper lanterns that swing on their cords.
It sits behind every section after the hero, at the page edges and away from the reading column, with gentle depth parallax on scroll.

Files (drop-in, no libraries, no innerHTML, CSP-safe):
- ambient-v7.css → yoko-ono-v4/assets/ambient-v7.css. Link it AFTER the site stylesheet.
- ambient-v7.js → yoko-ono-v4/assets/ambient-v7.js. Script tag AFTER the site script.

What they do:
- The CSS makes .section backgrounds transparent so the layer shows. The experience section keeps its tint as a soft wash, and the closing section keeps its red glow.
- The JS inserts <div class="ambient" aria-hidden="true"> before #choose and lays out 19 elements on desktop and 11 on phones (under 760 px), spread along the full page height.
- Animations pause when the layer is off screen or the tab is hidden. prefers-reduced-motion: everything static.
- The hero walk is untouched: the layer starts at #choose.

Tested on the v4 site at iPhone 13 and 1440×900: zero console errors, content stays fully readable.
