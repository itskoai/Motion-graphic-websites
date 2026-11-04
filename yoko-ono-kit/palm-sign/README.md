# The palm sign: a clickable "choose your way" section (the site's signature element)

`palm-sign.webp`: the real carved wooden palm sign by the bar (1152×1600, from the owner's own footage).
Its leaves read "מסעדה / שירות מלא · RESTAURANT FULL SERVICE" (left) and "סטריט סושי / שירות עצמי · STREET SUSHI SELF SERVICE" (right).

The sign itself is the navigation:
- Left leaves (restaurant, full service) → Ontopo booking: https://ontopo.com/he/il/page/14510630
- Right leaves (street sushi, self service) → Wolt: https://wolt.com/he/isr/hasharon/restaurant/yoko-ono

Hotspots, in percent of the image box (aspect-ratio 576/800):
- restaurant: left 2.6%, top 37.5%, width 44.3%, height 30.6%
- street: left 53%, top 38.1%, width 33.9%, height 19.4%

`demo.html` is a tested reference: real <a> links over each leaf, a red glow on hover, focus and tap, a two-time pulse the first time the sign scrolls into view (off under reduced motion), accessible labels, plus two plain pill buttons under the sign as a fallback. In the site these must follow the site's tokens (fonts, red, spacing).
Place it right after the hero, replacing the current "מסעדה / סטריט סושי" two-column block.
