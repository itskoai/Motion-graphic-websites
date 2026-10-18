#!/usr/bin/env bash
# Pre-deploy check for the studio site. Run it from the repo root before every upload:
#
#   review/studio/tools/predeploy.sh            (checks studio-site/)
#   review/studio/tools/predeploy.sh path/to/site
#
# It only reads files. It never uploads, edits or deletes anything.
# Exit code 0 = ready to upload; 1 = something must be fixed first (every problem is listed).
set -u

SITE="${1:-studio-site}"
if [ ! -f "$SITE/index.html" ] || [ ! -d "$SITE/api" ]; then
  echo "predeploy: cannot find the site folder '$SITE'. Run this from the repo root, or pass the folder." >&2
  exit 2
fi

FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
warn() { printf '  WARN  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

# Value of `key: '...'` inside `block: { ... }` in assets/config.js (flat blocks, single or double quotes).
js_str() {
  awk -v blk="$1" -v key="$2" -v q="'" '
    function grab(line,   re, v) {
      re = "(^|[{,[:space:]])" key "[[:space:]]*:[[:space:]]*(" q "[^" q "]*" q "|\"[^\"]*\")"
      if (match(line, re)) {
        v = substr(line, RSTART, RLENGTH); sub(/^[^:]*:[[:space:]]*/, "", v)
        print substr(v, 2, length(v) - 2); found = 1; exit
      }
    }
    !inb && $0 ~ ("(^|[{,[:space:]])" blk "[[:space:]]*:[[:space:]]*[{]") { inb = 1; sub(".*" blk "[[:space:]]*:[[:space:]]*[{]", "") }
    inb { grab($0); if ($0 ~ /[}]/) inb = 0 }
  ' "$SITE/assets/config.js"
}
# `key: true|false` inside `block: { ... }`.
js_bool() {
  awk -v blk="$1" -v key="$2" '
    !inb && $0 ~ ("(^|[{,[:space:]])" blk "[[:space:]]*:[[:space:]]*[{]") { inb = 1; sub(".*" blk "[[:space:]]*:[[:space:]]*[{]", "") }
    inb {
      if (match($0, "(^|[{,[:space:]])" key "[[:space:]]*:[[:space:]]*(true|false)")) {
        v = substr($0, RSTART, RLENGTH); sub(/.*:[[:space:]]*/, "", v); print v; exit
      }
      if ($0 ~ /[}]/) inb = 0
    }
  ' "$SITE/assets/config.js"
}

echo "Pre-deploy check for $SITE/"
echo

echo "Live address"
hits=$(grep -rIn --exclude-dir=media 'DEPLOY-DOMAIN' "$SITE" 2>/dev/null)
if [ -n "$hits" ]; then
  fail "DEPLOY-DOMAIN is still in these places. Replace it everywhere with the live address (e.g. example.co.il):"
  printf '%s\n' "$hits" | sed 's/^/          /'
else
  pass "no DEPLOY-DOMAIN left"
fi
if grep -v '^[[:space:]]*#' "$SITE/robots.txt" 2>/dev/null | grep -q 'YOUR-DOMAIN'; then
  fail "robots.txt: replace YOUR-DOMAIN in the Sitemap line with the live address"
fi

echo
echo "Form backend (api/config.php)"
CFGPHP="$SITE/api/config.php"
if [ ! -f "$CFGPHP" ]; then
  fail "api/config.php is missing. Copy api/config.sample.php to api/config.php and fill NOTIFY_TO and MAIL_FROM."
