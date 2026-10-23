# Studio site · Next.js

The studio's website: Hebrew, RTL, one page of eight scenes built on the "דרך האות" direction (see `DIRECTION.md`). Static export: the build is a folder of files that runs on any host.

## Run
```
cd site
npm install
npm run dev          # http://localhost:3000
```
Lab routes (one scene each, used while building; removed from the export by `npm run build:clean`): `/lab/hero/`, `/lab/create/`, `/lab/story/`, `/lab/work/`, `/lab/creators/`, `/lab/process/`, `/lab/coming/`, `/lab/final/`.

## Build and deploy
```
npm run build        # writes ./out (static)
```
Upload the CONTENTS of `out/` to the host's web root (Hostinger `public_html/`, Netlify, S3+CDN, any static host). The contact and notify forms post to `site.config.ts → forms.endpoint` (default `/api/lead.php`, shipped in `public/api`): on a PHP host copy `public/api/config.sample.php` to `api/config.php` and fill it (see `../review/studio/HANDOVER.md` for the backend's full instructions: mailboxes, double opt-in, cleanup cron). On a host without PHP, point `forms.endpoint` at a form service that answers `{"ok":true}` only after saving, or leave it empty: the forms then show the honest "did not send" state with the direct contact lines from the config.

## What to fill before going live (`site.config.ts`)
brand.name (working name "OUTFRAME"; search engines are asked not to index while `isWorkingName` is true), contact (email, phone, WhatsApp), founders (names, roles, real portrait photos: never generated faces), socials, projects urls, legal owner and accessibility contact, siteUrl.

## Structure
- `app/` layout, page (the eight scenes in order), `privacy/`, `accessibility/`, `lab/*`
- `components/scenes/` one file + one CSS module per scene
- `components/window/LetterWindow.tsx` the signature primitive (media inside a letter; the roof zoom)
- `components/ui/` Nav, Viewer (video dialog), Rule (the ballpoint rule)
- `lib/` gsap registration, scene progress + material state, motion mode, frame sequences, glyph outlines
- `content/he.ts` every visible Hebrew string · `site.config.ts` every fact that needs confirming
- `public/media` the studio's own footage and stills · `public/fonts` self-hosted fonts · `public/api` the PHP lead backend
- `tools/` screenshot and scroll-check scripts (Playwright), glyph extraction

## Checks
```
npm run typecheck && npm run lint
node tools/shot.mjs --url http://127.0.0.1:3000/ --to "#story" --progress 0.5 --out /tmp/story.png
node tools/scrollcheck.mjs --url http://127.0.0.1:3000/ --mobile
```
