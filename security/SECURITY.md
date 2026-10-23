# Your safety system: what it does and what you do

## What runs automatically now
| Where | What it stops |
|---|---|
| Every commit on this computer (`.githooks/pre-commit`) | Passwords, API keys, ID numbers, card numbers, bank accounts, customer data files, GPS-tagged photos, dangerous code. The commit is refused until fixed. |
| Every push (`.githooks/pre-push`) | The same check over the whole repository, the last stop before anything reaches GitHub. |
| GitHub, every push and every Monday (`.github/workflows/security.yml`) | The same scan, a vulnerability audit of the website's dependencies, a syntax check of the form backend. |
| The live website (`.htaccess`) | HTTPS only, security headers, a strict Content-Security-Policy, no framing (clickjacking), hidden and backup files never served. |
| The contact forms (`api/lead.php`) | Refuse to store customer data on an unpatched PHP (the PHP2Shell flaw), plus the existing bot gate, rate limit and data retention. |
| Every future build by Claude here (`CLAUDE.md`) | The rules above are applied by default. |

Before uploading anything: `python3 -I security/guard.py --deploy site/out` (or `studio-site`). It must say OK.

## Do this week: the PHP flaw from the post you saw (PHP2Shell)
1. In Hostinger: hPanel → Websites → your site → Advanced → PHP Configuration. Choose PHP **8.4 or 8.5**, then check the exact version shown. It must be at least **8.5.12, 8.4.27, 8.3.36 or 8.2.35**. Anything 8.1 or older gets no fix: move off it.
2. Any other site you run (WordPress included): updating WordPress alone does not fix this. The server's PHP must be updated.
3. After going live, open `https://your-domain/api/lead.php` in a browser. `{"ok":false,"error":"method"}` is good. `{"ok":false,"error":"php"}` means the server is still unpatched: ask the host to upgrade before collecting any inquiries.

## Do once: you and your family (no code can do these for you)
1. **Password manager** for everyone in the family (Bitwarden, 1Password or Apple Passwords). One long master password each, every other password generated and unique.
2. **Two-step login with an authenticator app**, not SMS, on email, bank, Instagram, TikTok, WhatsApp (Settings → Account → Two-step verification), Google/Apple, Higgsfield, GitHub, Hostinger. Email first: whoever controls your email can reset everything else.
3. **Check for leaked passwords**: haveibeenpwned.com for each family email. Change any password that shows up, everywhere you reused it.
4. **Phone number lock**: ask your mobile carrier for a SIM-swap protection code or PIN on each family line, so nobody can move your number to their SIM.
5. **Google "Results about you"** (myactivity.google.com/results-about-you): ask Google to remove search results showing your phone, address or email.
6. **Kids' accounts**: private profiles, no school name, no home area, location sharing off in camera and social apps. Photos posted publicly: strip location first (`security/strip_photo_location.py`).
7. **Business separation**: a business email and phone number for the studio (the website shows only these), never the private ones.
8. **Messages that create urgency** ("your account will be closed", "pay this invoice", a "family member" on a new number asking for money): stop, call back on a number you already know.

## If something leaks
Change the password (or rotate the key) first, then remove it from the code. Removing a secret from the latest commit does not erase it from git history: tell Claude, and the key will be rotated and the history cleaned.
