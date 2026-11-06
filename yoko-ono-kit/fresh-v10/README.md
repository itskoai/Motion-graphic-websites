# v10: fresh "Japanese summer", events, members' club

Owner's requests (6 Nov): no black background, a fresh site; events that come to the client and market tables; a small members' club widget whose rules get added later.

## Files → yoko-ono-v4/assets/
- fresh-v10.css: the theme. Rice paper (#f6f1e7), indigo ink (#16233b), sea glass (#2a8c86 / #cfe9e1), the red only for actions, and the seigaiha waves from the bottom of the logo as a pattern (section ends, footer edge). It also restyles the existing ambient, conveyor and games layers for daylight. The hero walk keeps its night palette. MUST be the LAST stylesheet.
- events-v10.css + events-section.html: the "אירועים" section. Paste it after #games, before #visit. A van drives the route to a red pin ("אירועים שזזים"), and a wooden market table seen from above holds plates of real food ("שולחנות שוק"). CTA: WhatsApp wa.me/972779386192 with a prefilled Hebrew line, plus a call button.
- club-v10.css + club-v10.js + club.json: a small "מועדון יוקו" button (bottom corner, rises above the phone booking bar) that opens a panel. ALL panel text lives in club.json: title, intro, perks[], terms[], cta_label, cta_link. Empty fields are hidden. For now: "מועדון החברים של יוקו אונו. הפרטים יעלו בקרוב." plus a call button. No signup form (that needs consent and a privacy update first). club-v10.js also starts the events animations.

## index.html
1. After the existing stylesheets, in this order: events-v10.css, club-v10.css, fresh-v10.css (last).
2. After the existing scripts: club-v10.js.
3. Paste events-section.html after #games.
4. Nav: add <a href="#events">אירועים</a> after המגרש.
5. <meta name="theme-color" content="#f6f1e7">.
No inline style attributes (the CSP blocks them).

## Facts used (only these)
They do events that come to the client; they do market tables (one long table with their food spread out, guests come and take); events WhatsApp = the site's phone number. No prices, sizes, menus or club rules.

Tested together on the v4 site at iPhone 13 and 1440×900: zero console errors, no horizontal overflow, the club panel opens and closes, the van and the plates animate on entry.

## v11 add-on (6 Nov evening)
- breeze-v11.css → assets/. Link it right AFTER fresh-v10.css (it becomes the last stylesheet).
  1. Yuzu yellow (#f2c230) in small accents only: the kicker dash, the club star and the panel's top bar, the start pin on the events route, one plate rim on the food belt, the visit-row underline, a soft sun glow in the closing section, and text selection. Buttons stay red.
  2. Breeze: the background umbrellas drift and tilt in gusts, and the lanterns swing harder, as if a light sea wind passes. Off under reduced motion.
- events-v10.css updated: the van now stops just before the red pin instead of on it.
