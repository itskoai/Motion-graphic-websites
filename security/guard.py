#!/usr/bin/env python3
"""
GUARD: the studio's leak and safety scanner. Stops sensitive information from leaving through anything we build.

What it catches before a commit, a push or an upload:
  HIGH (blocks):   private keys, API tokens (AWS, GitHub, Google, Stripe, OpenAI, Anthropic, Slack, Higgsfield-style),
                   passwords written into code, credit-card numbers, Israeli ID numbers, Israeli IBANs,
                   secret files (.env, config.php, database dumps, backups, form-submission data),
                   dangerous PHP (eval, shell commands, unserialize or include driven by visitor input),
                   photos that carry GPS location (they reveal where you live or work).
  MEDIUM (warns):  phone numbers and email addresses that are not on the allowlist, source maps in a deploy folder,
                   missing security headers in a deploy folder.

Usage:
  python3 -I security/guard.py --staged         files staged for commit (the pre-commit hook runs this)
  python3 -I security/guard.py --all            every file tracked by git
  python3 -I security/guard.py --deploy DIR     a folder you are about to upload (adds deploy-only checks)
Exit code 1 when anything HIGH is found (and MEDIUM too with --strict). Allowlist: security/allowlist.json.
Only the Python standard library is needed (Pillow, if installed, makes the photo check more precise).
"""
import argparse, fnmatch, json, os, re, subprocess, sys

ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip() or os.getcwd()
ALLOW = {}
try:
    with open(os.path.join(ROOT, 'security', 'allowlist.json'), encoding='utf-8') as f:
        ALLOW = json.load(f)
except FileNotFoundError:
    pass
IGNORE = ALLOW.get('ignore_paths', []) + ['**/node_modules/**', '**/.next/**', '.git/**']
ALLOWED_EMAILS = {e.lower() for e in ALLOW.get('allowed_emails', [])}
ALLOWED_EMAIL_DOMAINS = {d.lower() for d in ALLOW.get('allowed_email_domains', [])}
ALLOWED_PHONES = set(ALLOW.get('allowed_phones', []))
ALLOWED_FINDINGS = set(ALLOW.get('allowed_findings', []))  # "path:rule" pairs reviewed by a person

TEXT_EXT = {'.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.json', '.md', '.txt', '.html', '.htm', '.css', '.php', '.py', '.sh',
            '.yml', '.yaml', '.toml', '.ini', '.env', '.xml', '.svg', '.csv', '.jsonl', '.sql', '.htaccess', '.conf', ''}
IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.tif', '.tiff'}
MAX_TEXT = 3_000_000

findings = []
def add(sev, path, rule, msg, line=0):
    if f'{path}:{rule}' in ALLOWED_FINDINGS:
        return
    findings.append({'severity': sev, 'path': path, 'line': line, 'rule': rule, 'message': msg})

# ---------- secrets ----------
SECRET_RULES = [
    ('private-key', re.compile(r'-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY'), 'a private key'),
    ('aws-key', re.compile(r'\b(?:AKIA|ASIA)[0-9A-Z]{16}\b'), 'an AWS access key'),
    ('github-token', re.compile(r'\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b'), 'a GitHub token'),
    ('google-key', re.compile(r'\bAIza[0-9A-Za-z_\-]{35}\b'), 'a Google API key'),
    ('stripe-key', re.compile(r'\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b'), 'a live Stripe key'),
    ('openai-key', re.compile(r'\bsk-(?:proj-)?[A-Za-z0-9_\-]{32,}\b'), 'an OpenAI-style secret key'),
    ('anthropic-key', re.compile(r'\bsk-ant-[A-Za-z0-9_\-]{20,}\b'), 'an Anthropic API key'),
    ('slack-token', re.compile(r'\bxox[abposr]-[A-Za-z0-9\-]{10,}\b'), 'a Slack token'),
    ('jwt', re.compile(r'\beyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b'), 'a login token (JWT)'),
    ('url-credentials', re.compile(r'\b[a-z][a-z0-9+.\-]*://[^\s/:@\'"]+:[^\s/@\'"]{3,}@[^\s\'"]+', re.I), 'a username and password inside a URL'),
    ('password-assignment', re.compile(r'''(?ix)\b(pass(?:word|wd)?|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|smtp[_-]?pass)\b
        ["']?\s*(?:=>|=|:)\s*["']([^"'\s]{8,})["']'''), 'a password or secret written into the code'),
]
PLACEHOLDER = re.compile(r'(?i)^(x+|\*+|change[-_]?me|your[-_].*|example.*|placeholder|dummy|test.*|<.*>|\$\{.*\}|process\.env.*|getenv.*)$')

