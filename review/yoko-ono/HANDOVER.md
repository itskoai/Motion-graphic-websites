# יוקו אונו · handover notes (29 Oct 2026)

Site folder: `yoko-ono/` (one `index.html` plus `assets/`, `_headers` for Cloudflare-style hosts, `.htaccess` for Hostinger, `robots.txt`, `sitemap.xml`). Working material in `review/yoko-ono/` never ships.

## Where it lives now

- Live preview: https://yoko-ono-raanana.higgsfield.app (Higgsfield hosting, Cloudflare edge). Published through Higgsfield, which also lists the site on Higgsfield's community feed. To take it off the feed later: ask Claude to unpublish, or use the website's settings in Higgsfield. The restaurant's own domain was not touched.
- Media files (photos, hero loops, posters, share image) are not in this repository: this cloud session could not download anything from Higgsfield's storage, so they were produced and staged inside Higgsfield's sandbox and shipped straight to the host. A zip of everything in `assets/media/` (11 MB) sits in the owner's Higgsfield library as `yoko-ono-media.zip`, media id `15e5f554-2b62-48b4-aa86-7bed7041c2d3`, URL https://d2ol7oe51mr4n9.cloudfront.net/user_3JXn7dWMpUjEIA8TLhm1dBADHWp/15e5f554-2b62-48b4-aa86-7bed7041c2d3.zip. Unzip it into `yoko-ono/assets/` before a Hostinger deploy, then run `python3 -I security/guard.py --deploy yoko-ono`.

## For a Hostinger deploy (when the owner wants the real domain)

1. Unzip the media as above.
2. Patch the four absolute URLs at the `<!-- DEPLOY STEP -->` comment in `index.html` (canonical, og:url, og:image, twitter:image), plus `robots.txt` and `sitemap.xml`, with the real domain.
3. `python3 -I security/guard.py --deploy yoko-ono` must say OK.
4. Zip the CONTENTS of `yoko-ono/` (index.html at the top level) and deploy.

## Things only the owner can confirm (none are claimed as facts beyond what the page says)

1. Opening hours. The page shows Sun–Thu 12:00–23:00, Fri 11:30–14:30, Sat 19:00–23:00, taken from the restaurant's Ontopo booking page, with the caption "per the booking system, confirm on holidays". Wolt and Tripadvisor list different Friday and Saturday hours. Fix the three rows in `index.html` (search `hours-list`) and the JSON-LD block at the top of the file.
2. Kosher certificate. The page says "כשר למהדרין", which is the restaurant's own description on Instagram; search results list it under Badatz Beit Yosef and the Ra'anana religious council. The supervising body is not named on the page on purpose.
3. The menu link (yoko-ono-menu.com) could not be opened from this session; the Ontopo and Wolt links were confirmed to exist through search.
4. Events. The section invites inquiries only (email with a prefilled subject, plus the phone). No capacities, rooms or packages are claimed.
5. Reviews. No quotable public review text exists (Google was unreachable; Tripadvisor has one review, Rest one negative one, Facebook's seven are not quotable), so the page has no reviews block. Add real quotes later if the owner supplies them.
6. Facebook link uses the page id (profile.php?id=61561688363551) because share links expire.

## Honesty line on the page

The footer states that the opening video is an AI-made atmosphere piece inspired by the restaurant's plating, and that the photographs are the restaurant's own. The photos were the owner's Google Maps and Instagram images, enlarged with Higgsfield's upscaler; the logo is the real emblem keyed to flat gold.

## Generation receipts (Higgsfield, 29 Oct 2026)

- Hero start frames: GPT Image 2.5, 2k, two candidates each for 16:9 and 9:16, references = the owner's sashimi, entrance and nigiri photos.
- Hero loops: Kling 3.0 pro, no sound, start and end frame identical for a seamless loop; 10 s for 16:9, 8 s for 9:16; two takes each, calmer take chosen; half-second crossfade at the loop point in ffmpeg; H.264 at crf 18/19 plus VP9 copies.
- Upscales: 16 photos and the logo crop to 2k (2 credits each). One failed and was re-run.
- Abstract lantern-bokeh plate for the delivery section: GPT Image 2.5.
- Total spend 108.75 credits (balance 683.59 before, 574.84 after).

## Test receipts

- Local (stand-in media, Chromium): parallax transforms on hero and section images, reveals, kicker lines, the lantern hold (builds, eases back on early release, lights at 1.4 s), strip slide at 1280/1440/1920, sticky bar on phones (hidden over the footer), phone menu open/close with focus return, hours row for today, zero console errors, no horizontal overflow at 1440/1280/390.
- Real media (Chromium inside Higgsfield's sandbox, local server): 16:9 loop plays and wraps (jump to the end lands at 0.8 s and keeps playing), 9:16 on phones likewise, reduced motion requests no video, page 33 KB, CSS 31 KB, JS 13 KB, fonts 136 KB, posters 229/237 KB, loops 2.5 MB / 2.0 MB (WebM 0.5 / 0.65 MB).
- Copy gate: zero em dashes, zero stock words.
- Live (https://yoko-ono-raanana.higgsfield.app, measured from Higgsfield's sandbox on 29 Oct 2026): HTTP 200; curl TTFB 0.26 s, full HTML 0.27 s (51 KB raw, 14 KB compressed); CSS 8 KB and JS 4.5 KB compressed; fonts 136 KB; desktop loop 2.5 MB, phone loop 2.0 MB. Headless Chromium: loop playing within 3.5 s on desktop and phone, wraps at the end and keeps playing, page load event 1.5 s on the phone profile; zero errors from the site's own code (the host injects one inline auth snippet that its own CSP blocks, harmless). Headers at the edge: HSTS, strict CSP (script-src and style-src self), nosniff, referrer-policy, permissions-policy, frame-ancestors limited to Higgsfield and Claude hosts. The host rewrites the CSP, so the page carries no inline style attributes at all.

## Network notes for future builds here

Blocked from this cloud session: higgsfield.app, higgsfield.ai, both Higgsfield cloudfront hosts, upload.higgsfield.ai, yoko-ono-menu.com, ontopo.com, wolt.com, google.com, tripadvisor.com, rest.co.il, d.co.il, facebook.com. GitHub raw is open, so files flowed repo → sandbox; nothing could flow back except what the sandbox renders as images.
