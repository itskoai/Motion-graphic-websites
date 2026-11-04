# YOKO ONO v4 · handover

Built from `yoko-ono-kit/` only. Folder to deploy: `yoko-ono-v4/` (static, no build step, no dependencies).

## What is in the folder
- `index.html`, `privacy.html`, `accessibility.html`, `robots.txt`
- `.htaccess` (Apache hosts) and `_headers` (Cloudflare Pages): HTTPS only, the studio hardening block, strict CSP with no inline code.
- `assets/hero/frames/` the 181 kit frames and `poster.webp`, untouched.
- `assets/photos/` the 11 kit photos as webp at 800 and 1400 px, metadata dropped. Originals stay in the kit.
- `assets/brand/logo.svg` the kit logo with its fill changed to `currentColor`, plus `favicon.svg`.
- `assets/fonts/` Karantina 700 (display) and Assistant 400/600 (body), self-hosted copies already in this repository.

## The hero
Canvas scroll walkthrough, the way `yoko-ono-kit/hero/demo.html` does it: 500vh section, sticky stage, frame = progress × 180.
Frames 1 to 30 load first, the rest stream in four lanes behind a thin red progress line. Poster until frame 1 draws.
Phones: full-screen cover. Desktop (900 px and wider, landscape): a centred 9:16 column over a blurred, darkened copy of the same frame.
Reduced motion, Save-Data, 2G, no canvas or no JavaScript: poster only, 100vh, headline and buttons still there.

## Switches the owner decides
- **Menu buttons** go to Wolt until the menu site is confirmed. One line in `assets/site.js`: `MENU_SITE_CONFIRMED = false` → `true`.
- **Opening hours** are shown with the line "לפי מערכת ההזמנות. כדאי לוודא בטלפון, במיוחד בחגים." Edit them in `index.html` under "שעות פעילות" once confirmed.
- **Privacy and accessibility pages** are honest drafts (no cookies, no analytics, no forms, nothing collected). Owner to confirm the wording before launch. They carry `noindex`.
- **Private events** are not mentioned anywhere.

## Checks run before this handover
- `python3 -I security/guard.py --deploy yoko-ono-v4` → OK, 0 high, 0 medium.
- Playwright, iPhone 14 viewport: hero at 0, 35, 60, 85 and 100 percent of the scroll; sections; reduced motion; JavaScript off. No console errors, no failed requests.
- Playwright, desktop 1440×900: hero at 0 and 60 percent; sections.
- Scrub timing on the iPhone viewport with all frames loaded: one draw per animation frame.
- Fonts verified loaded with `document.fonts.check` for Karantina and Assistant.

Screenshots: `screenshots/`.

## Before upload
`python3 -I security/guard.py --deploy yoko-ono-v4` must say OK. Upload the folder's contents including `.htaccess`.
