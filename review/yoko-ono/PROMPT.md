# YOKO ONO · master website prompt, version 2 (3 November 2026)

This is the merged brief. The long master prompt from the previous build is the base (it holds the verified business facts and the section inventory). The short "build and deploy a one-page site" prompt contributed its hard requirements (tap-to-call, Google Maps directions, verbatim reviews only, OG image, transform-based parallax with reduced motion, deploy and verify). On top of both sit the three things the owner said in person, which outrank everything else.

## Which prompt was better, and why this one replaces both

- The long prompt wins as the base: it is grounded (phone, address, links, kosher status, what not to invent) and it already structures the page. Its weakness: it asks for a generic "cinematic hero of plated sushi", which is what every restaurant site does.
- The short prompt is a generic template. Two of its demands are wrong for this project: an AI-generated hero video (the owner has a real restaurant, and we have real footage of it), and "2 to 3 verbatim reviews" (no verbatim review text could be verified from public sources, so none is shown).
- The owner's three points are the spine of this version. Everything below is the long prompt rewritten around them.

## The owner's three points (from the 2-hour meeting)

1. The first screen is a walk into the restaurant. Scrolling down moves the visitor from the street, through the red gate, under the paper-umbrella ceiling, past the set tables and into the lounge. When the walk ends, the page continues into the website.
2. Not bloated. Minimal and focused, with all the information that really matters and nothing missing: reserve, menu, delivery, kosher, hours, address, phone.
3. Motion graphics, done with restraint: the walk itself, text that arrives with the footage, the umbrella ceiling as a drawn motion layer, parallax on the photos.

## Business facts (verified or stated by the business)

- Name: YOKO ONO · יוקו אונו · Asian fusion restaurant (Japanese, Chinese and Thai influences, sushi bar and cocktail bar).
- Address: אחוזה 124, רעננה. Phone: 077-938-6192. Email: yokoono.israel@gmail.com.
- Reservations: https://ontopo.com/he/il/page/14510630
- Menu and delivery: https://wolt.com/he/isr/hasharon/restaurant/yoko-ono (the old menu domain yoko-ono-menu.com lapsed; Wolt carries the full menu with prices).
- Instagram: https://www.instagram.com/yoko_ono_fusion/ · Facebook: https://www.facebook.com/share/1cHAUizDXE/
- Kosher: the restaurant presents itself as כשר למהדרין; listings name בד״ץ בית יוסף. The certificate must be confirmed with the owner before the line goes beyond "כשר למהדרין".
- Hours (reservation system; confirm with the owner): Sunday to Thursday 12:00 to 23:00, Friday 11:30 to 14:30, Saturday night 20:30 to 23:00.
- Reviews: no verbatim review text was obtainable (Rest, Google, Tripadvisor could not be read from this environment). Nothing is quoted. The Facebook "70% recommend" figure is never used.

## Assets (all real, supplied by the owner's team)

- Three phone clips, portrait 1080x1920, HLG HDR: the walk from the gate to the lounge (15 s), a second pass through the umbrella room to the lounge (6 s), the second dining room (3 s).
- Twelve photos: sushi on a banana leaf, the umbrella ceiling, dumplings in a steamer, a waiter, salmon nigiri with a soy drizzle, a bartender pouring, the logo, cucumber-wrapped rolls, a salmon bowl, tuna tataki, a smoked cocktail, a salmon roll with roe.
- The logo (low resolution; enhanced for the site, never redrawn).

## What the site must do

1. Hero: the real walkthrough, scrubbed by scroll, forward and backward, from the first frame outside to the lounge at rest. On phones the portrait footage fills the screen. On desktop it opens as a doorway in the centre of the screen with the words in the calm space beside it, and the whole screen glows with the footage behind it. Reduced motion and slow connections get a composed still of the gate with the same words.
2. After the settle, one focused page: who we are (three lines), the food (real photos, hover motion), menu and delivery (Wolt), reservation (Ontopo), the place (bar, the second room as a quiet loop), kosher, hours, address with tap-to-call and Google Maps directions, events by phone or email, footer with privacy and accessibility pages.
3. One call to action everywhere: הזמינו שולחן. Menu and delivery second.
4. Hebrew first, RTL correct, English only for the brand and short labels.
5. Plain HTML, CSS and JavaScript, one folder, no build step. Fonts self-hosted. No trackers, no third-party scripts, strict Content-Security-Policy, security headers.
6. Fast: page under 100 KB before media; the hero video streams behind a poster and an honest progress ring; photos sized per screen.
7. Motion only on transform and opacity, every effect reversible by scroll, reduced motion honoured in both directions, nothing snaps.
8. Never invent dishes, prices, awards, history, chef names or reviews. Copy may describe only what the photos and footage show.

## Deliverables

- The deploy folder `yoko-ono-site/` (index.html, assets/, privacy.html, accessibility.html, robots.txt, sitemap.xml, .htaccess for an Apache host, _headers for Cloudflare).
- The live preview on the Higgsfield host, verified with real requests, with speed numbers.
- `review/yoko-ono/DESIGN.md` (the design package) and `review/yoko-ono/HANDOVER.md` (what the owner must confirm and how to change things).
