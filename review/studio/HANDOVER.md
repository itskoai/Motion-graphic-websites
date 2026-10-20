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

Local test submissions land in a `site-leads/` folder next to `studio-site/` (it carries its own `.gitignore`, so git skips it). To keep them somewhere else, point the server at a throwaway config: `LEAD_CONFIG=/path/to/test-config.php php -S 127.0.0.1:8080`, where that file returns `['LEADS_DIR' => '/tmp/leads-test']`. Delete `site-leads/` before uploading anything.

Tests (headless Chromium, from the repo root). They expect the site at `http://127.0.0.1:8790/` (start `php -S 127.0.0.1:8790` the same way, or set `SITE_BASE=http://127.0.0.1:8080/`), and `CDP_PORT` picks the browser's debugging port when you run several at once. The bundled Chromium cannot play H.264, so the tools swap in `.webm` copies from `review/studio/enc/`; that folder is not in git and is rebuilt by `build_media.py` and `build_media2.py` (which need `review/studio/frames/`, also not in git).
- `node review/studio/tools/qa_states.mjs <outdir>`: hero modes per device, reduced motion, missing media, forms (including double opt-in on a throwaway server), menu, viewer.
- `node review/studio/tools/qa_hero.mjs <outdir> both`, then `python3 -I review/studio/tools/audit.py <outdir>/desktop-report.json` (and `mobile-report.json`): scroll scrub, flick test, text contrast over the video.
- `node review/studio/tools/shots.mjs <outdir> both`: a screenshot tour (`ONLY=<regex>` limits it).

## Put it online (Hostinger or any PHP host). Not done yet: needs your go-ahead and your domain.
1. **Live address.** Find and replace `DEPLOY-DOMAIN` with the real address across `studio-site/` (`index.html` 4 places, `privacy.html`, `accessibility.html`, `sitemap.xml` 3 places).
2. **Form settings.** Copy `studio-site/api/config.sample.php` to `studio-site/api/config.php` and fill at least:
   - `NOTIFY_TO`: the studio mailbox. Every new inquiry is copied there, and `privacy.html` tells visitors so.
   - `MAIL_FROM`: a sender address on your own domain that exists in hPanel (Emails), e.g. `site@your-domain.co.il`, so the copies pass SPF/DKIM and stay out of spam. It is never taken from the visitor's request.
   - `CONTACT_EMAIL`: shown on the error page that visitors without JavaScript get.
   - `SITE_URL => 'https://your-domain.co.il'`. Double opt-in (`CONFIRM_EMAILS => true`) is on by default (in `config.sample.php`, and in `lead.php` when the key is missing) and must stay on: each new list member gets a short mail with a confirm link right away, and `privacy.html` promises that a mailing service only ever gets confirmed addresses. predeploy.sh fails if it is off.
   No secret is needed: `lead.php` creates its own random secret (`.salt`) next to the data on first use. `config.php` is ignored by git and denied to the web.
3. **Real facts** in `assets/config.js`: `contact.email`, `legal.owner` (plus `businessId`, `email`, `address`), `accessibility.coordinator`. See the next section.
4. **Run the check** from the repo root: `review/studio/tools/predeploy.sh`. It only reads files and uploads nothing. It fails while `DEPLOY-DOMAIN` is left, `api/config.php` is missing, points at a temp folder or lacks `NOTIFY_TO`/`MAIL_FROM`, test submissions sit in `api/data`, `contact.email`/`legal.owner`/`accessibility.coordinator` are empty, or `robots.txt` still blocks search engines after the name is marked final. Upload only after it says READY.
5. **Upload** the CONTENTS of `studio-site/` into `public_html/`, including the hidden `.htaccess` files (the hPanel File Manager shows them; some FTP clients hide files that start with a dot). Turn on SSL in hPanel (Security, SSL). The root `.htaccess` then sends every `http://` visit to `https://`.
6. **Check it live.** Open `https://your-domain/api/lead.php` in a browser: it must answer `{"ok":false,"error":"method"}`. If it says `"error":"config"`, `config.php` is broken or the data folder is a temp folder. Then send one inquiry and one list signup from the live site. The success message appears only after the line is saved, and the inquiry copy must reach `NOTIFY_TO` (check the spam folder once).
7. **Daily cleanup (required).** hPanel, Advanced, Cron Jobs, once a day: `php /home/USER/domains/your-domain/public_html/api/lead.php purge`. Inquiries are also purged on every new submission, but only the cron keeps the promises in `privacy.html` (inquiries gone after two years, spam-protection keys gone after a short time) in quiet months. Delete inquiry copies older than two years from the `NOTIFY_TO` mailbox as well (`privacy.html` promises it).

