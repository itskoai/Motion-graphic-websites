# הטרנינג של יובל ואיתי: handover notes

Site folder: `yuval-itay-set/` (one `index.html` plus `assets/`). Everything in `review/` is working material and never ships.

## Preview

- Full scroll preview (the hero video scrubs with the scroll): run any local server inside `yuval-itay-set/` and open it in a real browser, for example `npx http-server` or `python3 -m http.server 8080`, then open http://localhost:8080/ (Chrome shows scroll smoothness best; check the top and bottom of the hero).
- Double-clicking `index.html` shows the designed still-image hero instead of the video (browsers block the video fetch on file:// links). That is the intended fallback, not a bug.
- Phones and portrait tablets always get the still-image hero (the night street photo) by design.

## Before going live: three things only you can set

1. **Where buy buttons go.** Open `assets/site.js`; the first lines hold:
   `const SHOP = { url: '', whatsapp: '', form: '' };`
   - `url`: your shop or checkout link. Every "להזמנה" button opens it, and the order form is replaced by one big order button.
   - `whatsapp`: your number, digits only, international form (9725XXXXXXXX). Buy buttons open WhatsApp with the chosen color and size pre-filled.
   - `form`: a form service endpoint (for example Formspree) if you want the "send me a link" form to really deliver.
   With all three empty the page is in preview mode: the form shows its thank-you message and the message goes nowhere. Do not publish in that state.
2. **Hosting.** The site is plain static files, ready for Hostinger's one-command deploy (zip the contents of `yuval-itay-set/`, not the folder). The `<!-- DEPLOY STEP -->` comment in `index.html` marks the two og tags to patch with the live address before zipping.
3. **Network allowance for future builds (optional).** This cloud environment blocked `d8j0ntlcm91z4.cloudfront.net` and `upload.higgsfield.ai`, so every generated image and video had to be pulled through the Higgsfield sandbox frame by frame. Adding those two hosts under the environment's Allowed domains makes the next build much faster.

## Promises in the copy that you should confirm or soften

- Fit guide by height (S to XXL) in the sizes section, and the line that a full cm table arrives before the first shipment.
- "נשלח מהארץ עם מעקב" and the exchange answer in the FAQ.
- "רק פה. אין אתר אחר. הלינק היחיד הוא בביו של יובל ואיתי."
- No price is shown (your choice); the FAQ says the price appears at checkout.
- Kids' sizes are not claimed anywhere. Add them if the supplier has them.

## Honesty line

The lookbook photos are the series' cloud version of the suit; the product photos (hero, color cards, macro, steps) were generated from your AliExpress photos and show the real puff-print lettering. The page says so under the lookbook and in the FAQ. The footer discloses that the photos of the boys are AI generated.

## Test receipts (headless Chrome, local server)

- Scrub: the video time follows scroll from 0 to 6.04 s across the 500vh hero; bands switch at the planned ranges; zero console errors at 1280, 1440, 1920, 375x812 and 375x667.
- Flick test: at 120px wheel steps every caption holds full opacity for 5 to 8 steps; no caption is skippable at 360px steps.
- Worst-frame legibility (text hidden, lightest pixel under each caption box, real video frames): band 1 5.3:1, band 2 4.1:1, band 3 4.3:1, settle 4.4:1 (floor 3.5:1).
- Static-hero gates: portrait tablet and landscape phone get the still hero and never request the video; rotating to landscape re-arms the scrub live.
- Reduced motion flipped on mid-session pins the hold and the drawn line; flipped off re-arms the scrub.
- Video blocked: the page stays complete over the poster with the settle copy visible.
- Press-and-hold builds, eases back on early release, completes at 1.4 s.
- Form validation, success state, the side sort, the turnaround dots and all anchors work.
- Copy gate: zero em dashes, zero stock words.

Weights: page 27 KB, styles 31 KB, script 21 KB, hero video 4.5 MB (streamed behind the ring), photos 215 to 447 KB each.

Note on the test browser: the bundled Chromium has no H.264 decoder, so the tests swap in a VP9 copy of the same frames (`review/hero-scrub-test.webm`). Real Chrome, Safari, Edge and Firefox play the shipped MP4.

## Where the files came from

- Hero video: Kling 3.0 take, reversed so the scroll descends onto the suits (raw takes stay in the Higgsfield library).
- Hero resting frame, color cards, macro, step stills: GPT Image 2.5 with your two AliExpress photos as references.
- Lookbook, faces, turnarounds: the series' own Itay and Yuval generations from the Higgsfield history.
