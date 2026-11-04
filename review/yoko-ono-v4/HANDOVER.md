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
