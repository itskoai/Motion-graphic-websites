# YOKO ONO v4 · handover

Built from `yoko-ono-kit/` only. Folder to deploy: `yoko-ono-v4/` (static, no build step, no dependencies).

## What is in the folder
- `index.html`, `privacy.html`, `accessibility.html`, `robots.txt`
- `.htaccess` (Apache hosts) and `_headers` (Cloudflare Pages): HTTPS only, the studio hardening block, strict CSP with no inline code.
- `assets/hero/frames-mobile/` and `assets/hero/frames-desktop/` (172 frames each) plus the two posters, copied from `yoko-ono-kit/hero-v2/` untouched.
- `assets/photos/` the 11 kit photos as webp at 800 and 1400 px, metadata dropped. Originals stay in the kit.
- `assets/brand/logo.svg` the kit logo with its fill changed to `currentColor`, plus `favicon.svg`.
- `assets/fonts/` Karantina 700 (display) and Assistant 400/600 (body), self-hosted copies already in this repository.

## The hero (v2, 4 November 2026)
Canvas scroll walkthrough from `yoko-ono-kit/hero-v2/`, the way its demo does it: 500vh section, sticky stage, frame = progress × 171. Full screen on phones and desktop (object-fit cover). No column, no blurred side panels.
Two frame sets, 172 frames each: a portrait viewport loads `frames-mobile` (720×1280), a landscape viewport loads `frames-desktop` (1280×720). Only the current set is fetched; a rotate swaps sets. Frames 1 to 30 load first, the rest stream in four lanes behind a thin red progress line, and a frame that fails with a transient host error is retried twice. The matching poster shows until frame 1 draws.
Captions by scroll progress: "סושי. מנות חמות. קוקטיילים." on the street (0 to 20 percent), "נכנסים." at the door (20 to 30), "הגעתם. שבו." in the dining room (40 to 70), "השולחן שלכם מחכה." while the waiter serves (85 to 100). The booking button stays pinned the whole walk.
Reduced motion, Save-Data, 2G, no canvas or no JavaScript: poster only, 100vh, headline and buttons still there.

## Cache rule (4 November 2026)
Everything under `assets/` is served with a one-year immutable cache, so a file that changes must change its name: `site-v6.js`, `site-v6.css`, `head-v6.js` today, `-v7` next time, with the three references in `index.html`, `privacy.html` and `accessibility.html` updated. The pages themselves are `no-cache` (in `_headers` for the Higgsfield host and `.htaccess` for Apache), so a returning phone always fetches the fresh HTML and the new file names. The first hero v2 deploy broke this rule and froze the walk on phones that had cached the old script.

## The palm sign (4 November 2026)
Right after the hero: the carved palm sign from `yoko-ono-kit/palm-sign/` as the "choose your way" element, replacing the earlier restaurant / street sushi list. The left leaves (מסעדה, שירות מלא) link to Ontopo, the right leaves (סטריט סושי, שירות עצמי) to Wolt. A light sweep crosses the lettering once when the sign is 60 percent on screen; a tap glows that side red and leans the sign, then the link opens in the same tab after 420 ms. Hover and keyboard focus show the glow. Reduced motion: no sweep, no lean, the link opens at once. Two pill buttons under the sign are the plain fallback. Hotspot and glow positions are the kit's and must not change.

## The Japanese evening background (4 November 2026)
`assets/ambient-v7.css` and `assets/ambient-v7.js` are copied from `yoko-ono-kit/ambient/` unchanged and linked in `index.html` right after the site stylesheet and the site script. The script builds the layer before the palm sign section: gold paper umbrellas, red lantern light and hanging lanterns at the page edges behind every section after the hero, with depth parallax on scroll, paused off screen and in hidden tabs, static under reduced motion. Positions, opacities and timings live only in those two files; change them there, in the kit first.

## המגרש v9 and the food belt (5 November 2026)
The games section is `yoko-ono-kit/games-v9/`, files unchanged, between the experience section and the directions, with the nav link "המגרש". No photos: a night pitch with chalk lines and floodlights drawn in code, an LED scoreboard "יוקו אונו 0 : 0 אתם" with a ticker, the dice table rebuilt from wood and felt with the real vector logo in gold (`assets/brand/logo.svg`), two 3D dice with fair rolls via crypto, and three line-icon cards: מסך גדול, שולחן כדורגל, שולחן קוביות. Every double on the site adds 1 to "אתם" with a pulse, a red flash and confetti. It is a site score only: no prize, discount or rules anywhere, and none may be added without the owner. The v8 files and the two stills under `assets/games/` are gone. The conveyor script (v8, unchanged) still turns the menu photos into plates on a moving belt: hover or touch stops it, a tap opens the photo large, Escape closes, reduced motion gives a static strip.

