# YOKO ONO website · handover, version 3 (4 November 2026)

## Where everything is
| What | Path |
|---|---|
| The website (this folder is what goes online) | `yoko-ono-site/` |
| Page text (Hebrew, real HTML) | `yoko-ono-site/index.html` |
| Styles and scripts (no build step) | `yoko-ono-site/assets/site-v3.css`, `assets/head-v3.js`, `assets/site-v3.js` |
| Click counter (PHP, only on a PHP host) | `yoko-ono-site/api/click.php` |
| Privacy and accessibility pages | `yoko-ono-site/privacy.html`, `accessibility.html` |
| The brief (version 3) | `review/yoko-ono/PROMPT.md` |
| Design package (premise, palette, type, scenes, copy) | `review/yoko-ono/DESIGN.md` |
| Build and test tools | `review/yoko-ono/tools/` (`masters.sh`, `film.sh`, `photos.py`, `icons.mjs`, `qa.mjs`, `legibility.mjs`, `shots.mjs`) |
| Nonofficial preview | https://yoko-ono-raanana.higgsfield.app/ (see "Preview" below for what was verified) |

## What version 3 is
The owner's three points, built literally: the first screen is the real street outside the restaurant; scrolling walks through the red gate, the glass doors and the umbrella room, sweeps across the paper-umbrella ceiling and arrives in the second dining room; the room then contracts into the shape of the logo's arch and becomes the first image of the page. After that: the experience (headline, three lines, two buttons), the food (four photographs, the menu button), the gallery (all eleven photographs in a side rail with a lightbox), and one reserve-visit-order area. Nothing else.

Nothing in the walk is generated. The three phone clips were tone-mapped from the phone's HDR, stabilized, and joined with two half-second dissolves placed inside camera motion. The logo is the traced vector from version 2, recoloured champagne.

Plain HTML, CSS and JavaScript on purpose (no React, Tailwind, Motion or GSAP): fastest first paint, a strict Content-Security-Policy with no inline code, the folder deploys to any host, and the scrub engine is the one proven in version 2.

## The walk on phones, and why the file names carry "v3"
On phones the walk is no longer a video: it is a sequence of 117 WebP frames (12 per second, 540x960, 2.8 MB in all) drawn on a canvas as the visitor scrolls. A video on iPhone can stay blank when the phone is in Low Power Mode or until the visitor taps it; a frame sequence has none of those rules, so the walk shows on every iPhone and Android in every mode. Desktops keep the 720p video. The frames live in `assets/walk/ph/` and are made by `tools/film.sh`.

The styles, scripts, logo, icons and share image are named with a `-v3` suffix because the hosts send a one-year cache header for everything under `assets/`. A phone that had opened the previous build kept the old files under the old names, which is what a blank hero with unstyled text looks like. New names mean every visitor gets the new files; keep that habit when these files change again.

## Things only the owner can confirm (before telling customers the site is final)
1. **Hours.** The page shows Sunday to Thursday 12:00 to 23:00, Friday 11:30 to 14:30, Saturday night 20:30 to 23:00, the reservation system's hours as read in version 2. Wolt lists different delivery hours per day (for example Thursday until midnight, Saturday from 20:00). The owner decides which dine-in schedule is right; then edit the three rows under `שעות פעילות` in `index.html` and the `openingHoursSpecification` block near the top of the same file.
2. **Kashrut.** The site says כשר למהדרין, which is what the restaurant says about itself. Listings name בד״ץ. If the owner wants the supervising body named, add it next to the line in the find-us section.
3. **Menu link.** The brief gives https://www.yoko-ono-menu.com/. That address could not be reached from the build environment (its host is outside the session's allowed network), and version 2 had found it lapsed. Every menu button therefore goes to the Wolt page, which carries the full menu with prices. If the menu site is live, replace the three Wolt menu links marked `MENU LINK` in `index.html`.
4. **Events.** The brief allows private-event text only if the owner confirms the restaurant offers them. Nothing about events is on the page. Say the word and a line goes into the find-us section.
5. **Legal pages.** `privacy.html` and `accessibility.html` are drafts written for this build; they describe exactly what the site does (no cookies, no trackers, a click counter that stores no personal data). They are a publication requirement: the owner, or whoever advises them, approves the wording before launch.
6. **Email.** The find-us section and the footer show yokoono.israel@gmail.com. Make sure someone reads it.

## How to change things
- Any text: edit `index.html`. The lines of the walk live in the `.band` blocks inside `#stage`; the experience copy is the `#experience` block.
- A photo: run `python3 -I review/yoko-ono/tools/photos.py` after dropping the stripped source into `review/yoko-ono/photos-raw/` (it writes the 640, 1000, 1600 and full sizes), then reference it in `index.html`. Source photos never enter git.
- The walk: `review/yoko-ono/tools/masters.sh` (tone-map and stabilize the raw clips in `review/yoko-ono/raw/`) then `tools/film.sh` (join, encode, posters). The cut points are documented at the top of `film.sh`.
- Colours and type: the tokens at the top of `assets/site-v3.css`.
- The share image and icons: `node review/yoko-ono/tools/icons.mjs` (renders `review/yoko-ono/og/og.html`).