# ---------- personal information ----------
def luhn_ok(digits):
    s, alt = 0, False
    for d in reversed(digits):
        n = int(d)
        if alt:
            n *= 2
            if n > 9: n -= 9
        s += n; alt = not alt
    return s % 10 == 0

def il_id_ok(d):
    if len(d) != 9: return False
    s = 0
    for i, c in enumerate(d):
        n = int(c) * (1 + i % 2)
        s += n if n < 10 else n - 9
    return s % 10 == 0

# Card numbers are written as 13-19 straight digits, or groups of 4 with one space or dash
CARD = re.compile(r'(?<![\w.,-])(?:\d{13,19}|\d{4}([ -])\d{4}\1\d{4}\1\d{1,7})(?![\w.,-])')
IL_ID_CTX = re.compile(r'(?:ת\.?\s?ז|תעודת\s+זהות|מספר\s+זהות|\bID\s*(?:number|no\.?)?\s*[:#]?)\D{0,12}(\d{8,9})\b', re.I)
IBAN_IL = re.compile(r'\bIL\d{2}\s?(?:\d{4}\s?){4}\d{3}\b')
PHONE_IL = re.compile(r'(?<!\d)(?:\+972[\s-]?|0)5\d[\s-]?\d{3}[\s-]?\d{4}(?!\d)')
EMAIL = re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b')

# ---------- dangerous code ----------
PHP_RULES = [
    ('php-eval', re.compile(r'\b(?:eval|assert|create_function)\s*\('), 'eval-style code execution'),
    ('php-shell', re.compile(r'\b(?:shell_exec|exec|system|passthru|popen|proc_open|pcntl_exec)\s*\(|`[^`]*\$'), 'running shell commands'),
    ('php-unserialize-input', re.compile(r'unserialize\s*\([^)]*\$_(?:GET|POST|REQUEST|COOKIE|SERVER)'), 'unserialize on visitor input'),
    ('php-include-input', re.compile(r'\b(?:include|require)(?:_once)?\s*\(?[^;]*\$_(?:GET|POST|REQUEST|COOKIE)'), 'including a file chosen by the visitor'),
    ('php-sql-concat', re.compile(r'(?i)\b(?:SELECT|INSERT|UPDATE|DELETE)\b[^;]*\.\s*\$_(?:GET|POST|REQUEST)'), 'SQL built from visitor input (SQL injection)'),
    ('php-display-errors', re.compile(r'ini_set\s*\(\s*["\']display_errors["\']\s*,\s*["\']?(?:1|on|true)', re.I), 'errors shown to visitors'),
]
JS_RULES = [
    ('js-eval', re.compile(r'(?<![\w$.])eval\s*\(|new\s+Function\s*\('), 'eval-style code execution'),
    ('js-inner-html-input', re.compile(r'innerHTML\s*=\s*[^;]*(?:location|search|hash|params|query)'), 'putting URL input into the page as HTML (XSS)'),
]

