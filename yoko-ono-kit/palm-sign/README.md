# The palm sign: a clickable "choose your way" section (the site's signature element)

`palm-sign.webp`: the real carved wooden palm sign by the bar (1200×1608, aspect 1744/2336), from the owner's footage.
GPT Image 2.5 relit only the two upper leaves so their lettering reads. The owner approved the image, and every letter was checked against the real sign:
- upper left "מסעדה / שירות מלא", lower left "RESTAURANT FULL SERVICE"
- upper right "STREET SUSHI / שירות עצמי", lower right "STREET SUSHI SELF SERVICE"

The sign itself is the navigation:
- Left leaves (restaurant, full service) → Ontopo: https://ontopo.com/he/il/page/14510630
- Right leaves (street sushi, self service) → Wolt: https://wolt.com/he/isr/hasharon/restaurant/yoko-ono

`demo.html` is the tested reference (iPhone 13). Copy its behavior exactly, styled with the site's tokens:
1. Light sweep: the first time the sign is 60% on screen, a warm band of light (screen blend, masked to the four leaves) moves across the engraving once, 2.2 s.
2. Touch response: tap a leaf → that side's leaves glow red and the whole sign leans toward it (rotateY ±7°), then the link opens after 420 ms in the same tab. Hover and keyboard focus show the glow too.
3. Reduced motion: no sweep, no lean, the link opens immediately.
4. Two plain pill buttons under the sign as a fallback. Real <a> links with Hebrew aria-labels.
Hotspots and glow positions are in demo.html (percent of the sign box). Don't change them.
Place it right after the hero, replacing the current "מסעדה / סטריט סושי" block. Headline "בחרו את הדרך שלכם.", line "לחצו על השלט."