## Preview
Any local server inside `yoko-ono-site/`, opened in a real browser (Chrome shows scroll smoothness first):
```
python3 -m http.server 8790 -d yoko-ono-site
```
Double-clicking `index.html` shows the still gate photo and the room in its arch instead of the walk (browsers block the video fetch on file:// links). That is the designed fallback, not a bug.

## Test receipts (headless Chromium, local server, a VP9 copy of the film because the test browser cannot decode H.264; 4 November 2026)
`node review/yoko-ono/tools/qa.mjs` and `node review/yoko-ono/tools/legibility.mjs`:
- 60 of 60 checks pass: the walk follows the scroll forward and backward on desktop (1280x800, 1440x900) and phones (iPhone 11 Pro, 375x667); scene C and the settle arrive where the design package says; the arch contracts to 1 at the end; every band holds for 5 or more 120 px flicks; the skip action lands exactly at the end of the walk and moves keyboard focus to the food headline; the rail shows five previews, opens into the drawer with all eleven photographs, closes on Escape and returns focus; the lightbox opens the original file with caption and counter, traps focus, moves with the arrows, closes on Escape and restores focus; on phones the rail is a horizontal strip of eleven, the all-photos button opens the lightbox and a swipe moves to the next photo; the sticky reserve bar waits until the walk is over so it never covers the settle's buttons; reduced motion gives the static page with no video request; reduced motion flipped on and off mid-session re-arms the scrub; video blocked leaves the page complete over the gate poster; no JavaScript shows the poster, the title, the room in its arch and the copy; no horizontal overflow; zero console errors.
- Worst-pixel contrast under every line of the walk, glyphs hidden, measured from the composited page at three moments per band: desktop headlines 13:1 or better, sublines 8.8:1 or better; phone headlines 7.3:1 or better, sublines 6:1 or better (floors 3.5:1 and 4.5:1).
- Copy gate: zero em dashes, zero stock words in all three pages.
- `python3 -I security/guard.py --deploy yoko-ono-site`: 0 high, 0 medium, OK.

Not tested here: a real iPhone or Android device (the environment has no device). The first thing to check on a phone is the walk at the top of the page and the arch at its end.

## Live receipts (measured from the Higgsfield sandbox against https://yoko-ono-raanana.higgsfield.app/, 4 November 2026; this build environment's own network cannot reach that host)
- Every file answers 200: the page, styles, scripts, both walk encodes (4.5 MB and 2.4 MB), posters, share image, logo, fonts, photographs, robots and sitemap. `privacy.html` and `accessibility.html` redirect to `/privacy` and `/accessibility` on this host; both serve.
- A real headless Chromium in the sandbox: desktop profile loaded in 1.4 s, phone profile in 0.9 s; the film decoded (9.77 s), the walk followed the scroll to its last frame and the arch contracted fully at the end, on both profiles. The screenshots of the settle were inspected.
- Assets carry a one-year immutable cache header; the HTML is revalidated on every visit. Security headers come from `_headers` (HSTS, nosniff, referrer policy, a strict Content-Security-Policy merged with the host's own).
- One console message on the live page is the host's own injected viewer script being blocked by that policy. It is not from the site and does not exist on an Apache host.
- The click beacon cannot land on this host (no PHP); it only works on the PHP host, as described below.

## Weights
Page 25 KB, styles 39 KB, scripts 27 KB, the phone frame sequence 2.8 MB, fonts 444 KB total (Hebrew and Latin subsets of Frank Ruhl Libre, Heebo and Cormorant Garamond; only three are preloaded), the walk 4.5 MB on desktop and large phones (720x1280) and 2.4 MB on small phones (540x960), streamed behind the gate poster and a progress ring; photographs 26 to 480 KB each by size; the whole folder 15 MB including the full-size lightbox files.

## The click counter
`assets/site-v3.js` sends `navigator.sendBeacon('api/click.php', e=<event>)` when a visitor uses reserve, menu, delivery, call, directions, Instagram, Facebook, the skip, or opens the gallery. `api/click.php` stores one line per click: the minute (UTC), the event name, and whether the page was in its phone or desktop layout. No IP address, no browser details, no cookie, no identifier. The file is `clicks-YYYY-MM.jsonl` in a `site-leads` folder next to the web root (the same convention as the studio's lead backend), or guarded files under `api/data` if that folder cannot be created. Each month's file is capped at 2 MB. On an unpatched PHP (the PHP2Shell tripwire, same table as `lead.php`) nothing is written. On a host without PHP, such as the preview, the beacon fails silently and the only trace is a network error in the browser console after a click; the site is unaffected. To read the counts: `grep -c '"e":"reserve"' site-leads/clicks-2026-11.jsonl` and so on.

## Hosting
The nonofficial preview runs on the Higgsfield host (a Cloudflare worker serving the static folder; security headers come from `_headers`). The same folder deploys to any Apache host such as Hostinger: upload the CONTENTS of `yoko-ono-site/` including the hidden `.htaccess`, then replace the absolute URLs marked `DEPLOY STEP` in `index.html` (canonical, Open Graph, structured data), plus `robots.txt` and `sitemap.xml`, with the real domain. Before any upload: `python3 -I security/guard.py --deploy yoko-ono-site` must say OK. The click counter only works on the PHP host.

## Higgsfield: inspected, nothing spent
The connector was reachable (490 credits on the account at the time of the build). The footage was inspected frame by frame and the decision was to use it as it is: it is the real restaurant, and the walk reads as a walk. The one operation that could improve it is a video upscale of the 1080x1920 master (`upscale_video`, Topaz at 2160p or ByteDance at 2K, no cost preflight is offered for this tool, so the price is only known when the job is submitted). Honest expectation: little visible gain, because the walk is shown at 506 to 620 px wide inside the desktop doorway and at phone width on phones, both below the 720 px encode already in use. Recommendation: do not spend credits on it. If the owner wants it anyway, the exact steps are: upload `review/yoko-ono/enc/film-master.mp4`, run the upscale, download, then re-run `film.sh` with the upscaled file as the master. No generation of imagery is proposed: every photo and frame on the site is the restaurant's own.