SECRET_FILES = [
    ('.env', '*.env'), ('.env', '.env*'), ('config', '**/api/config.php'), ('dump', '*.sql'), ('dump', '*.sqlite'), ('dump', '*.db'),
    ('backup', '*.bak'), ('backup', '*.old'), ('backup', '*~'), ('key', '*.pem'), ('key', '*.key'), ('key', '*.p12'), ('key', '*.pfx'),
    ('key', '**/id_rsa*'), ('key', '**/id_ed25519*'), ('leads', '**/site-leads/**'), ('leads', '**/inquiry-*.jsonl'),
    ('leads', '**/notify-*.jsonl'), ('leads', '**/confirm-*.jsonl'), ('leads', '**/api/data/*.php'), ('leads', '**/.salt'),
    ('credentials', '**/credentials*.json'), ('credentials', '**/service-account*.json'), ('credentials', '**/.npmrc'), ('credentials', '**/.netrc'),
]
SAFE_NAMES = {'.env.example', '.env.sample', 'config.sample.php'}

def ignored(rel):
    return any(fnmatch.fnmatch(rel, g) for g in IGNORE)

def scan_text(rel, text, deploy):
    lines = text.splitlines()
    ext = os.path.splitext(rel)[1].lower()
    for i, line in enumerate(lines, 1):
        if 'guard: allow' in line:  # a person reviewed this exact line
            continue
        for rule, rx, what in SECRET_RULES:
            m = rx.search(line)
            if not m: continue
            if rule == 'password-assignment':
                val = m.group(2)
                if PLACEHOLDER.match(val) or val.startswith(('$', '{', '%')) or 'example' in val.lower(): continue
            add('HIGH', rel, rule, f'Looks like {what}. Move it to a server-side secret store and rotate it.', i)
        for m in CARD.finditer(line):
            d = re.sub(r'\D', '', m.group())
            if 13 <= len(d) <= 19 and luhn_ok(d) and len(set(d)) > 2 and ext != '.svg' and 'd="M' not in line and not d.startswith('0'):
                add('HIGH', rel, 'credit-card', 'Looks like a credit-card number.', i)
        for m in IL_ID_CTX.finditer(line):
            if il_id_ok(m.group(1).zfill(9)):
                add('HIGH', rel, 'israeli-id', 'Looks like an Israeli ID number (תעודת זהות).', i)
        if IBAN_IL.search(line):
            add('HIGH', rel, 'iban', 'Looks like an Israeli bank account (IBAN).', i)
        for m in PHONE_IL.finditer(line):
            num = re.sub(r'\D', '', m.group())
            fake = re.search(r'(?:1234567|5550\d{3}|0000000)$', num)  # obvious test numbers
            if num not in ALLOWED_PHONES and not fake:
                add('MEDIUM', rel, 'phone', f'A phone number ({m.group()}). Public on purpose? Add it to the allowlist.', i)
        for m in EMAIL.finditer(line):
            e = m.group().lower(); dom = e.split('@')[1]
            if e in ALLOWED_EMAILS or dom in ALLOWED_EMAIL_DOMAINS or dom.endswith(('example.com', 'example.org', 'example.co.il', 'your-domain.co.il')): continue
            if re.search(r'\.(png|jpg|webp|svg|woff2?)$', e): continue
            add('MEDIUM', rel, 'email', f'An email address ({e}). Public on purpose? Add it to the allowlist.', i)
        if ext == '.php':
            for rule, rx, what in PHP_RULES:
                if rx.search(line): add('HIGH', rel, rule, f'Dangerous PHP: {what}.', i)
        if ext in ('.js', '.mjs', '.ts', '.tsx', '.jsx') and not deploy:
            for rule, rx, what in JS_RULES:
                if rx.search(line): add('HIGH', rel, rule, f'Dangerous JavaScript: {what}.', i)

def scan_image(rel, path):
    try:
        from PIL import Image
        with Image.open(path) as im:
            exif = im.getexif()
            gps = exif.get_ifd(0x8825) if exif else None
            if gps:
                add('HIGH', rel, 'photo-gps', 'This photo carries a GPS location. Strip it before publishing (python3 -I security/strip_photo_location.py FILE).')
        return
    except ImportError:
        pass
    except Exception:
        return
    with open(path, 'rb') as f:
        head = f.read(131072)
    if b'Exif' in head and b'GPS' in head:
        add('HIGH', rel, 'photo-gps', 'This photo seems to carry a GPS location. Strip it before publishing.')

