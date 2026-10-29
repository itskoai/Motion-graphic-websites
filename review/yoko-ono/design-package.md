# YOKO ONO · design package (written before any generation)

Site folder: `yoko-ono/` (one `index.html` plus `assets/`). Working material lives in `review/yoko-ono/` and never ships.
Hosting for the preview: the Higgsfield website host at `yoko-ono-raanana.<host>`; the folder is also Hostinger-ready.

## 0. What was verified, what was not

Verified from sources the owner supplied or that are public:
- Name YOKO ONO / יוקו אונו, Asian fusion (Japanese and Chinese-inspired), 124 Ahuza St, Ra'anana, phone 077-938-6192, email yokoono.israel@gmail.com.
- Instagram @yoko_ono_fusion, Facebook page id 61561688363551, reservation page on Ontopo (14510630), Wolt page `hasharon/restaurant/yoko-ono`, menu site yoko-ono-menu.com (owner-supplied, not reachable from this session).
- The restaurant describes itself as kosher mehadrin (Instagram bio). Listed by the Ra'anana religious council and under Badatz Beit Yosef in search results; the exact certificate is for the owner to confirm.
- Hours as published on the restaurant's own booking page (Ontopo, via search): Sun–Thu 12:00–23:00, Fri 11:30–14:30, Sat 19:00–23:00. Rest.co.il agrees on Sun–Thu. Wolt and Tripadvisor differ on Friday and Saturday. Shown on the page with a "per the booking system, confirm on holidays" caption and flagged for the owner.

