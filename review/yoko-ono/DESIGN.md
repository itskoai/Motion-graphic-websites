# Design package · YOKO ONO, Ra'anana

Consumed verbatim by the build. Copy ships exactly as written here. Band ranges are starting points, validated by the flick test.

## 1. The brand premise

One word: **להיכנס** (to come in). The owner's own vision is a walk from the street into his restaurant, and that is the whole site: the visitor's scroll is the walk. The red gate, the paper-umbrella ceiling, the set tables, the lounge: everything the page says is "come in, it is right here, and it is beautiful". Every section ends on the same door: הזמינו שולחן.

Why real footage and not a generated film: the restaurant exists, it is photogenic, and the owner filmed the walk himself. A generated interior would be a different restaurant. The footage is tone-mapped (the phone shot HDR), stabilized, and scrubbed by scroll; nothing in the hero is invented.

Said out loud: the palette is dark, warm and lacquer-red with a serif display face. That is the restaurant's own material world (red gate, red walls, lantern light, night), sampled from the footage, not a default reach. The signature element, the umbrella layer, is what keeps it this brand's and nobody else's.

## 2. The palette (sampled from the tone-mapped footage)

```css
:root{
  --canvas:#130f0e;        /* the night outside the gate, tinted warm */
  --panel:#1c1513;         /* raised surfaces */
  --panel-2:#251b18;       /* hover state of panels, chips */
  --ink:#f4ece1;           /* primary text, the white tablecloths (16.3:1 on canvas) */
  --ink-2:#c4b6a6;         /* secondary text (9.6:1) */
  --ink-3:#8f8276;         /* labels, tertiary (5.1:1 on canvas, 4.8:1 on panel) */
  --lacquer:#c8302a;       /* the gate. CTA, focus, one emphasis per screen (ivory on it: 4.6:1) */
  --lacquer-hover:#d63a2f;
  --lacquer-muted:rgba(200,48,42,.22);
  --lantern:#e9b45f;       /* the gate lanterns: glows, the loading umbrella, whisper only (10.1:1) */
  --tan:#cdbc9b;           /* the logo's khaki gold, used only for the logo and hairline emphasis (10.2:1) */
  --line:#5a4a44;          /* interactive borders (2.3:1; decorative hairlines use #3a2f2b) */
  --umb-red:#c8302a; --umb-mustard:#d9a13c; --umb-slate:#7f93ad; --umb-terra:#c97f55; --umb-cream:#d9cdb6; --umb-sage:#8b9a6b;
}
```

The accent appears in rare doses: the primary button, focus rings, the nav dot, one umbrella in the layer. Never as a section background.

## 3. The type trio

- **Display:** Noto Serif Hebrew 300 (hero lines, section headlines), 400 for the settle headline. Light, airy, editorial; Latin from the same family for "YOKO ONO" in running text.
- **Body:** Assistant 300 (lede), 400 (body), 600 (buttons, labels in Hebrew).
- **Latin labels:** Jost 400/500, tracked 0.18em, uppercase: kickers (THE FOOD, FIND US), the hero kicker. Geometric, an echo of the logo's letterforms. There is no mono: a mono on a Hebrew restaurant page reads as a tech site.

All self-hosted, Hebrew and Latin subsets only, preloaded: Noto Serif Hebrew 300 Hebrew, Assistant 400 Hebrew.

## 4. The footage and the band map

**The film:** walk1 0.0 to 7.4 s (street, gate, through the glass door, first tables under the umbrellas) crossfaded 0.4 s into walk2 2.6 to 5.97 s (the umbrella dining room, then the lounge, which comes to rest). About 10.4 s, 312 frames, portrait 720x1280 for the page (the phone shot 1080x1920). The seam lands inside the motion of both clips, so it reads as a swish pan.

**Progress to time:** scroll progress p 0 to 0.84 maps linearly to the film; 0.84 to 1 holds the last frame while the settle assembles.

**Desktop stage:** the film is a doorway in the centre of the screen (portrait, full viewport height, 2 px lacquer-tinted hairline, 14 px radius), opening from a slit to its full width in the first 1.4 s after load. Behind it, a canvas paints the current frame blurred and darkened edge to edge, so the whole screen walks with the visitor. Captions live in the two lanes beside the doorway. RTL: the first band is in the right lane.

