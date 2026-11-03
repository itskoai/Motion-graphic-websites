# YOKO ONO website · handover (3 November 2026)

## Where everything is
| What | Path |
|---|---|
| The website (this folder is what goes online) | `yoko-ono-site/` |
| Page text (Hebrew, real HTML) | `yoko-ono-site/index.html` |
| Styles and script (no build step) | `yoko-ono-site/assets/site.css`, `assets/head.js`, `assets/site.js` |
| Privacy and accessibility pages | `yoko-ono-site/privacy.html`, `accessibility.html` |
| The merged brief (version 2 of the prompt) | `review/yoko-ono/PROMPT.md` |
| Design package (premise, palette, type, band map, copy) | `review/yoko-ono/DESIGN.md` |
| Build and test tools | `review/yoko-ono/tools/` |
| Live preview | https://yoko-ono-raanana.higgsfield.app/ |

## Things only the owner can confirm (before telling customers the site is final)
1. **Hours.** The page shows Sunday to Thursday 12:00 to 23:00, Friday 11:30 to 14:30, Saturday night 20:30 to 23:00, taken from the reservation system. If anything changed, edit the three rows under `שעות פעילות` in `index.html` and the `openingHoursSpecification` block near the top of the same file.
2. **Kashrut.** The site says כשר למהדרין, which is what the restaurant says about itself. Listings name בד״ץ בית יוסף. If the owner wants the supervising body named, add it to the chip in the experience section and to the find-us section.
3. **Menu link.** The old menu site (yoko-ono-menu.com) was found lapsed in the previous build, so every menu button goes to the Wolt page, which carries the full menu with prices. If the restaurant has its own menu page again (a site at yoko-ono.co.il appeared in search results and could not be verified from here), replace the Wolt address in the menu buttons.
4. **Takeaway.** The delivery section says delivery is through Wolt and pickup is by phone. Confirm pickup orders are taken by phone.
5. **Events.** The events section promises only "tell us what you are planning and we will get back to you", by email or phone. Nothing about capacity or packages is claimed.
6. **Email.** Inquiries go to yokoono.israel@gmail.com. Make sure someone reads it.

## What the hero is
The owner's own three phone clips of the walk from the street into the restaurant, tone-mapped from the phone's HDR, stabilized, joined (gate to the first tables, a crossfade into the umbrella room, a crossfade into the lounge at rest), and scrubbed by the visitor's scroll. Nothing in it is generated. The logo was sharpened with an upscaler and traced to a vector; the small "ASIAN KITCHEN" line was re-set in a matching face because the source was too blurry to keep it.

## How to change things
- Any text: edit `index.html`. The Hebrew lines in the hero live in the `.band` blocks.
- A photo: drop a new JPEG into `assets/media/` in three widths (640, 1000, 1600) and update the matching `srcset`.
- The walk: `review/yoko-ono/tools/masters.sh` (tone-map and stabilize) then `tools/film.sh` (join and encode). Raw phone footage is not in git; keep it in `review/yoko-ono/raw/`.
- Colours and type: the tokens at the top of `assets/site.css`.

## Preview
Any local server inside `yoko-ono-site/` and open it in a real browser (Chrome shows scroll smoothness first):
```
python3 -m http.server 8790 -d yoko-ono-site
```
Double-clicking `index.html` shows the still gate photo instead of the walk (browsers block the video fetch on file:// links). That is the designed fallback, not a bug.

## Test receipts (headless Chromium, local server, VP9 copy of the film because the test browser cannot decode H.264)
`node review/yoko-ono/tools/qa.mjs review/yoko-ono/qa` and `node review/yoko-ono/tools/legibility.mjs review/yoko-ono/qa`.
- 43 of 43 checks pass: scrub follows scroll forward and backward on desktop (1280x800, 1440x900) and phones (375x812, 375x667); every caption holds for 5 or more 120px flicks and none is skippable at 360px; zero console errors; no horizontal overflow; the hold builds, eases back on early release and completes; reduced motion gives the static gate with no video request and lights the lanterns; reduced motion flipped on and off mid-session re-arms the scrub; video blocked leaves the page complete over the poster; no JavaScript shows the poster and the static copy; the phone sticky reserve bar appears after the hero.
- Worst-pixel contrast under every hero line, glyphs hidden, measured from the composited page: desktop headlines 11.9:1 or better, sublines 7.2:1 or better; phone headlines 4.3:1 or better, sublines 4.5:1 or better after the scrim was deepened (floors 3.5:1 and 4.5:1).
- Copy gate: zero em dashes, zero stock words.

## Weights
Page 37 KB, styles 33 KB, scripts 15 KB, fonts 260 KB (Hebrew and Latin subsets), hero film 3.8 MB desktop and 2.2 MB phone (streamed behind the poster and the umbrella ring), room loop 0.5 MB, photos 45 to 460 KB each by screen size.

## Live receipts (measured from a cloud sandbox against https://yoko-ono-raanana.higgsfield.app/, 3 November 2026)
- Page: HTTP 200, first byte 0.2 to 0.6 s, fully loaded in 1.0 to 1.6 s in a real Chromium (desktop and phone profiles), the walk playing (video decoded, scrub reaches the last frame at the settle).
- Transfer sizes with the host's compression: styles 7 KB, script 6 KB, fonts 7 to 29 KB each, poster 98 KB, hero film 3.7 MB (streamed behind the poster and the ring; the host has no partial-download support, which is why the film is fetched whole as a Blob).
- Every asset answers 200 with a one-year immutable cache header; the HTML is revalidated on every visit.
- Security headers come from the host (HSTS, nosniff, referrer policy, a strict Content-Security-Policy with script-src 'self' and style-src 'self').
- One console message on the live page is the host's own injected viewer script being blocked by the host's own policy. It is not from the site and does not exist on an Apache host.
- `/robots.txt` on this host is Cloudflare's managed file (search allowed, AI-training crawlers blocked); the site's own `robots.txt` applies on an Apache host. `privacy.html` and `accessibility.html` redirect to `/privacy` and `/accessibility` on this host; both serve.

## Hosting
The live preview runs on the Higgsfield host (a Cloudflare worker serving the static folder; security headers come from `_headers`). The same folder deploys to any Apache host such as Hostinger: upload the CONTENTS of `yoko-ono-site/` including the hidden `.htaccess`, then replace the four absolute URLs marked `DEPLOY STEP` in `index.html`, plus `robots.txt` and `sitemap.xml`, with the real domain. Before any upload: `python3 -I security/guard.py --deploy yoko-ono-site` must say OK.
