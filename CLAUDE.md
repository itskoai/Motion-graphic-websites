# Studio rules for every build in this repository

The owner is not a security specialist. Safety is the default, not a feature to ask for. Apply these rules to everything you build here (websites, scripts, forms, automations) without being asked, and say plainly when a request would break one.

## Never publish private information
- No passwords, API keys, tokens or private keys in any file. Secrets live on the server (`api/config.php`, host environment variables, GitHub Actions secrets), never in code, never in `site.config.ts`, never in a commit message.
- No personal data of the owner, their family, customers or anyone else in code, content, test fixtures or screenshots: no home address, ID numbers (ת.ז), bank details, card numbers, private phone numbers or private emails. Use obvious fakes in tests (050-555-01xx, name@example.com).
- No real children's faces or names on any page. The series characters are AI-made and are always labelled as such.
- Photos go online only after their hidden location data is removed: `python3 -I security/strip_photo_location.py FILE`.
- Customer form submissions stay outside the web root and are never committed (`site-leads/`, `*.jsonl`, `api/config.php`, `.salt`).

## Every commit, push and upload passes the guard
- The git hooks in `.githooks/` run `security/guard.py` (enable once per clone: `git config core.hooksPath .githooks`). Never bypass them with `--no-verify`.
- Before any upload: `python3 -I security/guard.py --deploy <folder>` must say OK.
- GitHub runs `.github/workflows/security.yml` on every push. A red security check blocks deploy.
- Allowlisting a finding needs a real check and a dated note in `security/allowlist.json`.

## Build safe by default
- Websites: static where possible. Every deployed folder carries the hardening in `security/htaccess-hardening.conf` (HTTPS only, security headers, Content-Security-Policy, hidden files denied). A new outside service must be added to the CSP on purpose.
- Forms: server-side validation, honeypot plus timing check, rate limiting, success only after the data is saved, double opt-in for mailing lists, consent text stored with each signup, retention limits that match the privacy page. Reuse `site/public/api/lead.php` rather than writing a new backend.
- PHP: never `eval`, shell commands, `unserialize` or `include` on visitor input; prepared statements only; errors never shown to visitors. The form backend refuses to store data on a PHP version with a known critical flaw (`lead_php_patched`); update the version table there when PHP publishes a new security release.
- JavaScript: no `eval`, no `innerHTML` with user or URL input, no third-party scripts, trackers or analytics without the owner's explicit decision (and a privacy page update first).
- Dependencies: pin versions, keep `npm audit --omit=dev` at zero high or critical, prefer the standard library over a new package.
- Logins (if ever added): a managed provider with two-factor, never home-made password storage.

## Tell the owner
When something needs their action (a server upgrade, a leaked password to change, a setting at the host), say it first, in plain words, with the exact step.