elif command -v php >/dev/null 2>&1; then
  if ! php -l "$CFGPHP" >/dev/null 2>&1; then
    fail "api/config.php has a PHP syntax error: $(php -l "$CFGPHP" 2>&1 | head -1)"
  else
    while IFS= read -r line; do
      case "$line" in
        OK:*) pass "${line#OK:}" ;;
        WARN:*) warn "${line#WARN:}" ;;
        ERR:*) fail "${line#ERR:}" ;;
      esac
    done < <(php -- "$CFGPHP" <<'PHP'
<?php
$f = $argv[1];
try { $c = require $f; } catch (Throwable $e) { echo "ERR:api/config.php does not load: ", $e->getMessage(), "\n"; exit; }
if (!is_array($c)) { echo "ERR:api/config.php must return an array (start from config.sample.php)\n"; exit; }
$addr = static fn($a): bool => is_string($a) && filter_var($a, FILTER_VALIDATE_EMAIL) !== false && preg_match('/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+$/', $a) === 1;
foreach (['NOTIFY_TO' => 'the studio mailbox that gets a copy of each inquiry', 'MAIL_FROM' => 'a sender address on your own domain'] as $k => $what) {
  if ($addr($c[$k] ?? '')) { echo "OK:$k is set ({$c[$k]})\n"; }
  else { echo "ERR:$k is empty or not an email address. Set it to $what.\n"; }
}
$d = is_string($c['LEADS_DIR'] ?? null) ? trim($c['LEADS_DIR']) : '';
if ($d !== '' && preg_match('#^(/tmp|/var/tmp|/dev/shm|/private/tmp|/private/var/tmp)(/|$)|scratchpad|claude-0#', $d)) {
  echo "ERR:LEADS_DIR points at a temp or test folder ($d). Leave it empty, or give a folder outside public_html.\n";
} elseif ($d !== '' && $d[0] !== '/') {
  echo "ERR:LEADS_DIR must be a full path that starts with /\n";
} elseif ($d !== '' && preg_match('#/(public_html|www|htdocs|httpdocs)(/|$)#', $d)) {
  echo "WARN:LEADS_DIR is inside a web folder ($d). It works (files get hidden .php names), but outside public_html is better.\n";
} else {
  echo "OK:LEADS_DIR " . ($d === '' ? 'is empty (default: site-leads next to public_html)' : "is $d") . "\n";
}
if (($c['CONFIRM_EMAILS'] ?? false) === true && !preg_match('#^https://[^\s/?\#]+(/[^\s?\#]*)?$#', (string)($c['SITE_URL'] ?? ''))) {
  echo "ERR:CONFIRM_EMAILS is true, so SITE_URL must be the live https address (e.g. https://example.co.il)\n";
}
if (($c['CONFIRM_EMAILS'] ?? false) !== true) {
  echo "ERR:CONFIRM_EMAILS must be true: privacy.html promises that a mailing service only gets confirmed addresses\n";
}
$ce = $c['CONTACT_EMAIL'] ?? '';
if ($ce !== '' && !$addr($ce)) { echo "ERR:CONTACT_EMAIL is not an email address\n"; }
if ($ce === '') { echo "WARN:CONTACT_EMAIL is empty: visitors without JavaScript get no direct address on the error page\n"; }
if (array_key_exists('HASH_SALT', $c)) { echo "WARN:HASH_SALT is no longer used (lead.php makes its own secret). You can delete that line.\n"; }
PHP
    )
  fi
else
  warn "php is not installed here, so api/config.php gets a text-only check"
  if grep -Eq "['\"]LEADS_DIR['\"][[:space:]]*=>[[:space:]]*['\"][^'\"]*(/tmp|/var/tmp|/dev/shm|scratchpad|claude-0)" "$CFGPHP"; then
    fail "api/config.php mentions a temp or test folder. Start again from config.sample.php."
  fi
  grep -Eq "['\"]CONFIRM_EMAILS['\"][[:space:]]*=>[[:space:]]*true" "$CFGPHP" || fail "CONFIRM_EMAILS must be true in api/config.php (privacy.html promises it)"
  for k in NOTIFY_TO MAIL_FROM; do
    if grep -Eq "['\"]$k['\"][[:space:]]*=>[[:space:]]*['\"][^'\" ]+@[^'\" ]+\.[^'\" ]+['\"]" "$CFGPHP"; then pass "$k is set"
    else fail "$k is empty in api/config.php"; fi
  done
