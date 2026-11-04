# Design package · YOKO ONO, Ra'anana · version 3 (3 November 2026)

Consumed verbatim by the build. Copy ships exactly as written here. Band ranges are starting points, validated by the flick test. Version 3 replaces the version 2 package: the owner's new master brief (`PROMPT.md`) sets a quieter palette (charcoal, ivory, champagne), four scenes for the walk, a side gallery with a lightbox, a skip action, and a page of only three content areas after the walk.

## 1. The brand premise

One word: **להיכנס** (to step inside). The owner's vision is a walk from the street into his restaurant, and the site is that walk: the visitor's scroll is the camera. The red gate, the glass doors, the paper-umbrella ceiling, the second dining room at rest. When the walk ends, the room contracts into the shape of the logo's arch and becomes the first image of the page. Everything after it is short, and every section ends on the same door: **הזמינו שולחן**.

Why real footage: the restaurant exists and the owner filmed it himself. Nothing in the walk is generated, nothing is outpainted, no room is invented. The three phone clips are tone-mapped from HLG, stabilized and joined with two half-second dissolves placed inside camera motion.

Said out loud: the palette is deep charcoal, warm ivory and champagne gold with a restrained burgundy, as the brief asks. The restaurant's own red lives in the footage and the photos; the interface stays quiet around it so the restaurant is the only loud thing on the page.

## 2. The palette (CSS tokens)

```css
:root{
  --canvas:#101010;        /* deep charcoal, the page */
  --canvas-2:#151413;      /* a warmer step for alternating surfaces */
  --panel:#1b1917;         /* raised surfaces, the lightbox chrome */
  --ink:#F4EFE7;           /* warm ivory, primary text (17:1 on canvas) */
  --ink-2:#CCC3B5;         /* secondary text (10:1) */
  --ink-3:#938A7D;         /* labels, tertiary (5.1:1) */
  --gold:#C7A46B;          /* champagne: the primary button, kickers, hairlines, focus (7.9:1 on canvas; charcoal on it 7.9:1) */
  --gold-2:#DCC18B;        /* champagne lifted, hover */
  --gold-muted:rgba(199,164,107,.28);
  --burgundy:#5E1B25;      /* restrained burgundy: the hover wash of the ghost button, the lightbox counter dot, never text */
  --line:rgba(244,239,231,.14);
  --scrim:rgba(16,16,16,.72);
}
```

The accent appears in rare doses: the primary button, the kicker glyph, the hairlines that draw themselves, the focus ring. Burgundy only as a wash. Never a section in gold or burgundy.

## 3. The type trio