**Where the submissions are.**
- Normally in a `site-leads/` folder next to `public_html/` (outside the web): `inquiry-YYYY-MM.jsonl`, `notify-YYYY-MM.jsonl`, `confirm-YYYY-MM.jsonl`, one JSON object per line. Download them from the File Manager. `ratelimit.json` holds only short-lived keys for spam protection. Keep `.salt`: confirm links stop working without it.
- If the host does not allow that folder, the files go to `public_html/api/data/` with names like `inquiry-2026-10-<16 characters>.php`. Their first line is `<?php exit; ?>` (skip it when reading); in a browser they show an empty page, on purpose.
- Inquiry files are deleted automatically after 24 months. List and confirm files are never deleted automatically.
- **If the form says it is busy.** A monthly file stops at `MAX_FILE_MB` (20 MB, thousands of inquiries), and the site-wide limit `SITE_MAX` pauses the form for a few minutes during a flood. Either way `NOTIFY_TO` gets one short mail ("הטופס באתר דוחה פניות"). To reopen a full month: download that month's file, then rename or delete it on the server, and check whether it is spam.
- **Privacy requests (answer within 30 days, `privacy.html` promises it).** Download the `inquiry-*`, `notify-*` and `confirm-*` files and search for the person's email or phone. To show them their data, send them their lines. To correct or delete an inquiry, edit or delete those lines and upload the file back (in `api/data` files keep the `<?php exit; ?>` first line). To delete a list signup, delete its line from `notify-*` and add the address to `suppress.jsonl` (below), so it is never mailed again. Delete the matching copy in the `NOTIFY_TO` mailbox too.
- A notify row stores the address, `consent_version`, `consent_text` (the server's own copy of the checkbox wording), `consent_at`, `source`, a random `token` and `confirmed: false`. Confirmations are separate lines (`token` and time) in `confirm-*` files.

**Mailing the list (Communications Law, section 30A).**
- Use a mailing tool that puts an unsubscribe link in every mailing. Ask a lawyer to confirm the rest of the format (the word "פרסומת" in the subject line, the sender's name and contact details).
- Mail only rows marked `confirmed` in the export below, and upload only those to a mailing tool. The confirm mail that `lead.php` sends at signup is the "first mail with a confirm link" that `privacy.html` promises; without confirming, nothing more is sent.
- **Suppress list.** Keep a file `suppress.jsonl` on your own computer, next to the downloaded leads (not on the server): one line per removal, e.g. `{"email":"name@example.com","at":"2026-11-02T10:00:00Z"}`. Add every unsubscribe from the mailing tool and every removal request, and never delete lines. It is subtracted on every export, so a removed address is never mailed again.
- **Export.** In the folder with the downloaded `notify-*`, `confirm-*` and `suppress.jsonl` files, run `python3 export.py > list.csv` with this `export.py`. `list.csv` holds one column, `email`, with only confirmed addresses that were not removed, so it can go to a mailing tool as it is (works for both folder layouts):
  ```python
  import csv, glob, json, sys
  def rows(pattern):
      for name in sorted(glob.glob(pattern)):
          for line in open(name, encoding='utf-8'):
              if line.startswith('{'):          # skips the "<?php exit; ?>" first line of api/data files
                  yield json.loads(line)
  confirmed = {r.get('token') for r in rows('confirm-*')}
  suppressed = {r.get('email', '').strip().lower() for r in rows('suppress.jsonl')}
  people = {}
  for r in rows('notify-*'):
      if not r.get('email') or not r.get('token'):
          continue
      p = people.setdefault(r['email'].lower(), {'token': r['token'], 'confirmed': False})
      p['confirmed'] = p['confirmed'] or r['token'] in confirmed
  out = csv.writer(sys.stdout)
  out.writerow(['email'])
  for email, p in people.items():
      if p['confirmed'] and email not in suppressed:
          out.writerow([email])
  ```

## What still needs real information (optional fields are hidden until filled; predeploy.sh insists on the required ones)
- **Studio name.** "OUTFRAME" is a working name. Change it in `config.js` (`brand.name`), in the `<title>` of all three HTML pages, in `og:site_name` and `og:title` in `index.html`, and in `"name"` in the JSON-LD block of `index.html`. predeploy.sh fails while any of them still shows a different name. While it is a working name, search engines are asked not to index the site (`robots.txt` has `Disallow: /`, `index.html` has a noindex robots tag). When the name is final: set `brand.isWorkingName: false`, switch `robots.txt` to the Allow and Sitemap lines written in its comment, and the robots tag to `index,follow`. predeploy.sh fails if these disagree.
- **Contact (required: email).** `config.js → contact`: email (shown under the inquiry form with a copy button, and on the privacy and accessibility pages), phone (under the inquiry form and on the accessibility page), WhatsApp (a `https://wa.me/...` link: a WhatsApp button in the phone contact bar and a line under the inquiry form, opening a chat with "היי, הגעתי מהאתר שלכם. אפשר לדבר על פרויקט?" ready to send). Each line stays hidden while its value is empty. Put the same email in `api/config.php → CONTACT_EMAIL`.
- **Answers only you can give** (optional, `config.js`). `contact.replyNote` (how fast you usually answer) and `contact.firstStep` (what your first reply includes) appear under the send button. `faq.price`, `faq.turnaround` and `faq.ownership` add the questions "כמה זה עולה?", "כמה זמן זה לוקח?" and "ושל מי הדמות בסוף?" to the "לפני שאתם שואלים" scene. Each stays hidden until you write it; write only what you really keep to.
- **Your social page** (`config.js → socials`). Besides the footer links, the first filled link appears after someone sends the inquiry form ("אפשר לראות מה אנחנו יוצרים כל יום בעמוד שלנו").
- **Legal owner (required: owner).** `config.js → legal`: `owner` (the legal name of the business or of the person running it), `businessId` (ע.מ. or ח.פ.), `email` for privacy requests (falls back to `contact.email`, then to the contact form), `address`. `privacy.html` then shows "בעל השליטה במידע: ...".
- **Accessibility contact (required).** `config.js → accessibility.coordinator`, e.g. a name and a phone number, shown as "לפניות בנושא נגישות: ...". Plus a check by a certified accessibility tester when possible.
- **Mailboxes.** A studio mailbox for `NOTIFY_TO` and a sender address on the domain for `MAIL_FROM`.
- **Consent wording.** The checkbox label is "כן, שלחו לי עדכונים והכרזות במייל, כולל דברי פרסומת. אפשר לבטל בכל רגע." (`LEAD_CONSENT` `v1` in `api/lead.php`). To change it, change all of these together: the two checkbox labels and the two hidden `consentText` inputs in `index.html`, and add the new text to `LEAD_CONSENT` as `v2` (keep `v1`, older signups point to it). The page sends the hidden text, so a label changed on its own would leave the wrong wording in the consent record; predeploy.sh fails until all of them match.
- **Social links** (`config.js → socials`), the page where "דור העתיד" lives (`projects.series.url`), the merch site's live address once it is online (`projects.merch.url`).
- **Founders:** names, roles, and real photos (`config.js → founders`). Until then the two panels show light, labelled צד א׳ / צד ב׳. No generated portrait is used.
- **Privacy:** confirm what `privacy.html` now promises (inquiries kept up to two years, deleted automatically on the server and by you in the mailbox; list until removal, then only the address, the consent details and the removal date; first mail carries a confirm link) and have a lawyer read it once.
- **Domain** and hosting account for the deploy.
- **Your sign-off on the content** (from `ASSET-MANIFEST.md`): the AI-made cars in the reel and in "דור העתיד" look like real production cars, so please confirm you are comfortable showing them; please confirm the puff-print pattern on the merch sets is yours to use. Optional: final-resolution "דור העתיד" clips to replace the 480p drafts in the reel.

## Decisions made on the way (and why)
- **Video model:** MiniMax H3 at 2K instead of Seedance 2.5, to stay inside your 100-credit cap. Total spent: 57.25 credits.
- **Phones get a real scrub too.** The skill's default is a still image on phones; this build gives phones a 68-frame portrait sequence drawn on a canvas (smooth and reversible on iOS, no video seeking). Landscape phones, reduced motion and data-saver visitors get the composed still.
- **No per-clip approval stop.** You said "just run it", so I generated, checked each clip myself, and kept going.
- **Portfolio is only your own work.** The series reel comes from your existing "דור העתיד" clips (two shots with brand-like marks were cut); the merch section uses your merch website and its product images.
- **The SC 02 storyboard is drawn in code**, not generated, so it draws itself line by line as you scroll and costs no credits.

## Session notes
- The container could not download from the Higgsfield CDN, so footage came across as frame tiles. Allowing `d8j0ntlcm91z4.cloudfront.net` and `upload.higgsfield.ai` in this environment's network settings would make future rebuilds simpler.
- The heavy working files (frames, test encodes) are not committed. `review/studio/tools/build_media.py` and then `build_media2.py` rebuild every media file and the test encodes from `review/studio/frames/`.