fi

data_left=$(find "$SITE/api/data" -mindepth 1 ! -name '.gitignore' ! -name '.htaccess' ! -name 'index.html' 2>/dev/null)
if [ -n "$data_left" ]; then
  fail "api/data holds files that must not be uploaded (test submissions or a test secret). Remove them:"
  printf '%s\n' "$data_left" | sed 's/^/          /'
else
  pass "api/data holds only its .htaccess, index.html and .gitignore"
fi
if [ -e "$SITE/site-leads" ]; then fail "a site-leads folder sits inside the upload folder. Move it out."; fi
for f in "$SITE/api/index.html" "$SITE/api/.htaccess" "$SITE/api/data/.htaccess"; do
  [ -f "$f" ] || fail "missing ${f#"$SITE"/}"
done
if command -v php >/dev/null 2>&1; then
  for f in "$SITE/api/lead.php" "$SITE/api/confirm.php"; do
    if php -l "$f" >/dev/null 2>&1; then pass "${f#"$SITE"/} has no syntax errors"; else fail "${f#"$SITE"/}: $(php -l "$f" 2>&1 | head -1)"; fi
  done
fi

echo
echo "Studio name"
brand=$(sed -n "s/^[[:space:]]*name: '\([^']*\)'.*/\1/p" "$SITE/assets/config.js" | head -1)
if [ -z "$brand" ]; then fail "could not read brand.name from assets/config.js"
else
  name_bad=0
  for f in index.html privacy.html accessibility.html; do
    grep -o '<title>[^<]*</title>' "$SITE/$f" | grep -qF "$brand" || { fail "$f: the <title> does not contain \"$brand\" (brand.name)"; name_bad=1; }
  done
  grep -qF "<meta property=\"og:site_name\" content=\"$brand\">" "$SITE/index.html" || { fail "index.html: og:site_name is not \"$brand\""; name_bad=1; }
  grep -o '<meta property="og:title" content="[^"]*">' "$SITE/index.html" | grep -qF "$brand" || { fail "index.html: og:title does not contain \"$brand\""; name_bad=1; }
  grep -qF "\"@type\":\"Organization\",\"name\":\"$brand\"" "$SITE/index.html" || { fail "index.html: the JSON-LD \"name\" is not \"$brand\""; name_bad=1; }
  [ "$name_bad" = 0 ] && pass "\"$brand\" is the name in config.js, all three titles, og tags and JSON-LD"
fi

echo
echo "Consent wording"
if command -v php >/dev/null 2>&1; then
  while IFS= read -r line; do
    case "$line" in
      OK:*) pass "${line#OK:}" ;;
      ERR:*) fail "${line#ERR:}" ;;
    esac
  done < <(php -- "$SITE" <<'PHP'
<?php
$site = $argv[1];
$html = (string)@file_get_contents("$site/index.html");
$src = (string)@file_get_contents("$site/api/lead.php");
preg_match('/const LEAD_CONSENT = \[(.*?)\];/s', $src, $m);
preg_match_all("/'v\d+' => '([^']*)'/u", $m[1] ?? '', $vv);
$allowed = $vv[1] ?? [];
if (!$allowed) { echo "ERR:could not read LEAD_CONSENT from api/lead.php\n"; exit; }
$norm = static fn($t) => trim(preg_replace('/[\s\x{00A0}]+/u', ' ', html_entity_decode(strip_tags($t), ENT_QUOTES, 'UTF-8')));
preg_match_all('#<form[^>]*data-kind="notify"[^>]*>(.*?)</form>#su', $html, $forms);
if (!$forms[1]) { echo "ERR:no signup form found in index.html\n"; exit; }
foreach ($forms[1] as $i => $f) {
  $n = $i + 1;
  preg_match('#name="consentText" value="([^"]*)"#u', $f, $hv);
  preg_match('#<label class="consent"[^>]*>.*?<span>(.*?)</span>\s*</label>#su', $f, $lv);
  $hidden = $norm($hv[1] ?? ''); $label = $norm($lv[1] ?? '');
  if ($hidden === '' || $label === '') { echo "ERR:signup form $n: consent label or hidden consentText not found\n"; continue; }
  if ($hidden !== $label) { echo "ERR:signup form $n: the checkbox label and the hidden consentText differ. Change both, and add the text to LEAD_CONSENT in api/lead.php as a new version\n"; continue; }
  if (!in_array($hidden, $allowed, true)) { echo "ERR:signup form $n: the consent text is not in LEAD_CONSENT (api/lead.php). Add it there as a new version and keep the old ones\n"; continue; }
  echo "OK:signup form $n: label, hidden text and server copy of the consent match\n";
}
PHP
  )