**Phone stage:** the portrait film fills the screen (cover). Captions sit in the lower third over a bottom scrim; the settle copy sits above a bottom gradient with the buttons at thumb height.

| Band | Range (start) | Film | Lane | Copy (verbatim) | Entrance |
|---|---|---|---|---|---|
| kicker | always on | | top | YOKO ONO · ASIAN KITCHEN · RA'ANANA | fades with the page |
| 1 | 0.00 to 0.17 | outside the gate, approaching the door | right | **בואו ניכנס.** / אחוזה 124, רעננה. | approach from depth (the line grows toward the viewer as the camera walks) |
| breath | 0.17 to 0.26 | through the glass door | | | |
| 2 | 0.26 to 0.46 | inside: tables, umbrellas overhead | left | **מטריות נייר מעל הראש.** / שולחנות ערוכים, אור של פנסים. | drift-down (the words settle like umbrellas hung from the ceiling) |
| breath | 0.46 to 0.55 | the swish through the seam | | | |
| 3 | 0.55 to 0.74 | the umbrella room, into the lounge | right | **סושי. מנות חמות. קוקטיילים.** / כשר למהדרין. | word-punch, one word per step |
| breath | 0.74 to 0.82 | arriving at the lounge | | | |
| settle | 0.82 to 1.00 | the lounge at rest | right (logo left) | **מסע של טעמים. חוויה שלמה.** / פיוז׳ן אסייתי בלב רעננה. מחכים לכם. / [הזמינו שולחן] [לתפריט] | word-by-word rise, then the subline, then the buttons |

Hero height: 640vh on desktop, 560vh on phones. Each band plateau is 80 to 130vh with 20vh ramps.

## 5. The static-hero copy block

Poster: the first frame, the red gate at night. Shown to reduced-motion visitors, save-data, and when the film fails.

- Kicker: YOKO ONO · ASIAN KITCHEN
- Headline: מסע של טעמים. חוויה שלמה.
- Subline: פיוז׳ן אסייתי, כשר למהדרין, בלב רעננה. מחכים לכם באחוזה 124.
- Buttons: הזמינו שולחן · לתפריט

## 6. The below-fold outline (every section funnels to הזמינו שולחן, which goes to Ontopo)

**Nav (fixed, appears once the hero settles, always on phones as a slim bar):** logo mark, links: התפריט · המקום · הגעה, phone icon, button הזמינו שולחן.

**A. The umbrella ceiling (the divider).** A drawn SVG strip of hanging umbrellas that sway at whisper level. No copy.

**B. The experience.** Kicker THE EXPERIENCE. Headline: **יותר מארוחה. חוויה אסייתית.** Lede: ביוקו אונו נפגשים המטבח היפני והאסייתי: סושי ורולים מוקפדים, מנות חמות, קוקטיילים ואווירה שעושה חשק להישאר. כשר למהדרין, בלב אחוזה. Chips: סושי ורולים · מנות חמות · קוקטיילים · כשר למהדרין. Image: the umbrella ceiling photo, wide, parallax depth 0.2.

**C. The food.** Kicker THE FOOD. Headline: **הטעמים שמחכים לכם.** Lede: סושי ורולים, ניגירי, דים סאם ומנות חמות. התפריט המלא, עם המחירים, מחכה ב-Wolt. Gallery of seven real photos with hover motion and depth: sushi on a banana leaf (wide), salmon nigiri with the drizzle, tuna tataki, dumplings in the steamer, cucumber-wrapped rolls, the salmon roll with roe, the salmon bowl. Captions (what is seen, not menu names): רולים על עלה בננה · ניגירי סלמון · טאטאקי טונה · דים סאם באידוי · רולים בעטיפת מלפפון · רול סלמון ואיקורה · קערת סלמון. Buttons: לתפריט המלא ב-Wolt (secondary) · הזמינו שולחן (primary).

**D. The place and the bar.** Kicker THE PLACE. Headline: **המקום. הבר. הערב.** Lede: חדר אחד מתחת למטריות, חדר שני שקט יותר, ובר שמכין קוקטיילים עם עשן. באים לארוחה, נשארים לכוס. Media: the second room as a silent loop (3 s forward and back, so it never jumps), the bartender pouring, the smoked cocktail, the waiter. Caption under the loop: החדר השני.