Not available, so not on the page:
- Customer reviews: no quotable text exists on any public platform (Google is unreachable here; Tripadvisor has one review; Rest has one negative review; Facebook's 7 reviews are not quotable). The reviews block is omitted rather than invented. The Instagram feed strip stands in as real social proof.
- Prices, dish names, awards, chef biography, history, event capacities. None appear.

Disclosure: the opening video is an AI-made atmosphere piece inspired by the restaurant's plating; every photograph on the page is the restaurant's own (owner-supplied, enhanced in resolution). The footer says so.

## 1. The brand premise

One real idea from the restaurant's world: **the red lantern at the gate**. The real entrance on Ahuza is a red torii-style gate with paper lanterns; inside, a ceiling of paper umbrellas; on Instagram, black and warm gold. So the site is one evening under that lantern: ink-dark lacquer, lantern red for every action, gold only for whispers. Hebrew spine: **מאחורי השער האדום** (behind the red gate). The hero is the table under the lantern; each section lights the next lantern; the location section brings you back to the gate on Ahuza 124.

Signature element: **the lantern**. A hand-drawn SVG paper lantern that marks every section (it lights up as the section enters), hangs in the hero's parallax mid-layer as soft red bokeh orbs, glows on the "today" row of the hours, and is the thing the visitor presses and holds in the atmosphere section to light the room. Remove it and the page loses its thread.

Design-direction note: the dark canvas with a warm accent and a serif is the owner's own brand world (black and gold Instagram identity, red lacquer gate), so the carve-out applies. What keeps it from the stock look: lantern red carries the actions, not amber; the serif is a Japanese Mincho's Latin for the wordmark plus Frank Ruhl Libre for Hebrew; the canvas is tinted toward the footage's red-black; and the lantern system replaces template cards.

## 2. Palette as CSS tokens (direction now, exact values re-sampled from the approved footage)

```css
:root{
  --canvas:#120f0e;        /* warm ink, never pure black */
  --canvas-2:#1a1412;      /* raised sections */
  --panel:#231917;         /* lacquer cards */
  --ink:#0a0807;           /* deepest shadows, nav when scrolled */
  --ivory:#f3ece1;         /* primary text, 16:1 on canvas */
  --ivory-2:#cdbfae;       /* secondary text, 9:1 */
  --gold:#c9a86a;          /* champagne gold: labels, rules, lantern cords */
  --gold-2:#8a7247;        /* muted gold hairlines */
  --lantern:#e04a36;       /* lantern light: glows, marks, the lit state */
  --lantern-fill:#b83524;  /* CTA fills (ivory text on it ≈ 5:1) */
  --lantern-hover:#cf3d2a;
  --lantern-glow:rgba(224,74,54,.38);
  --burgundy:#571f29;      /* deep accent plates */
}
```

## 3. Type trio

- Latin display (wordmark, English kickers, numbers): **Shippori Mincho B1** 500 and 700 (a Japanese Mincho's roman, so the Japanese heritage is in the letterforms, not a cliché serif). Final pick after the type test; Zen Old Mincho is the alternate.
- Hebrew display (every headline): **Frank Ruhl Libre** variable, 300 for the big editorial lines, 400 for section heads, 500 for small heads.
- Body: **Assistant** variable, 300 and 400 body, 600 for buttons and labels.
- Mono for times and the phone: **IBM Plex Mono** 400 (file already in the repo).
All self-hosted woff2, Hebrew and Latin subsets, preloaded: one Hebrew display file, one body file.

## 4. The hero system (autoplay loop plus layered parallax)

The owner asked for an autoplay, muted, seamlessly looping cinematic hero with a poster, plus transform-based parallax at two or three depths. So the hero is a loop, not a scroll scrub, and the parallax is the scroll response.

Footage: one continuous shot, locked composition, loop closed by using the same frame as start and end.
- Desktop (16:9, 10 s): the sashimi platter on crushed ice on a speckled blue-rimmed ceramic plate (the restaurant's own plating), set on dark lacquer, left of center; a soy dish and chopsticks on the rim; red paper-lantern bokeh far back; a thin curl of cold vapor off the ice; the right half of the frame is the same lacquer table receding into warm darkness with a faint lantern reflection, so the RTL text block has calm footage behind it.
- Phone (9:16, 8 s): the same table, platter centered in the upper 55 percent of frame, the lower third calm lacquer for the text and buttons.
- Motion: the camera breathes a few centimeters sideways and eases back; vapor curls; lantern bokeh flickers softly; glints shift on the fish; the soy surface trembles. Plate, chopsticks and glass never move. No hands, no people, no text.

Layers (scroll parallax, transform only):
- L0 video, depth 0.18 (moves slowest; feels far).
- L1 lantern bokeh orbs and three paper-umbrella silhouettes drawn in SVG, depth 0.42, drifting at whisper level.
- L2 text block, depth 0.6, fading out over the first 60 percent of the hero's scroll.
- Base scrim: radial darkening plus a bottom gradient; on phones a stronger bottom gradient.
Reduced motion: no video request, poster only, no parallax, text block static. Save-data: same. Video error: poster stays, page complete.

Hero copy (verbatim):
- Kicker chips: `מסעדת פיוז׳ן אסייתית` · `רעננה` · `כשר למהדרין`
- Wordmark: `YOKO ONO`
- H1: `מסע של טעמים. חוויה שלמה.`
- Lede: `פיוז׳ן אסייתי, מנות מוקפדות ואווירה שעושה חשק להישאר. מחכים לכם בלב רעננה.`
- Primary CTA: `הזמינו שולחן` → Ontopo. Secondary CTA: `לצפייה בתפריט` → the menu site.
- Scroll cue label: `גללו`

## 5. The below-fold outline (RTL, no two neighbors share a skeleton)

Nav (fixed, transparent over the hero, ink when scrolled): emblem + `YOKO ONO`; links `החוויה` `הגלריה` `התפריט` `האווירה` `משלוחים` `אירועים` `איפה אנחנו`; phone chip `077-938-6192` (tap to call); button `הזמינו שולחן`. Phone menu: full-screen panel, big links, phone, both CTAs, Instagram and Facebook.

### החוויה (#experience) — asymmetric editorial two-column
- Kicker: `THE EXPERIENCE`
- H2: `יותר מארוחה. חוויה אסייתית.`
- Body: `ביוקו אונו נפגשים טעמים מהמטבח היפני והאסייתי, מנות צבעוניות ואווירה מיוחדת. בין סושי מוקפד למנות חמות וקוקטיילים, כל ביקור הוא הזדמנות ליהנות ממשהו אחר.`
- Three lantern-bulleted lines: `סושי ורולים מוקפדים` / `מנות חמות מהמטבח האסייתי` / `קוקטיילים ואווירת ערב`
- Image: the soy-drizzle nigiri (portrait), gold hairline frame offset behind it, depth 0.25.
- Floating chip on the image: `כשר למהדרין`

### הגלריה (#gallery) — bento grid, 10 real photos, category labels only (no dish names)
- Kicker: `ON THE TABLE`
- H2: `מה שמחכה על השולחן`
- Intro line: `מנות מהמטבח של יוקו אונו, כפי שהן מוגשות.`
- Labels: `סושי ורולים` (avocado-tuna, roll-bowl, salmon-rolls, roll-leaf) · `דגים טריים` (sashimi-ice, salmon-fillet, salmon-bowl) · `מנות חמות` (dumplings, tuna-tataki) · `קוקטיילים` (smoke-cocktail)
- Hover: slow 1.06 zoom, label slides up; tiles enter staggered.

### התפריט (#menu) — wide photo strip with a floating lacquer card
- Kicker: `THE MENU`
- H2: `הטעמים שמחכים לכם`
- Body: `סושי ורולים, דגים טריים, מנות חמות וקוקטיילים. התפריט המלא, עם כל המנות, מחכה באתר התפריט של המסעדה.`
- Button: `לצפייה בתפריט המלא` → yoko-ono-menu.com
- Small print: `התפריט והמחירים מתעדכנים באתר התפריט.`
- Four chapter labels in a vertical Japanese-style rail: `סושי ורולים` `דגים טריים` `מנות חמות` `קוקטיילים`

### האווירה (#atmosphere) — the interactive moment: press and hold the lantern
- Kicker: `THE ROOM`
- H2: `רגע לפני המנה הראשונה.`
- Instruction chip: `לחצו והחזיקו על הפנס`
- Hold completes → the umbrella-ceiling photo brightens from dim to lit, the lantern glows, and the line reveals: `האור נדלק. הערב מתחיל.`
- Body after reveal: `מתחת לתקרת המטריות, בין הבר למטבח הפתוח, הערב מתחיל לאט: קוקטייל, מנה ראשונה, ועוד אחת שלא תכננתם.`
- Film strip (horizontal parallax): bartender, waiter, smoke cocktail, entrance. Captions: `הבר` `השירות` `הקוקטיילים` `השער`
- Reduced motion: lit state shown, no hold needed. Keyboard: Enter or Space holds.

### Instagram strip (inside the atmosphere section's end) — real social proof
- Line: `עקבו אחרי @yoko_ono_fusion` with three real tiles → Instagram

### משלוחים (#delivery) — split band, photo right, copy left over a lantern-bokeh plate (generated world plate, abstract)
- Kicker: `DELIVERY & TAKEAWAY`
- H2: `יוקו אונו, גם אצלכם בבית.`
- Body: `בא לכם ליהנות מהטעמים שלנו בבית? היכנסו לאפשרויות ההזמנה ובחרו את המנות שמתחשק לכם.`
- Button: `להזמנת משלוח` → Wolt
- Micro line: `ההזמנה דרך Wolt`
- Image: salmon bowl, depth 0.3.

### אירועים (#events) — centered, gold hairline frame, ink background, no claims
- Kicker: `PRIVATE EVENTS`
- H2: `רגעים מיוחדים, באווירה אחרת.`
- Body: `ערב משפחתי, יום הולדת או ארוחה של צוות? ספרו לנו מה אתם מתכננים ונחזור אליכם עם הפרטים.`
- Button: `לפרטים על אירועים` → mailto with subject `פנייה בנושא אירוע ביוקו אונו`
- Secondary: `או התקשרו: 077-938-6192` (tap to call)

### איפה אנחנו (#location) — the gate card: address, hours, buttons
- Kicker: `FIND US`
- H2: `נתראה ביוקו אונו`
- Address: `אחוזה 124, רעננה`
- Phone: `077-938-6192`
- Buttons: `ניווט ב-Google Maps` (directions link) · `ניווט ב-Waze` · `הזמינו שולחן`
- Hours block (today's row lit by the lantern):
  - `א׳–ה׳` `12:00–23:00`
  - `ו׳` `11:30–14:30`
  - `מוצ״ש` `19:00–23:00`
  - Caption: `לפי מערכת ההזמנות של המסעדה. בחגים ובמועדים מיוחדים מומלץ לוודא בטלפון.`
- Image: the entrance gate at night (portrait), depth 0.22.

### Footer
- Emblem, `YOKO ONO · ASIAN KITCHEN`, `אחוזה 124, רעננה`, phone, email.
- Links: `תפריט` `הזמנת שולחן` `משלוחים` `אינסטגרם` `פייסבוק`
- `<details>` פרטיות: `האתר הזה לא אוסף מידע אישי: אין בו טפסים, עוגיות מעקב או כלי מדידה. לחיצה על קישור להזמנה, לתפריט או למשלוח מעבירה אתכם לאתר חיצוני שפועל לפי מדיניות הפרטיות שלו.`
- `<details>` נגישות: `האתר נבנה עם מבנה סמנטי, ניווט במקלדת, ניגודיות גבוהה ותמיכה בהפחתת תנועה. נתקלתם בקושי? ספרו לנו בטלפון 077-938-6192 או במייל, ונשמח לעזור.`
- Disclosure: `סרטון הפתיחה הוא הדמיה שנוצרה בבינה מלאכותית בהשראת המנות של המסעדה. תצלומי המנות והמסעדה הם של יוקו אונו.`
- `© YOKO ONO` + year.

Sticky phone bar (after the hero, hidden over the footer): `הזמינו שולחן` + a call button.

## 6. Vector layer plan (hand-drawn SVG, no credits)

- The lantern mark: a rounded paper lantern with three ribs and a tassel; used as the section marker (unlit: gold outline; lit: lantern fill with a soft glow pseudo-element), the favicon's companion, the hours "today" marker, and the hold target.
- Hero mid-layer: six blurred lantern orbs and three umbrella silhouettes, drifting 40 s loops with negative delays.
- Section dividers: a gold hairline that draws itself on entrance (stroke-dashoffset), with a small lantern at its end.
- Chapter rail in the menu section: vertical dotted cord.
- All honor reduced motion: final states, drives stopped.

## 7. Engineering list

- Video: `<video muted autoplay loop playsinline preload="none">`, poster set by JS inside the same gate that decides to load at all; source chosen by orientation (portrait and ≤ 820 px wide → 9:16 file, else 16:9); loads after first paint; decorative (`aria-hidden`, `tabindex="-1"`, no controls); `error` → poster stays. Gates: reduced motion, save-data, both live via change listeners.
- Parallax: one rAF loop, scrollY read once per frame, only sections currently intersecting are updated, `translate3d` only, delta-gated writes, amplitude × 0.6 under 820 px, off under reduced motion.
- Entrances: IntersectionObserver adds `.in`; stagger via `--i`; cleanup zeroes delays after the entrance; final states under reduced motion; no-JS shows final states.
- The hold: pointer and keyboard, progress builds over 1.4 s, eases back on release, completes once.
- Nav: scrolled class, phone menu with Escape, focus return, body scroll lock.
- Hours: today's row computed in Asia/Jerusalem.
- Performance: two font preloads, poster preload, images lazy below the fold with width/height, `content-visibility:auto` on lower sections, CSS and JS under 40 KB each.
- SEO: Hebrew title and description, canonical, OG and Twitter tags (`<!-- DEPLOY STEP -->` for absolute URLs), JSON-LD Restaurant with confirmed facts only, robots.txt, sitemap.xml, SVG favicon plus PNG and apple-touch icons, theme-color.
- Security: `_headers` on the Worker host and `.htaccess` for a Hostinger deploy, both from `security/htaccess-hardening.conf` (CSP self-only; fonts, media and images are all same-origin). No inline executable scripts. Business email added to the guard allowlist with a dated note.
- Quality floor: `overflow-x:clip` on html and body; skip link; landmarks; `:focus-visible` in lantern red; 44 px targets on coarse pointers; contrast computed, not guessed.

## 8. Copy gate

Every viewer-facing line above ships verbatim. Before anyone sees the page: grep for em dashes and the stock words (leverage, seamless, empower, unlock, robust, actionable, data-driven, solutions) and the body-copy tells; zero hits. Hebrew geresh (׳) and gershayim (״) are used in `פיוז׳ן` and `מוצ״ש` on purpose.
