# Two additions: המגרש (the games corner + a playable dice table) and the food conveyor belt

## 1. המגרש (games corner)
- games-section.html: the section markup. Paste it into yoko-ono-v4/index.html right after the #experience section, before #visit.
- games-v8.css, games-v8.js → yoko-ono-v4/assets/. Link the CSS after the other stylesheets and the script after the other scripts.
- dice-table.webp, games-corner.webp → yoko-ono-v4/assets/games/. Real stills from the owner's footage: the dice table seen from above (green felt, gold YOKO ONO ASIAN KITCHEN logo), and the corner with the foosball table, the screen and the grass.
- The dice: two real 3D dice thrown across the photo of the restaurant's own table. Fair rolls via crypto, so a double comes up 1 time in 6, same as the real table. On a double, red and gold confetti and "דאבל! עכשיו תנסו את זה על השולחן האמיתי."
- IMPORTANT: no prize, discount or rules anywhere. The owner hasn't confirmed them. Don't add any.
- Copy states only what exists: a big screen for watching games, a foosball table, our own dice table.

## 2. Food conveyor belt
- conveyor-v8.css, conveyor-v8.js → yoko-ono-v4/assets/. No HTML change: the script turns the existing .grid-food photos into small round plates riding a kaiten-zushi belt (plates with red, gold, blue and black rims, a moving track).
- Hover or touch stops the belt. Tap, click or Enter opens the photo large; Escape or tap outside closes it. Reduced motion: a static strip you can swipe.

Tested together on the v4 site at iPhone 13 and 1440×900: zero console errors, 30 test rolls looked fair, and the large view opens and closes.
