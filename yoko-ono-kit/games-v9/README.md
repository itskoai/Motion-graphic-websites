# המגרש v9: night pitch, LED scoreboard, and a dice table rebuilt in code

Replaces the v8 games section. No photos: the low-resolution stills are gone. Everything is drawn in code, so it stays sharp on every screen:
- Background: a night football pitch (mown stripes, chalk lines, two floodlight glows) that fades into the page's black at top and bottom.
- LED scoreboard: "יוקו אונו 0 : 0 אתם", with a ticker that runs "מסך גדול למשחקים · שולחן כדורגל · שולחן קוביות". Each double on the site adds 1 to "אתם", with a pulse and a red flash. A site score only, no prize.
- The dice table: wood frame with grain and a handle, green felt with a fine texture and light, the restaurant's real vector logo (assets/brand/logo.svg) in gold, a glass sheen, and a slight 3D tilt. Two 3D dice thrown from the near edge, fair rolls via crypto.
- Three cards with animated line icons: מסך גדול, שולחן כדורגל, שולחן קוביות.
- No prize, discount or rules anywhere.

Install:
1. In yoko-ono-v4/index.html, replace the whole current <section ... id="games"> with games-section.html.
2. Copy games-v9.css and games-v9.js into yoko-ono-v4/assets/. In index.html, swap the links from games-v8 to games-v9.
3. Delete assets/games-v8.css, assets/games-v8.js and assets/games/ (no longer used). The logo is already at assets/brand/logo.svg.
Tested at iPhone 13 and 1440×900: zero errors, no horizontal overflow, the double fires the scoreboard.
