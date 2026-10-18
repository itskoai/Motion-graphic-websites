# Handover · OUTFRAME studio website

## Where everything is
| What | Path |
|---|---|
| The website (this folder is what gets uploaded) | `studio-site/` |
| Everything you can edit without touching code | `studio-site/assets/config.js` |
| Page text (Hebrew, real HTML) | `studio-site/index.html` |
| Privacy policy / accessibility statement | `studio-site/privacy.html`, `studio-site/accessibility.html` |
| Form backend (stores every submission) | `studio-site/api/lead.php` (+ `api/config.sample.php`) |
| Approved Hebrew copy deck (with English glosses) | `review/copy-deck.json` |
| Asset provenance, prompts, credit ledger | `review/studio/ASSET-MANIFEST.md`, `review/studio/ASSET-PROMPTS.txt` |
| Design package (palette, type, band map, scenes) | `review/studio/DESIGN.md` |
| Build and test tools | `review/studio/tools/` |
| Private preview on claude.ai | https://claude.ai/artifact/TKT9kRSeRKhAJHsiuqaRPm |

## Run it locally
The forms need PHP (any PHP 8). From the repo root:
```
cd studio-site && php -S 127.0.0.1:8080
```
Open http://127.0.0.1:8080. Without PHP (a plain static server) the site works, but the forms will honestly say the message did not go through.

## Put it online (Hostinger or any PHP host). Not done yet: needs your go-ahead and your domain.
1. Replace `DEPLOY-DOMAIN` with the real address in `index.html` (canonical, og:url, og:image, twitter:image), `privacy.html`, `accessibility.html`, `robots.txt`, `sitemap.xml`. Set `siteUrl` in `assets/config.js`.
2. Copy `api/config.sample.php` to `api/config.php`. Put a long random string in `HASH_SALT`. Optional: `NOTIFY_TO` with your email for an alert on every new submission.
3. Upload the CONTENTS of `studio-site/` into `public_html/`. Make sure HTTPS is on (Hostinger: SSL in hPanel).
4. Submissions are written to a `site-leads/` folder created next to `public_html/` (outside the web). Download them from the File Manager. Each line is one JSON record. If the host does not allow that folder, they go to `public_html/api/data/` instead, which is closed by `.htaccess`; check that `https://your-domain/api/data/ratelimit.json` returns 403.
5. Test both forms on the live site. A success message only appears after the line is saved.
6. When you send the first announcement, use a mailing tool with an unsubscribe link in every email (required by section 30A of the Communications Law), and import only people with `"consent": true`.

## What still needs real information (all optional fields are hidden until filled)
- **Studio name.** "OUTFRAME" is a working name. Change it in `config.js` and in the `<title>`/meta tags of the three HTML pages.
- **Contact:** email, phone, WhatsApp (`config.js → contact`). Without an email, the inquiry form's "write to us directly" line stays hidden.
- **Social links** (`config.js → socials`), the page where "דור העתיד" lives (`projects.series.url`), the merch site's live address once it is online (`projects.merch.url`).
- **Founders:** names, roles, and real photos (`config.js → founders`). Until then the two panels show light, labelled צד א׳ / צד ב׳. No generated portrait is used.
- **Accessibility contact** (`config.js → accessibility.coordinator`), and a check by a certified accessibility tester when possible.
- **Privacy:** confirm the retention periods written in `privacy.html` (inquiries up to two years, list until removal) and have a lawyer read it once.
- **Domain** and hosting account for the deploy.

## Decisions made on the way (and why)
- **Video model:** MiniMax H3 at 2K instead of Seedance 2.5, to stay inside your 100-credit cap. Total spent: 57.25 credits.
- **Phones get a real scrub too.** The skill's default is a still image on phones; this build gives phones a 68-frame portrait sequence drawn on a canvas (smooth and reversible on iOS, no video seeking). Landscape phones, reduced motion and data-saver visitors get the composed still.
- **No per-clip approval stop.** You said "just run it", so I generated, checked each clip myself, and kept going.
- **Portfolio is only your own work.** The series reel and two stills come from your existing "דור העתיד" clips; the merch section uses your merch website and its product images.

## Session notes
- The container could not download from the Higgsfield CDN, so footage came across as frame tiles. Allowing `d8j0ntlcm91z4.cloudfront.net` and `upload.higgsfield.ai` in this environment's network settings would make future rebuilds simpler.
- The heavy working files (frames, test encodes) are not committed. `review/studio/tools/build_media.py` rebuilds every media file from `review/studio/frames/`.