**E. Delivery.** Headline: **יוקו אונו, גם אצלכם בבית.** Lede: בא לכם ליהנות מהטעמים שלנו בבית? ההזמנה למשלוח דרך Wolt, ולאיסוף עצמי מתקשרים. Buttons: להזמנת משלוח (Wolt) · 077-938-6192 (tel).

**F. Events.** Headline: **רגעים מיוחדים, באווירה אחרת.** Lede: חוגגים משהו? ספרו לנו מה אתם מתכננים ונחזור אליכם. Buttons: לפרטים על אירועים (mailto yokoono.israel@gmail.com, subject פנייה בנושא אירוע ביוקו אונו) · או התקשרו: 077-938-6192. No capacities, rooms or packages are claimed.

**G. Find us (the interactive moment lives here).** Kicker FIND US. Headline: **נתראה ביוקו אונו.** Address: אחוזה 124, רעננה (Google Maps directions, Waze). Phone: 077-938-6192 (tel). The two gate lanterns, drawn in SVG, sit above the hours, unlit. Prompt: לחצו והחזיקו כדי להדליק את הפנסים. Holding fills the glow; releasing early eases it back; completing lights the lanterns, and the hours rows light one by one, then the button. Lit line: הפנסים דולקים. מחכים לכם. Hours title: שעות פעילות. Rows: א׳–ה׳ 12:00–23:00 · ו׳ 11:30–14:30 · מוצ״ש 20:30–23:00. Small: לפי מערכת ההזמנות. בחגים ובמועדים כדאי לוודא בטלפון. Button: הזמינו שולחן. Reduced motion: lit from the start.

**H. Footer.** Logo, YOKO ONO · ASIAN KITCHEN, אחוזה 124, רעננה · 077-938-6192 · yokoono.israel@gmail.com, links: הזמנת שולחן · תפריט · משלוחים · אינסטגרם · פייסבוק · פרטיות · נגישות. Line: © YOKO ONO. The footage and photos are the restaurant's own.

**Phone sticky bar:** הזמינו שולחן + phone icon, slides up after the hero.

**Form handling:** no form. A static site with a strict CSP and no backend; inquiries go by phone or email, said plainly in the events section. Nothing is collected or stored.

## 7. The vector layer plan

- `#umb` symbol: a paper umbrella seen from below (circle, sixteen ribs, hub, a faint inner ring). Six colours from the real ceiling.
- The environment layer: fixed, behind everything, six large umbrellas at 5 to 9 percent opacity, each rotating over 140 to 220 s with negative delays, plus a warm radial breath over 70 s. Paused off-screen and on hidden tabs; reduced motion stops them.
- The ceiling divider: eleven umbrellas hanging from hairlines, each swaying 1.2 degrees over 7 to 11 s.
- The loading umbrella: the progress ring is an umbrella outline whose rim draws itself (stroke-dashoffset) and whose ribs appear as the film streams in. On failure it becomes a scroll chevron.
- `#lantern` symbol: the hexagonal gate lantern with a warm core; two in the find-us section, lit by the hold.
- Section kickers carry a small umbrella glyph in the brand's lacquer before the Latin label.
- Favicon: a lacquer umbrella on the canvas.

Reduced motion: final states shown, every drive stopped.

## 8. The engineering list

Blob fetch streamed behind the umbrella ring (video over 8 MB), poster painted first, 20 s stall watchdog, dt-normalized lerp that rests when converged and when the hero is off-screen, gated seeks with the error escape, delta-gated DOM writes, band pacing in vh with the flick test, the four-layer legibility system (base scrim, per-band scrim riding `--k`, three-layer text shadow, chips for small text), the five static-hero gates decided before first paint and re-checked live from change listeners, reduced motion honoured both ways mid-session, complete without the video, overflow-x clip on html and body, one living element per section, entrances choreographed with retired stagger delays, 44 px touch targets, skip link, landmarks, strict CSP with no inline scripts or styles (all styles in site.css, all scripts in head.js and site.js), `_headers` for Cloudflare and `.htaccess` for Apache carrying the same policy.

The phone decision: phones get the real scrub (the footage is portrait, the phone encode is under 6 MB), with the static poster hero as the fallback on reduced motion, save-data, slow networks and any failure.

## 9. The copy gate

Every viewer-facing line above ships verbatim. Before anyone sees the page: zero em dashes, zero stock words, the body-copy sweep for AI tells. The designed devices here (the three-word punch "סושי. מנות חמות. קוקטיילים.", "המקום. הבר. הערב.") are craft and stay.