## Fresh theme, events and members' club v10 (6 November 2026)
From `yoko-ono-kit/fresh-v10/`, exactly as its README says. `fresh-v10.css` is the daylight theme (rice paper, indigo ink, sea glass, red for actions only, the logo's waves at section ends and the footer edge) and MUST stay the last stylesheet; the hero walk keeps its night palette. `events-v10.css` plus the `#events` section (after `#games`, before `#visit`): the van drives to the red pin and the market table's plates drift, started by `club-v10.js` when each card enters. Nav link "אירועים" after "המגרש". `theme-color` is now `#f6f1e7`.
The members' club: `club-v10.js` builds a small "מועדון יוקו" button (bottom corner, rises above the phone booking bar) that opens a panel. Every word of the panel comes from `assets/club.json`: `button`, `title`, `intro`, `perks` (list), `terms` (list), `cta_label`, `cta_link`. Empty fields are hidden, and `cta_link` only works with https:, tel: or mailto:. To change the panel, edit `club.json`, run the guard and redeploy; nothing else needs touching. No signup form: that needs consent text and a privacy update first.
Facts used: events that come to the client, market tables, events WhatsApp = the site's phone (wa.me/972779386192), all from BUSINESS-INFO.md. No prices, sizes, menus or club rules.
Beyond the README: `fresh-v10.css` was also added to `privacy.html` and `accessibility.html` (after `site-v6.css`) so the draft inner pages match the light theme when opened from the footer. Remove that one line on each page if the owner prefers.
Checked locally and on the live link at iPhone 13 and 1440×900: zero console errors, no horizontal overflow, the panel opens and closes, the van and plates animate.

## Breeze v11 (6 November 2026, evening)
`breeze-v11.css` from the same kit folder, linked right after `fresh-v10.css` as the LAST stylesheet: yuzu yellow in small accents only (kicker dash, club star and panel bar, the route's start pin, one plate rim on the belt, the visit-row underline, a sun glow in the closing section, text selection; buttons stay red) and a gust animation on the background umbrellas and lanterns, off under reduced motion. The kit's updated events stylesheet (the van now stops just before the red pin) is served as `assets/events-v11.css`, byte for byte the kit's `events-v10.css`, because of the cache rule above: a changed asset gets a new name, or phones keep the old one for a year. `events-v10.css` was removed from the site.

## Switches the owner decides
- **Menu buttons** go to Wolt until the menu site is confirmed. One line in `assets/site-v6.js`: `MENU_SITE_CONFIRMED = false` → `true`.
- **Opening hours** are shown with the line "לפי מערכת ההזמנות. כדאי לוודא בטלפון, במיוחד בחגים." Edit them in `index.html` under "שעות פעילות" once confirmed.
- **Privacy and accessibility pages** are honest drafts (no cookies, no analytics, no forms, nothing collected). Owner to confirm the wording before launch. They carry `noindex`.
- **Private events** are not mentioned anywhere.

## Photos carry no captions (owner's decision, 4 November 2026)
No visible caption and no hairline on any photo. Alt texts are general descriptions without dish names ("מנה במסעדת יוקו אונו", "קוקטייל בבר של יוקו אונו"). Nothing was put in place of the captions. The photos themselves are unchanged.

## Checks run before this handover
- `python3 -I security/guard.py --deploy yoko-ono-v4` → OK, 0 high, 0 medium.
- Playwright, iPhone 14 viewport: hero at 0, 35, 60, 85 and 100 percent of the scroll; sections; reduced motion; JavaScript off. No console errors, no failed requests.
- Playwright, desktop 1440×900: hero at 0 and 60 percent; sections.
- Scrub timing on the iPhone viewport with all frames loaded: one draw per animation frame.
- Fonts verified loaded with `document.fonts.check` for Karantina and Assistant.

Screenshots: `screenshots/`.

## Live preview (4 November 2026)
https://yoko-ono-v4.higgsfield.app/ on the Higgsfield host, the same way v3 was deployed: the folder's contents sit in `app/public/` of the host's template repo, the og title, description, image and favicon are set in `app/src/app-meta.json`, then deploy and publish. v3 at https://yoko-ono-raanana.higgsfield.app/ is untouched.

Measured from the Higgsfield sandbox against the live URL in a real Chromium (this cloud environment cannot reach higgsfield.app):
- Page, script, frames, fonts and both inner pages answer 200. Frames carry a one-year immutable cache header.
- Security headers come from the host and include the site's own strict Content-Security-Policy (script-src 'self', style-src 'self').
- iPhone profile: the walk is live 5.7 s after navigation with all 181 frames loaded; captions at 0, 35, 60, 85 and 100 percent are the right ones. Desktop profile: the column mode is on.
- One console message on the live page is the host's own injected viewer script being blocked by the site's policy. It is not from the site and does not exist on an Apache host.

To update the preview after a change: `python3 -I security/guard.py --deploy yoko-ono-v4`, copy the folder's contents into `app/public/` of the host repo, commit, push, deploy.

## Before upload
`python3 -I security/guard.py --deploy yoko-ono-v4` must say OK. Upload the folder's contents including `.htaccess`.
