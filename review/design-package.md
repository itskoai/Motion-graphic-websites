# Design package: הטרנינג של יובל ואיתי

Tier 1, one 6.5 second shot. Hebrew, RTL. The product is the real AliExpress fleece set (puff print with the maker's lettering) in two colors; the lookbook is Yuval and Itay in the series' cloud version of the same set. Buy buttons go to the owner's shop link when it exists; until then, one config block in `assets/site.js` decides where every buy button goes.

## 1. The brand premise

One word: **צד** (side). Same set, two colors, two characters: Itay's navy, Yuval's sky-blue. The visitor is not asked to like a tracksuit; they are asked which side they are on. The hero sets it up (one set, two sides), the color section names the sides, the sort quiz makes them choose, the hold makes them feel the print, the lookbook proves the set lives in every episode, and the order section closes with the side they picked already selected.

## 2. The palette as CSS tokens

Sampled from the approved footage: wet asphalt at night, cool streetlamp, the two suits, the white puff.

```css
:root{
  --canvas:#0b1020;        /* night asphalt, tinted navy, never pure black */
  --panel:#131c38;
  --navy:#1d2c5e;          /* Itay's side */
  --sky:#8fc0ec;           /* Yuval's side, also the accent */
  --accent:#8fc0ec;
  --accent-hover:#b1d6f6;
  --accent-muted:rgba(143,192,236,.16);
  --text-secondary:#aab4cf;
  --text-primary:#f3f1ea;  /* puff white */
}
```

Design-direction note, said out loud: deep navy canvas with a sky-blue accent is this product's own world (the two colorways plus the white puff), not a default dark-mode reach. The signature element carries the difference: the puff cloud, the series' own motif, drawn in SVG and inflated by the visitor's hand.

## 3. The type trio

- Display: **Rubik Bubbles** 400 (Hebrew subset). Puffy letterforms that echo the puff print. Used only for the big words: the brand word in the settle, the colorway names, step numerals, the FAQ plus sign.
- Headlines: **Secular One** 400. Hebrew-native, bold, rounded, confident.
- Body: **Assistant** 400, 600, 700.
- Labels: **Cousine** 400 (monospace with Hebrew) for kickers, chips, captions, form labels.

## 4. The band map

Hero height 500vh (scroll range 400vh). A step up from the 400vh default so each Hebrew beat gets an 80vh plus plateau; the flick test validates it.

| Band | Range (starting point) | Footage moment | Copy (verbatim) | Entrance |
|---|---|---|---|---|
| 1 | 0.00 to 0.20 | high above, the suits small in drifting mist | chip: "הסט מהסרטונים" / big: "סט אחד. שני צדדים." | scatter (mist gathers into words); opens settled with the load ramp |
| 2 | 0.25 to 0.48 | descending, mist thinning | "נייבי של איתי. תכלת של יובל." | drift-down |
| 3 | 0.53 to 0.76 | pushing in, the puff print reads | "פוטר עבה. פאף שמרגישים ביד." | approach-from-depth |
| 4 | 0.81 to 1.00 | arrival at rest, both suits composed left of center | big: "הטרנינג של יובל ואיתי" / sub: "אותו סט מהסרטונים, בשני הצבעים. בוחרים צד ומזמינים." / buttons: "להזמנה" , "איזה צד אני?" | word-by-word rise, then subline, then buttons |

All bands live in the calm asphalt on the right of the frame (the suits sit in the left and middle), right-aligned, with the single radial per-band scrim. Peak scrim alphas start at 0.70 (band 1), 0.64, 0.64, 0.68 (settle), tuned against worst frames in the audit.

## 5. The static-hero copy block

Portrait photo of both boys at night on the street (the lookbook's night shot) behind a bottom gradient.

- h1: "סט אחד. שני צדדים."
- p: "הטרנינג של יובל ואיתי, כמו בסרטונים. נייבי של איתי או תכלת של יובל."
- buttons: "להזמנה" , "איזה צד אני?"

## 6. The below-fold outline

Every button labeled "להזמנה" (and its color variants) is one anchor: the order action. One call to action, repeated.

**Nav:** brand "יובל ואיתי" with the cloud mark. Links: הצבעים, ההדפס, בכל פרק, מידות, שאלות. Button: "להזמנה".

**Section: הצבעים (#colors), two halves.**
- kicker: "שני צבעים · סט אחד"
- h2: "נייבי של איתי. תכלת של יובל."
- lede: "אותו סט, צבע אחר. ככה יודעים שבאתם ביחד בלי להיות אותו דבר."
- Navy card: tag "אחי, סמוך עליי." / name "נייבי" / who "הצד של איתי · הרגוע" / "כהה ושקט, הולך עם הכל. הפאף הלבן קופץ עליו גם מרחוק." / button "להזמנה בנייבי"
- Sky card: tag "זה רעיון גרוע." / name "תכלת" / who "הצד של יובל · הלחוץ" / "בהיר ובולט, רואים אותו מקצה החצר. מי שלובש תכלת לא מתחבא." / button "להזמנה בתכלת"

**Section: ההדפס (#puff), the one interactive moment: press and hold to puff the print.**
- kicker: "ההדפס"
- h2: "פאף שמרגישים ביד"
- lede: "לחצו והחזיקו. ככה ההדפס עולה בתנור: שטוח, ואז בולט."
- hold hint: "לחצו והחזיקו" / after completion: "זהו, בולט. ככה זה מרגיש ביד."
- Three facts that light up in sequence when the hold completes:
  1. "פאף תלת ממדי" / "לא מדבקה שנסדקת. הדפס שעולה מהבד ונשאר בולט."
  2. "פוטר עבה, מוברש מבפנים" / "לא הדק הזה שרואים דרכו אחרי שתי כביסות. רך מהיום הראשון."
  3. "סט שבאמת סט" / "קפוצ'ון עם רוכסן מלא, גומי בשרוולים, שרוכים לבנים, מכנס רחב וישר. אותו גוון למעלה ולמטה."
- care line: "כביסה קרה, הפוך, בלי מייבש. נייבי לבד בפעם הראשונה. זה כל הסוד."
- Mechanics: progress builds while holding (1.4s to complete), releasing early eases back (0.7s), completion is kept, keyboard works with Space or Enter held, reduced motion shows the final state.

**Section: בכל פרק (#look), the lookbook grid (asymmetric, 8 photos).**
- kicker: "בכל פרק"
- h2: "יובל ואיתי לובשים את זה בכל פרק."
- lede: "מהמסדרון של בית הספר ועד המפל. אותו סט, אותם שני צבעים."
- honesty line under the grid: "שימו לב: בסרטונים הפאף מצויר כעננים. בסט שתקבלו ההדפס הוא הפאף המקורי של היצרן, כמו בתמונות המוצר למעלה. אותו בד, אותם צבעים, אותה גזרה."
- captions (one per photo, by location): "המסדרון", "הרחוב, בלילה", "הכיתה", "המפל", "הזולה", "מאחורי האוטו", "הגדר", "השער"

**Section: מכל זווית (#turn), two turnaround cards with view dots.**
- kicker: "מכל זווית"
- h2: "קצר כמו שצריך. רחב אבל לא נגרר."
- lede: "קפוצ'ון קצת קרופ, מגיע לחגורה ולא טופ בטן. מכנס רחב וישר שיושב על הנעל."
- cards: "נייבי · איתי", "תכלת · יובל"; view dots: "חזית", "שלושה רבעים", "צד", "גב"

**Section: השאלה האמיתית (#who), the side sort.**
- kicker: "השאלה האמיתית"
- h2: "אתה איתי או יובל?"
- lede: "אחד רגוע, אחד בלחץ. תבחרו, ונגיד לכם איזה צבע לקחת."
- choice 1: "רגוע. 'אחי, סמוך עליי.'" / small: "שום דבר לא מזיז לי. גם כשהשוטר בשער."
- choice 2: "בלחץ. 'זה רעיון גרוע.'" / small: "אני כבר רואה איך זה נגמר, ולא טוב."
- placeholder before a pick: "תבחרו צד. אנחנו כבר נגיד לכם מה ללבוש."
- result 1 (Itay expression sheet): "אתה איתי. הנייבי שלך." / "כהה, שקט, לא צועק. בדיוק כמוך." / button "להזמנה בנייבי"
- result 2 (Yuval expression sheet): "אתה יובל. התכלת שלך." / "בהיר, בולט, כולם רואים שמשהו קורה. בדיוק כמוך." / button "להזמנה בתכלת"
- Picking a side also selects that color in the order form.

**Section: איך זה עובד (#how), three steps on a self-drawing line, each with its own still.**
- kicker: "איך זה עובד"
- h2: "בוחרים צד. בוחרים מידה. מזמינים."
- 01 "בוחרים צד" / "נייבי של איתי או תכלת של יובל. או שניכם, אחד כל אחד."
- 02 "בוחרים מידה" / "המידה הרגילה שלכם. בין מידות? תעלו אחת. זה אמור לשבת רפוי, לא צמוד."
- 03 "מזמינים" / "לוחצים להזמנה, ממלאים פרטים, וזה בדרך אליכם עם מעקב."

**Section: מידות (#sizes).**
- kicker: "מידות"
- h2: "המידה הרגילה שלכם. בין מידות? תעלו אחת."
- lede: "זה סט אוברסייז קל: הקפוצ'ון קצת קרופ, המכנס רחב. לא שק, לא צמוד."
- fit guide rows (who it fits, not invented centimetres): "S · עד 165 ס״מ, גזרה רפויה" , "M · 165 עד 175" , "L · 175 עד 183" , "XL · 183 עד 190" , "XXL · מעל 190, או מי שרוצה אקסטרה אוברסייז"
- note: "טבלת ס״מ מלאה (חזה, אורך, אורך פנימי) מתווספת לפני המשלוח הראשון. עד אז, הכלל למעלה עובד."
- side photo: the navy turnaround front view.

**Section: שאלות (#faq), ten questions, buyers' own objections.**
1. "ההדפס מתקלף בכביסה?" / "זה פאף תלת ממדי, לא מדבקה. מה שהורג פאף זה חום: כביסה קרה, הפוך, בלי מייבש, וזה נשאר בולט."
2. "זה מתכווץ או עושה כדורים?" / "פוטר עבה ומוברש, לא הדק שעושה כדורים אחרי שבוע. כביסה קרה בלי מייבש שומרת על המידה."
3. "כמה קרופ זה קרופ?" / "מגיע לחגורה. קצר כמו שצריך, לא טופ בטן. גבוהים שרוצים כיסוי, תעלו מידה."
4. "המכנס ייגרר על הרצפה?" / "רחב וישר, יושב על הנעל. נמוכים? קיפול אחד וזה יושב."
5. "אני בין מידות, מה לוקחים?" / "תעלו אחת. זה אמור לשבת רפוי, לא צמוד."
6. "זה בדיוק מה שיובל ואיתי לובשים?" / "אותו סט, אותם צבעים, אותה גזרה. בסרטונים הפאף מצויר כעננים, ובסט האמיתי ההדפס הוא הפאף המקורי של היצרן, כמו בתמונות המוצר כאן."
7. "זה לא חם מדי לארץ?" / "חורף ישראלי: מספיק חם לערב בחוץ, לא מחניק בכיתה. בסתיו רק הקפוצ'ון, בחורף הסט המלא."
8. "כמה זה עולה?" / "המחיר מופיע בהזמנה. מחיר שפוי, לא יקר בטירוף."
9. "זה המקורי או חיקוי?" / "רק פה. אין אתר אחר. הלינק היחיד הוא בביו של יובל ואיתי."
10. "התכלת דוהה? הנייבי צובע?" / "כביסה ראשונה לנייבי לבד. קר, הפוך, בלי מייבש. התכלת נשאר תכלת."

**Section: להזמנה (#order), the close.**
- kicker: "להזמנה"
- h2: "בחרתם צד? יאללה."
- lede: "ממלאים פרטים, בוחרים צבע ומידה, ומקבלים לינק להזמנה. הודעה אחת, בלי ספאם."
- fields: "שם" (placeholder "איך קוראים לכם?"), "טלפון או מייל" (placeholder "050 או מייל"), color radios "נייבי · איתי" / "תכלת · יובל" / "שניהם", size select "S, M, L, XL, XXL, עוד לא בטוח/ה"
- fine print: "אנחנו שולחים הודעה אחת עם הלינק להזמנה. זהו."
- button: "שלחו לי לינק להזמנה"
- errors: "חסר שם. איך נקרא לכם?" / "צריך טלפון או מייל שבאמת אפשר להגיע אליו."
- success: "{שם}, קיבלנו." / "בחרתם {צבע}. הלינק להזמנה בדרך אליכם."
- Routing (the config block in `assets/site.js`): when a shop URL is set, every buy button opens it and the form is replaced by one big "להזמנה עכשיו" button; when a WhatsApp number is set, buy buttons open WhatsApp with the chosen color and size pre-filled; when a form endpoint is set, the form posts there and shows a real success or failure; with nothing set (the preview state), buttons scroll to the form and the form shows the success state only. The site must not go live in the nothing-set state.

**Footer.**
- brand line: "יובל ואיתי · דור העתיד"
- column "ניווט": the section links
- column "לשמור על הסט": "כביסה קרה, הפוך, בלי מייבש. נייבי לבד בפעם הראשונה."
- fine print: "התמונות של יובל ואיתי נוצרו בבינה מלאכותית. יובל ואיתי הן דמויות מהסדרה דור העתיד." / "האתר הרשמי היחיד של הסט. אין אתר אחר." / "© 2026 יובל ואיתי"

## 7. The vector layer plan

- The cloud mark: one hand-drawn SVG puff cloud (five lobes, soft inner highlight). Favicon, nav brand, section markers that inflate (scale 0.9 to 1 plus highlight) on entrance.
- The hold cloud: the same cloud at large size, three layers (flat outline, fill that scales with progress, a shine that fades in squared) plus a drop shadow that deepens, all driven by one `--p` custom property.
- The environment layer: three soft blurred blobs drifting on 96 to 150 second cycles with negative delays, plus SVG grain, fixed behind the whole page.
- The steps line: one path drawn by scroll progress through the section (stroke-dashoffset, delta-gated).
- Reduced motion: everything shown in its final state, every drive stopped.

## 8. The engineering list

Blob fetch with the honest ring and 20s stall watchdog; dt-normalized lerp that rests; gated seeks with the deadlock escape; delta-gated DOM writes; band pacing in scroll distance validated by the flick test; four-layer legibility (global scrim, per-band radial scrim riding `--k`, three-layer text shadow, chips for small text); the five static-hero gates identical in CSS and JS and re-evaluated live; complete-without-video; band one load ramp; reduced motion honored live in both directions; `overflow-x: clip` on html and body; one living element per section paused off-screen and on hidden tabs; `transform` and `opacity` only; 44px touch targets; focus-visible in the accent; semantic landmarks and a skip link; the quality floor in `scrub-pipeline.md`; the whole-site-animated standard from Phase 8.

## 9. The copy gate line

Every viewer-facing line above ships verbatim. Before anyone sees the page, `index.html` is grepped for em dashes and for the stock words (leverage, seamless, empower, unlock, robust, actionable, data-driven, solutions) until both return zero, and the body copy is swept for AI tells. The designed devices here (the staccato pairs like "סט אחד. שני צדדים." and the canon lines used as labels) are craft and stay.