def scan_file(rel, path, deploy):
    name = os.path.basename(rel)
    if name not in SAFE_NAMES:
        for kind, pat in SECRET_FILES:
            if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(name, pat):
                add('HIGH', rel, f'secret-file-{kind}', 'This kind of file holds secrets or customer data. It must never be committed or uploaded.')
                break
    ext = os.path.splitext(rel)[1].lower()
    if deploy and ext == '.map':
        add('MEDIUM', rel, 'source-map', 'Source map in the upload: it publishes your original source code.')
    if ext in IMAGE_EXT:
        scan_image(rel, path); return
    if ext not in TEXT_EXT and name != '.htaccess': return
    try:
        if os.path.getsize(path) > MAX_TEXT: return
        with open(path, encoding='utf-8', errors='ignore') as f:
            scan_text(rel, f.read(), deploy)
    except (OSError, IsADirectoryError):
        pass

HEADERS = ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Content-Security-Policy', 'Permissions-Policy']
def deploy_checks(d):
    ht = os.path.join(d, '.htaccess')
    text = open(ht, encoding='utf-8', errors='ignore').read() if os.path.exists(ht) else ''
    missing = [h for h in HEADERS if h not in text]
    if missing:
        add('MEDIUM', os.path.relpath(ht, ROOT), 'security-headers', 'Missing security headers: ' + ', '.join(missing))
    if os.path.isdir(os.path.join(d, '.git')):
        add('HIGH', os.path.relpath(d, ROOT) + '/.git', 'git-in-deploy', 'The .git folder is inside the upload: it would publish your whole history.')

def git_files(staged):
    cmd = ['git', 'diff', '--cached', '--name-only', '--diff-filter=ACMR'] if staged else ['git', 'ls-files']
    out = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True).stdout
    return [p for p in out.splitlines() if p]

def main():
    ap = argparse.ArgumentParser(description='Studio leak and safety scanner')
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--staged', action='store_true'); g.add_argument('--all', action='store_true'); g.add_argument('--deploy', metavar='DIR')
    ap.add_argument('--strict', action='store_true', help='fail on MEDIUM too'); ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    if a.deploy:
        base = os.path.abspath(a.deploy)
        for dp, dn, fn in os.walk(base):
            dn[:] = [x for x in dn if x not in ('node_modules', '.next')]
            for f in fn:
                p = os.path.join(dp, f); rel = os.path.relpath(p, ROOT)
                if not ignored(rel): scan_file(rel, p, True)
        deploy_checks(base)
    else:
        for rel in git_files(a.staged):
            p = os.path.join(ROOT, rel)
            if os.path.isfile(p) and not ignored(rel): scan_file(rel, p, False)
    high = [f for f in findings if f['severity'] == 'HIGH']; med = [f for f in findings if f['severity'] == 'MEDIUM']
    if a.json:
        print(json.dumps(findings, ensure_ascii=False, indent=1))
    else:
        for f in sorted(findings, key=lambda x: (x['severity'] != 'HIGH', x['path'], x['line'])):
            loc = f"{f['path']}:{f['line']}" if f['line'] else f['path']
            print(f"[{f['severity']}] {loc}  ({f['rule']})  {f['message']}")
        print(f"\nGUARD: {len(high)} high, {len(med)} medium." + ('  BLOCKED.' if high or (a.strict and med) else '  OK.'))
        if high or med:
            print('Reviewed and safe on purpose? Add "path:rule" to allowed_findings in security/allowlist.json, or the comment "guard: allow" on that line.')
    sys.exit(1 if high or (a.strict and med) else 0)

if __name__ == '__main__':
    main()