else
  warn "php is not installed here, so the consent wording is not checked"
fi

echo
echo "Browser support"
if grep -Eq '\(\?<[=!]' "$SITE/assets/site.js"; then fail "assets/site.js uses a regex lookbehind; Safari before 16.4 cannot run the whole script"
else pass "assets/site.js has no regex lookbehind (older iPhones can run it)"; fi

echo
echo "HTTPS"
if [ -f "$SITE/.htaccess" ] && grep -Eq 'RewriteRule .*https://' "$SITE/.htaccess"; then
  pass ".htaccess sends plain http to https (also turn on SSL in the hosting panel)"
else
  fail "the root .htaccess with the https redirect is missing"
fi

echo
echo "Facts in assets/config.js"
for pair in "contact email" "legal owner" "accessibility coordinator"; do
  set -- $pair
  v=$(js_str "$1" "$2")
  if [ -n "$(printf '%s' "$v" | tr -d '[:space:]')" ]; then pass "$1.$2 is filled"
  else fail "$1.$2 is empty. Fill it in assets/config.js (privacy and accessibility pages need it)."; fi
done
for pair in "legal email" "legal businessId"; do
  set -- $pair
  v=$(js_str "$1" "$2")
  [ -n "$(printf '%s' "$v" | tr -d '[:space:]')" ] || warn "$1.$2 is empty (optional, but expected on the privacy page)"
done

echo
echo "Search engines"
working=$(js_bool brand isWorkingName)
blocks_all=no
if grep -Eiq '^[[:space:]]*Disallow:[[:space:]]*/[[:space:]]*$' "$SITE/robots.txt" 2>/dev/null; then blocks_all=yes; fi
meta_noindex=no
if grep -Eiq '<meta[^>]+name="robots"[^>]+content="[^"]*noindex' "$SITE/index.html"; then meta_noindex=yes; fi
if [ "$working" = "false" ]; then
  if [ "$blocks_all" = "yes" ]; then
    fail "brand.isWorkingName is false, but robots.txt still blocks everything (Disallow: /). Switch it to the Allow + Sitemap lines in its comment."
  else
    pass "robots.txt lets search engines in (name is final)"
  fi
  if [ "$meta_noindex" = "yes" ]; then
    fail "brand.isWorkingName is false, but index.html still has a noindex robots meta tag"
  fi
elif [ "$working" = "true" ]; then
  if [ "$blocks_all" = "yes" ]; then pass "robots.txt keeps the working name out of search engines"
  else warn "the name is still a working name, but robots.txt does not block indexing"; fi
else
  fail "could not read brand.isWorkingName from assets/config.js"
fi

echo
if [ "$FAILS" -gt 0 ]; then
  echo "NOT READY: $FAILS problem(s) above. Fix them and run this again. Nothing was uploaded."
  exit 1
fi
echo "READY: every check passed. Upload the CONTENTS of $SITE/ (see HANDOVER.md, 'Put it online')."
echo "Then, by hand: set up the daily purge cron job (HANDOVER.md step 7). The privacy page promises it."
exit 0