- **Hebrew display:** Frank Ruhl Libre 300 (the walk's lines, the hero subline), 400 (section headlines), 500 (the settle headline on phones). Classic Hebrew serif, airy at light weights.
- **Latin display:** Cormorant Garamond 600 for the big "YOKO ONO" in the first scene and the footer, 500 tracked 0.22em uppercase for the English kickers (THE FOOD · THE GALLERY · FIND US). The real logo (traced vector, `logo.svg`, coloured by CSS) is the mark in the top bar and the footer; the Cormorant title never replaces it, it accompanies it.
- **Body:** Heebo 300 (ledes), 400 (body), 500 (buttons, labels, hours).

All self-hosted, Hebrew and Latin subsets only, three preloads: Frank Ruhl Libre 300 Hebrew, Heebo 400 Hebrew, Cormorant Garamond 600 Latin.

## 4. The footage and the band map

**The film (9.75 s, 293 frames at 30 fps, portrait 720x1280 and 540x960):**

| Shot | Source | Seconds | What is on screen |
|---|---|---|---|
| 1 | walk1 | 0.0 to 7.9 | the street, the red gate and the YOKO ONO sign, the lanterns, through the glass doors, the first tables under the umbrellas, walking deeper (one take) |
| dissolve | | 7.4 to 7.9 | half a second inside the camera's own motion |
| 2 | walk2 | 2.5 to 3.85 | the sweep across the paper-umbrella ceiling into the red room |
| dissolve | | 8.25 to 8.75 | half a second |
| 3 | room | 0.0 to 1.5 | the second dining room: wooden floor, set tables, the mural, the slow pan comes to rest |

**Progress to time:** p 0 to 0.84 maps linearly to the film; 0.84 to 1 holds the last frame while the arch contracts.

**Desktop stage:** the film is a doorway in the centre of the screen (portrait, full viewport height, a 1 px champagne-tinted hairline, 18 px radius), behind it a canvas paints the current frame blurred and darkened edge to edge so the whole screen walks. Captions live in the two lanes beside the doorway. RTL: the first band is in the right lane.

**Phone stage:** the portrait film fills the screen (cover). Captions sit in the lower third over a bottom scrim.

| Scene | Range (start) | Film | Lane | Copy (verbatim) | Entrance |
|---|---|---|---|---|---|
| top bar | always | | top | logo mark · [הזמינו שולחן] | fades with the page |
| A outside | 0.00 to 0.12 | the gate at night | right (phone: lower third) | **YOKO ONO** (Cormorant) / פיוז׳ן אסייתי בלב רעננה / cue: גללו כדי להיכנס / skip: דלגו על הכניסה | the title breathes in on load; the cue's hairline draws down and loops |
| B entering | 0.12 to 0.40 | through the glass doors | | no words, the architecture only | |
| C inside | 0.40 to 0.68 | the tables under the umbrellas | left (phone: lower third) | **נכנסים בשביל האווירה.** / **נשארים בשביל הטעמים.** | word by word, each word rises 0.6 em and settles, tied to scroll |
| D ceiling and room | 0.68 to 0.84 | the umbrella ceiling, the second room arriving | | no words | |
| settle | 0.84 to 1.00 | the second room at rest, contracting into the arch | right (phone: below the arch) | kicker THE EXPERIENCE / **מסע של טעמים. חוויה שלמה.** / פיוז׳ן אסייתי, סושי, מנות חמות ואווירה מיוחדת. יוקו אונו מחכה לכם בלב רעננה. / [הזמינו שולחן] [התפריט שלנו] | the backdrop fades to charcoal, the doorway scales to 0.74 and slides to the left half while its corners round into the logo's capsule; the headline rises word by word, then the lede, then the buttons |

Hero height: 520vh on desktop, 480vh on phones. The skip action scrolls to the end of the hero (smooth, instant under reduced motion). The cue and the skip fade once p passes 0.03 and 0.80.

## 5. The static-hero copy block

Poster: the first frame, the red gate at night. Shown to reduced-motion visitors, save-data, 2G, short landscape phones, when scripts fail and when the film fails.

- Logo mark, YOKO ONO (Cormorant), פיוז׳ן אסייתי בלב רעננה
- Then the experience block as a normal section: the arch holds the ending frame (the second room), kicker THE EXPERIENCE, **מסע של טעמים. חוויה שלמה.**, the lede above, buttons הזמינו שולחן · התפריט שלנו.

## 6. The below-fold outline (every section funnels to הזמינו שולחן, which goes to Ontopo)

**Nav (fixed, appears once the hero settles on desktop, always on phones as a slim bar):** logo mark, links: התפריט · גלריה · הגעה והזמנה, button הזמינו שולחן.

**A. The experience** is the settle (section 4) and needs no second block.

**B. The food.** Kicker THE FOOD. Headline: **האוכל מדבר בעד עצמו.** Lede: סושי ורולים, מנות חמות, דים סאם וקוקטיילים. התפריט המלא, עם המחירים, במרחק לחיצה. Four photographs in an editorial grid with room to breathe: the sushi on the banana leaf (wide, the anchor), the tuna tataki, the dumplings in the steamer, the smoked cocktail. Labels (categories, only what the photos show): סושי · פיוז׳ן אסייתי · מנות חמות · קוקטיילים. Each photo reveals through a rising mask and carries a quiet parallax; hover lifts it 1.03. Buttons: **התפריט שלנו** (primary here, the menu on Wolt) · הזמינו שולחן (secondary).

**C. The gallery (the side rail).** Desktop: a slim rail stuck to the left edge beside the food section: five miniature previews and a button **כל התמונות** that opens a drawer with all eleven photographs and their captions. Any preview opens the lightbox. Phones: a horizontal strip of the eleven previews under the food grid, scroll-snapped, with the same button. The lightbox: the original photograph (long edge 2000 px) on charcoal, caption, counter, previous and next, close, arrows and Escape, swipe, focus trapped, page scroll locked. Captions (what is seen, not menu names): רולים על עלה בננה · דים סאם באידוי · הברמן מוזג · ניגירי סלמון · המלצר בכניסה · רולים בעטיפת מלפפון · קערת סלמון · טאטאקי טונה · רול סלמון ואיקורה · קוקטייל מעושן · תקרת המטריות. The rail never covers a button or the copy: it lives in the margin, under 1100 px it becomes the strip.

**D. Reserve, visit, order.** Kicker FIND US. Headline: **נתראה ביוקו אונו.** Lede: שולחן, תפריט, משלוח או טלפון. הכול כאן. Action rows (each a full-width link with a champagne hairline that draws on hover): **הזמינו שולחן** (Ontopo) · **התפריט שלנו** · **משלוח ב-Wolt** · **התקשרו 077-938-6192** (tel) · **ניווט ב-Google Maps** (directions). Details beside them: address אחוזה 124, רעננה; hours title שעות פעילות with rows א׳–ה׳ 12:00–23:00 · ו׳ 11:30–14:30 · מוצ״ש 20:30–23:00 and the small line לפי מערכת ההזמנות. בחגים ובמועדים כדאי לוודא בטלפון.; the line כשר למהדרין; email; Instagram and Facebook as small text links. Image: the waiter at the gate, portrait, in the second column on desktop.

**E. Footer.** Logo, YOKO ONO · ASIAN KITCHEN, אחוזה 124, רעננה · 077-938-6192 · yokoono.israel@gmail.com, links: הזמנת שולחן · תפריט · משלוחים · אינסטגרם · פייסבוק · פרטיות · נגישות. Line: © YOKO ONO. הצילומים והסרטון הם של המסעדה.

**Phone sticky bar:** הזמינו שולחן + phone icon, slides up after the hero.

**Form handling:** no form. Reservations go to Ontopo, orders to Wolt, everything else by phone or email. Nothing is collected. The only measurement is a click counter (section 8).

## 7. The vector layer plan

- The logo (`logo.svg`, `currentColor`): the top bar mark at 40 px, the footer at 120 px, the reduced-motion poster at 160 px.
- The capsule arch: the settle's shape, the food grid's hover frame, the lightbox buttons. Drawn with CSS (border-radius), not an image.
- Hairlines that draw themselves: under each section headline (width 0 to 100 percent on entering), under hovered action rows, the cue's vertical line.
- The cue: a 1 px champagne line, 56 px tall, that draws down and fades, looping every 2.4 s.
- Favicon: a champagne capsule with the wordmark's crossbar on charcoal.

Reduced motion: final states shown, every drive stopped, the cue line static.

## 8. The engineering list

Plain HTML, CSS and vanilla JavaScript, one folder, no build step (chosen over React, Tailwind, Motion or GSAP on purpose: fastest first paint, strict Content-Security-Policy with no inline code, deploys to any host, and the scrub engine from version 2 is already proven on desktop and phones).

Blob fetch streamed behind the poster and an honest progress ring, dt-normalized lerp that rests when converged and when the hero is off-screen, gated seeks with the error escape and a seek watchdog, delta-gated DOM writes, band pacing in vh with the flick test, the four-layer legibility system (base scrim, per-band scrim riding `--k`, three-layer text shadow, chips for small text), the five static-hero gates decided before first paint and re-checked live from change listeners, reduced motion honoured both ways mid-session, complete without the video, overflow-x clip on html and body, 44 px touch targets, skip link, landmarks, JSON-LD Restaurant, Open Graph, sitemap, strict CSP (script-src 'self', style-src 'self', connect-src 'self' for the click beacon), `_headers` for Cloudflare and `.htaccess` for Apache carrying the same policy.

The skip action: a button that scrolls the window to the hero's end; keyboard reachable; hidden once the settle is on.

The gallery: the rail and drawer are plain lists of buttons; the lightbox is `role="dialog" aria-modal="true"` with a focus trap, `inert` on the rest of the page while open, Escape and arrows, pointer swipe, and the full-size image lazy-loaded with its neighbours preloaded.

Measurement, privacy first: `navigator.sendBeacon('api/click.php', {e})` on the reserve, menu, delivery, call and directions actions (plus the skip and the gallery open). The endpoint stores an ISO minute and the event name, nothing else: no IP, no user agent, no cookie, no ID. The file lives outside the web root (the `site-leads` convention of `lead.php`), refuses to write on an unpatched PHP, caps each month's file, and answers 204. On a static host without PHP the beacon fails silently and the site is unaffected. The privacy page says exactly this.

The phone decision: phones get the real scrub (the footage is portrait, the phone encode is 540x960), with the static poster hero as the fallback on reduced motion, save-data, 2G, short landscape and any failure.

## 9. The copy gate

Every viewer-facing line above ships verbatim. Before anyone sees the page: zero em dashes, zero stock words, the body-copy sweep for AI tells. The designed devices here (the two-line punch נכנסים בשביל האווירה. נשארים בשביל הטעמים., the brief's headline מסע של טעמים. חוויה שלמה.) are craft and stay.
