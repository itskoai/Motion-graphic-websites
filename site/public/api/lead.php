<?php
/**
 * Lead endpoint for the two site forms: "inquiry" (a project idea) and "notify" (the announcement list).
 *
 * The rule: success ({"ok":true}) is answered ONLY after the submission is written to disk and the byte count
 * is checked. Anything else is an error, and the page tells the visitor the message did not go through.
 *
 * JavaScript posts send JSON and get JSON back. Plain form posts (no JavaScript) get a small Hebrew HTML page.
 * Plain posts carry no "elapsed" value, so the bot gate refuses them and the page says so honestly.
 *
 * Storage (DATA_DIR):
 *   - LEADS_DIR from config.php when set, otherwise a "site-leads" folder created next to the web root
 *     (outside public_html, never reachable from the web), otherwise api/data as a last resort.
 *   - One file per kind and month: inquiry-YYYY-MM.jsonl, notify-YYYY-MM.jsonl, confirm-YYYY-MM.jsonl
 *     (one JSON object per line). Inquiry files older than 24 months are deleted automatically.
 *   - Inside the web root (api/data) the files get unguessable names ending in .php, and their first line is
 *     "<?php exit; ?>", so even a server that ignores .htaccess runs them as PHP and sends back nothing.
 *   - ratelimit.json holds only short-lived HMAC keys of the visitor's IP (never the IP), and .salt holds this
 *     install's random secret. Keep .salt with the data: confirm links depend on it.
 *
 * Config: api/config.php (copy api/config.sample.php), or the file named by the LEAD_CONFIG environment
 * variable (used by tests, so no test config ever sits in the upload folder).
 *
 * Cron (required, HANDOVER step 7; keeps the retention promises in privacy.html):  php /path/to/api/lead.php purge
 */
declare(strict_types=1);

umask(0027);
@ini_set('display_errors', '0');

/**
 * The consent wording on the page, pinned here. A notify post must carry one of these texts exactly
 * (whitespace normalized), and the record stores the server's copy, never what the client sent.
 * If the label on the page changes, ADD a new version ('v2' => '...') and keep the old ones.
 */
const LEAD_CONSENT = [
  'v1' => 'כן, שלחו לי עדכונים והכרזות במייל, כולל דברי פרסומת. אפשר לבטל בכל רגע.',
];
const LEAD_GUARD = "<?php exit; ?>\n";
const LEAD_DENY = "# Never serve anything from this folder.\n<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n";
const LEAD_MIN_ELAPSED = 1500;   // ms between the first focus in a form and its submit
const LEAD_KEEP_INQUIRY_MONTHS = 24;

/* ------------------------------------------------------------------ setup */

/** Config, data folder and the production guard, computed once. */
function lead_boot(): array {
  static $B = null;
  if ($B !== null) { return $B; }

  $file = (string)(getenv('LEAD_CONFIG') ?: __DIR__ . '/config.php');
  $raw = [];
  $error = null;
  if (is_file($file)) {
    try { $raw = require $file; } catch (Throwable $e) { $raw = null; }
    if (!is_array($raw)) { $raw = []; $error = 'config file does not return an array'; }
  }
  $s = static fn(string $k): string => is_string($raw[$k] ?? null) ? trim($raw[$k]) : '';
  $n = static function (string $k, int $d) use ($raw): int {
    $v = $raw[$k] ?? null;
    return (is_int($v) || (is_string($v) && ctype_digit($v))) && (int)$v > 0 ? (int)$v : $d;
  };
  $cfg = [
    'LEADS_DIR' => $s('LEADS_DIR'),
    'NOTIFY_TO' => $s('NOTIFY_TO'),
    'MAIL_FROM' => $s('MAIL_FROM'),
    'CONTACT_EMAIL' => $s('CONTACT_EMAIL'),
    'SITE_URL' => rtrim($s('SITE_URL'), '/'),
    'CONFIRM_EMAILS' => ($raw['CONFIRM_EMAILS'] ?? true) === true,   // on unless config.php turns it off (privacy.html promises it)
    'TRUSTED_PROXIES' => array_values(array_filter((array)($raw['TRUSTED_PROXIES'] ?? []), 'is_string')),
    'RATE_MAX' => $n('RATE_MAX', 8),
    'RATE_WINDOW' => $n('RATE_WINDOW', 600),
    'SITE_MAX' => $n('SITE_MAX', 60),
    'SITE_WINDOW' => $n('SITE_WINDOW', 600),
    'MAX_FILE_MB' => $n('MAX_FILE_MB', 20),
  ];

  // The web root: DOCUMENT_ROOT when the server gives one, else the site folder (lead.php lives in <site>/api).
  $siteRoot = dirname(__DIR__);
  $docroot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
  if ($docroot === '' || !is_dir($docroot)) { $docroot = $siteRoot; }

  if ($cfg['LEADS_DIR'] !== '') {
    $dir = $cfg['LEADS_DIR'];
    if ($dir[0] !== '/') { $dir = __DIR__ . '/' . $dir; }
  } else {
    $outside = dirname($docroot) . '/site-leads';
    $usable = is_dir($outside) ? is_writable($outside) : (!file_exists($outside) && is_writable(dirname($docroot)));
    $dir = $usable ? $outside : __DIR__ . '/data';
  }
  $dir = rtrim($dir, '/');
  $real = lead_realish($dir);

  // Files inside the web root (or under a folder that looks like one) get guarded names and contents.
  $under = static fn(string $p, string $root): bool => $root !== '' && ($p === $root || str_starts_with($p, rtrim($root, '/') . '/'));
  $guarded = $under($real, lead_realish($docroot)) || $under($real, lead_realish($siteRoot))
    || preg_match('#/(public_html|www|htdocs|httpdocs|wwwroot|html)(/|$)#', $real) === 1;

  // Production guard: a data folder under the system temp dir loses leads silently, so refuse to run.
  if ($error === null && PHP_SAPI !== 'cli-server') {
    $tmp = array_unique(array_filter(array_map('lead_realish', [sys_get_temp_dir(), '/tmp', '/var/tmp', '/dev/shm'])));
    foreach ($tmp as $t) {
      if ($under($real, $t)) { $error = 'data folder is under a temp dir: ' . $real; break; }
    }
  }
  if ($error !== null) { error_log('lead.php config: ' . $error); }

  return $B = ['cfg' => $cfg, 'dir' => $dir, 'guarded' => $guarded, 'error' => $error];
}

/** realpath() of the nearest existing parent, plus the part that does not exist yet. */
function lead_realish(string $p): string {
  if ($p === '') { return ''; }
  $rest = '';
  while ($p !== '' && $p !== '/' && !file_exists($p)) { $rest = '/' . basename($p) . $rest; $p = dirname($p); }
  $r = realpath($p);
  return rtrim(($r === false ? $p : $r), '/') . $rest;
}

function lead_ensure_dir(array $B): bool {
  $d = $B['dir'];
  if (!is_dir($d)) {
    if (!@mkdir($d, 0750, true) && !is_dir($d)) { return false; }
    // A local test run puts site-leads next to the site folder, often inside a git checkout: never commit it.
    @file_put_contents($d . '/.gitignore', "*\n");
  }
  if ($B['guarded']) {
    if (!is_file($d . '/.htaccess')) { @file_put_contents($d . '/.htaccess', LEAD_DENY); }
    if (!is_file($d . '/index.html')) { @file_put_contents($d . '/index.html', "\n"); }
  }
  return is_writable($d);
}

function lead_unguard(string $raw): string {
  if (str_starts_with($raw, '<?php')) {
    $nl = strpos($raw, "\n");
    return $nl === false ? '' : substr($raw, $nl + 1);
  }
  return $raw;
}

/** This install's random secret (64 hex chars). Created on first use; null when it cannot be read or made. */
function lead_salt(array $B, bool $create): ?string {
  static $salt = null;
  if ($salt !== null) { return $salt; }
  $f = $B['dir'] . ($B['guarded'] ? '/.salt.php' : '/.salt');
  for ($try = 0; $try < 20; $try++) {
    clearstatcache(true, $f);
    if (is_file($f)) {
      $v = trim(lead_unguard((string)@file_get_contents($f)));
      if (preg_match('/^[a-f0-9]{64}$/', $v) === 1) { return $salt = $v; }
      usleep(25000);   // another request is writing it right now
      continue;
    }
    if (!$create) { return null; }
    $fh = @fopen($f, 'x');
    if ($fh === false) { usleep(25000); continue; }
    $v = bin2hex(random_bytes(32));
    $data = ($B['guarded'] ? LEAD_GUARD : '') . $v . "\n";
    $ok = fwrite($fh, $data) === strlen($data);
    fclose($fh);
    @chmod($f, 0600);
    if (!$ok) { @unlink($f); return null; }
    return $salt = $v;
  }
  return null;
}

/** Path of a monthly data file: plain .jsonl outside the web root, unguessable .php inside it. */
function lead_path(array $B, string $salt, string $base, ?string $month = null): string {
  $month = $month ?? gmdate('Y-m');
  if (!$B['guarded']) { return $B['dir'] . '/' . $base . '-' . $month . '.jsonl'; }
  return $B['dir'] . '/' . $base . '-' . $month . '-' . substr(hash_hmac('sha256', 'files', $salt), 0, 16) . '.php';
}

/** Append one line under a lock and check the byte count. Returns '' on success, else 'full' or 'store'. */
function lead_append(array $B, string $path, string $line): string {
  $max = $B['cfg']['MAX_FILE_MB'] * 1048576;
  clearstatcache(true, $path);
  if (is_file($path) && filesize($path) >= $max) { return 'full'; }
  $fh = @fopen($path, 'ab');
  if ($fh === false) { return 'store'; }
  if (!flock($fh, LOCK_EX)) { fclose($fh); return 'store'; }
  $before = (int)(fstat($fh)['size'] ?? 0);
  $data = ($B['guarded'] && $before === 0 ? LEAD_GUARD : '') . $line;
  $written = fwrite($fh, $data);
  fflush($fh);
  clearstatcache(true, $path);
  $after = (int)(fstat($fh)['size'] ?? 0);
  $ok = $written === strlen($data) && $after >= $before + strlen($data);
  if (!$ok && $after > $before) { ftruncate($fh, $before); }   // never leave half a line behind
  flock($fh, LOCK_UN);
  fclose($fh);
  if (!$ok) { return 'store'; }
  @chmod($path, 0640);
  return '';
}

/** Tell the owner once (per month for a full file, per day for the site-wide limit) that the form is turning people away. */
function lead_alert_full(array $B, string $what, string $path = ''): void {
  $cfg = $B['cfg'];
  if ($cfg['NOTIFY_TO'] === '') { return; }
  $stamp = $B['dir'] . '/alert-' . $what . '-' . ($what === 'busy' ? gmdate('Y-m-d') : gmdate('Y-m'));
  if ($B['guarded']) {   // inside the web root: an unguessable name, like every other data file
    $stamp .= '-' . substr(hash_hmac('sha256', 'files', (string)lead_salt($B, false)), 0, 16) . '.php';
  }
  $fh = @fopen($stamp, 'x');
  if ($fh === false) { return; }   // already sent
  fclose($fh);
  $file = $what === 'notify' ? 'קובץ ההרשמות לרשימת העדכונים' : 'קובץ הפניות';
  $body = $what === 'busy'
    ? "הטופס באתר הגיע למגבלה הכללית על מספר השליחות (SITE_MAX), ובמשך כמה דקות לא קיבל פניות והרשמות.\n\nאם זה קורה הרבה, ייתכן שמישהו מציף את הטופס. אפשר להעלות את SITE_MAX ב־api/config.php."
    : $file . " של החודש (" . basename($path) . ") הגיע לגודל המקסימלי (MAX_FILE_MB), והטופס מציג עכשיו הודעה שהוא עמוס.\n\nכדי שהטופס יקבל שוב: להוריד את הקובץ מתיקיית הנתונים, ואז לשנות את שמו או למחוק אותו מהשרת. כדאי לבדוק אם הוא מלא בספאם.";
  // if the mail could not go out, try again on the next refused post
  if (!lead_mail($cfg, $cfg['NOTIFY_TO'], 'הטופס באתר דוחה פניות', $body)) { @unlink($stamp); }
}

/** Delete inquiry files once they are LEAD_KEEP_INQUIRY_MONTHS old. List files are never touched. */
function lead_purge(array $B): int {
  if (!is_dir($B['dir'])) { return 0; }
  $now = (int)gmdate('Y') * 12 + (int)gmdate('n') - 1;
  $gone = 0;
  foreach (glob($B['dir'] . '/inquiry-*') ?: [] as $f) {
    if (preg_match('/^inquiry-(\d{4})-(\d{2})(?:\.jsonl|-[a-f0-9]{16}\.php)$/', basename($f), $m) !== 1) { continue; }
    if ($now - ((int)$m[1] * 12 + (int)$m[2] - 1) >= LEAD_KEEP_INQUIRY_MONTHS && @unlink($f)) { $gone++; }
  }
  // the empty "already told the owner" stamps of lead_alert_full
  foreach (glob($B['dir'] . '/alert-*') ?: [] as $f) {
    if (preg_match('/^alert-[a-z]+-[0-9-]+(-[a-f0-9]{16}\.php)?$/', basename($f)) === 1 && (int)@filemtime($f) < time() - 86400 * 62) { @unlink($f); }
  }
  return $gone;
}

/* ------------------------------------------------------------------ confirm tokens */

/** A random token that carries its own HMAC, so confirm.php can check it without reading the list. */
function lead_token_new(string $salt): string {
  $r = bin2hex(random_bytes(12));
  return $r . substr(hash_hmac('sha256', 'confirm|' . $r, $salt), 0, 16);
}

function lead_token_ok(string $t, string $salt): bool {
  if (preg_match('/^[a-f0-9]{40}$/', $t) !== 1) { return false; }
  return hash_equals(substr(hash_hmac('sha256', 'confirm|' . substr($t, 0, 24), $salt), 0, 16), substr($t, 24));
}

/* ------------------------------------------------------------------ rate limit */

function lead_ip_in(string $ip, array $list): bool {
  $bin = @inet_pton($ip);
  if ($bin === false) { return false; }
  foreach ($list as $entry) {
    $parts = explode('/', trim($entry), 2);
    $net = @inet_pton($parts[0]);
    if ($net === false || strlen($net) !== strlen($bin)) { continue; }
    $max = strlen($bin) * 8;
    $bits = isset($parts[1]) && ctype_digit($parts[1]) ? min($max, (int)$parts[1]) : $max;
    $full = intdiv($bits, 8);
    $rem = $bits % 8;
    if (substr($bin, 0, $full) !== substr($net, 0, $full)) { continue; }
    if ($rem > 0) {
      $mask = (0xFF << (8 - $rem)) & 0xFF;
      if ((ord($bin[$full]) & $mask) !== (ord($net[$full]) & $mask)) { continue; }
    }
    return true;
  }
  return false;
}

/** The visitor's address. A forwarded header is believed only when the direct peer is a configured proxy. */
function lead_client_ip(array $cfg): string {
  $remote = (string)($_SERVER['REMOTE_ADDR'] ?? '');
  $trusted = $cfg['TRUSTED_PROXIES'];
  if ($trusted && lead_ip_in($remote, $trusted)) {
    $cf = trim((string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''));
    if ($cf !== '' && filter_var($cf, FILTER_VALIDATE_IP)) { return $cf; }
    $xff = (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    foreach (array_reverse(array_map('trim', explode(',', $xff))) as $hop) {
      if ($hop === '' || !filter_var($hop, FILTER_VALIDATE_IP)) { break; }
      if (!lead_ip_in($hop, $trusted)) { return $hop; }
    }
  }
  return $remote;
}

/** Rate-limit key: the IPv4 address, or the /64 of an IPv6 address (one IPv6 host owns a whole /64). */
function lead_client_key(string $ip): string {
  $bin = @inet_pton($ip);
  if ($bin === false) { return 'x:' . $ip; }
  if (strlen($bin) === 16) {
    if (substr($bin, 0, 12) === str_repeat("\0", 10) . "\xff\xff") { return 'v4:' . inet_ntop(substr($bin, 12)); }
    return 'v6:' . bin2hex(substr($bin, 0, 8)) . '/64';
  }
  return 'v4:' . inet_ntop($bin);
}

/**
 * Per-visitor and site-wide windows in one small locked file. Returns '' (go on), 'rate', 'full' or 'store'.
 * With $key null it only drops expired stamps (cron).
 */
function lead_rate(array $B, string $salt, ?string $key): string {
  $cfg = $B['cfg'];
  $path = $B['guarded'] ? $B['dir'] . '/rate-' . substr(hash_hmac('sha256', 'rate', $salt), 0, 16) . '.php' : $B['dir'] . '/ratelimit.json';
  $fh = @fopen($path, 'c+');
  if ($fh === false) { return 'store'; }
  if (!flock($fh, LOCK_EX)) { fclose($fh); return 'store'; }
  $data = json_decode(lead_unguard((string)stream_get_contents($fh)), true);
  if (!is_array($data)) { $data = []; }
  $now = time();
  $live = static fn($list, int $win): array => array_values(array_filter((array)$list, static fn($t) => is_int($t) && $t > $now - $win));
  $site = $live($data['*'] ?? [], $cfg['SITE_WINDOW']);
  $keys = [];
  foreach ((array)($data['k'] ?? []) as $k => $stamps) {
    $stamps = $live($stamps, $cfg['RATE_WINDOW']);
    if ($stamps) { $keys[(string)$k] = $stamps; }
  }
  $verdict = '';
  if ($key !== null) {
    $id = substr(hash_hmac('sha256', $key, $salt), 0, 24);
    $mine = $keys[$id] ?? [];
    if (count($mine) >= $cfg['RATE_MAX']) { $verdict = 'rate'; }
    elseif (count($site) >= $cfg['SITE_MAX']) { $verdict = 'full'; }
    else { $mine[] = $now; $site[] = $now; $keys[$id] = $mine; }
  }
  if (count($keys) > 5000) {   // keep the store small even under a flood of distinct addresses
    uasort($keys, static fn($a, $b) => max($b) <=> max($a));
    $keys = array_slice($keys, 0, 5000, true);
  }
  $out = ($B['guarded'] ? LEAD_GUARD : '') . json_encode(['*' => $site, 'k' => (object)$keys]);
  ftruncate($fh, 0);
  rewind($fh);
  $ok = fwrite($fh, $out) === strlen($out);
  fflush($fh);
  flock($fh, LOCK_UN);
  fclose($fh);
  @chmod($path, 0640);
  return $ok ? $verdict : 'store';
}

/* ------------------------------------------------------------------ mail */

function lead_addr_ok(string $a): bool {
  return $a !== '' && filter_var($a, FILTER_VALIDATE_EMAIL) !== false && preg_match('/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+$/', $a) === 1;
}

function lead_header_text(string $v): string {
  return trim(preg_replace('/[\r\n\t\x00]+/', ' ', $v) ?? '');
}

/** Plain-text UTF-8 mail with proper headers. From comes only from config MAIL_FROM. Never decides success. */
function lead_mail(array $cfg, string $to, string $subject, string $body, string $replyTo = ''): bool {
  if (!function_exists('mail') || !lead_addr_ok($to)) { return false; }
  $from = $cfg['MAIL_FROM'];
  $h = [];
  if (lead_addr_ok($from)) { $h[] = 'From: ' . $from; }
  $h[] = 'MIME-Version: 1.0';
  $h[] = 'Content-Type: text/plain; charset=UTF-8';
  $h[] = 'Content-Transfer-Encoding: base64';
  $h[] = 'Auto-Submitted: auto-generated';
  if ($replyTo !== '' && lead_addr_ok($replyTo)) { $h[] = 'Reply-To: ' . lead_header_text($replyTo); }
  $subject = lead_header_text($subject);
  $subj = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n")
    : '=?UTF-8?B?' . base64_encode($subject) . '?=';
  $params = lead_addr_ok($from) ? '-f' . $from : '';
  return @mail($to, $subj, chunk_split(base64_encode($body), 76, "\r\n"), implode("\r\n", $h), $params);
}

/* ------------------------------------------------------------------ HTML pages (no-JavaScript path, confirm.php) */

function lead_h(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * A small self-contained Hebrew page in the site's dark style. $paras: list of paragraphs; each is a string or
 * a list of parts, where ['ltr' => 'text'] is shown left-to-right (emails, links).
 * $action: ['href' => ..., 'label' => ...] or ['form' => ['t' => ...], 'label' => ...] (a POST button).
 */
function lead_page(int $code, string $title, array $paras, array $action = []): void {
  if (!headers_sent()) {
    http_response_code($code);
    $nonce = base64_encode(random_bytes(12));
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header("Content-Security-Policy: default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; script-src 'self' 'nonce-$nonce'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  } else {
    $nonce = '';
  }
  $body = '';
  foreach ($paras as $i => $p) {
    $html = '';
    foreach ((array)$p as $part) {
      $html .= is_array($part) ? '<span dir="ltr">' . lead_h((string)($part['ltr'] ?? '')) . '</span>' : lead_h((string)$part);
    }
    $body .= '<p' . ($i === 0 ? ' class="first"' : '') . '>' . $html . "</p>\n";
  }
  $act = '';
  if (isset($action['form'])) {
    $act = '<form method="post" action="' . lead_h((string)($action['to'] ?? '')) . '">';
    foreach ($action['form'] as $k => $v) { $act .= '<input type="hidden" name="' . lead_h((string)$k) . '" value="' . lead_h((string)$v) . '">'; }
    $act .= '<button class="btn btn-key" type="submit"><span class="dot" aria-hidden="true"></span><span class="btn-label">' . lead_h((string)$action['label']) . '</span></button></form>';
    $act .= '<a class="btn btn-ghost" href="../index.html"><span class="btn-label">לעמוד הבית</span></a>';
  } else {
    $act = '<a class="btn btn-key" href="' . lead_h((string)($action['href'] ?? '../index.html')) . '"><span class="dot" aria-hidden="true"></span><span class="btn-label">' . lead_h((string)($action['label'] ?? 'חזרה לאתר')) . '</span></a>';
  }
  $t = lead_h($title);
  echo <<<HTML
<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0b0d11">
<meta name="color-scheme" content="dark">
<title>{$t}</title>
<link rel="stylesheet" href="../assets/site.css">
<style>
  body { background: #0b0d11; color: #ece6da; }
  .note { min-height: 100vh; min-height: 100svh; display: flex; align-items: center; padding-block: calc(var(--head-h, 72px) + 6vh) 10vh; }
  .note .wrap { max-width: 860px; }
  .note h1 { margin: 0 0 24px; font-family: var(--f-display); font-weight: 700; font-size: clamp(56px, 8vw, 112px); line-height: .9; text-wrap: balance; }
  .note p { margin: 0 0 14px; color: var(--mist, #a9b0bd); max-width: 52ch; text-wrap: pretty; }
  .note p.first { color: var(--bone, #ece6da); font-size: clamp(19px, 1.6vw, 23px); }
  .note [dir="ltr"] { display: inline-block; max-width: 100%; overflow-wrap: anywhere; color: var(--bone, #ece6da); }
  .note .actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 36px; }
  .note .actions form { margin: 0; }
  .site-head { background: rgba(11, 13, 17, .94); border-color: var(--line); }
  .site-head::before { opacity: 0; }
</style>
</head>
<body>
<a class="skip" href="#main">דילוג לתוכן</a>
<header class="site-head">
  <div class="head-inner">
    <a class="mark" href="../index.html">
      <span class="mark-beam" aria-hidden="true"></span>
      <span class="mark-name" data-brand>OUTFRAME</span><span class="sr-only">, לעמוד הבית</span>
    </a>
  </div>
</header>
<main id="main" class="note" tabindex="-1">
  <div class="wrap">
    <h1>{$t}</h1>
{$body}    <div class="actions">{$act}</div>
  </div>
</main>
<script src="../assets/config.js"></script>
<script nonce="{$nonce}">
  (function () {
    var C = window.SITE_CONFIG || {};
    var b = (C.brand && C.brand.name) || '';
    if (b) { document.querySelectorAll('[data-brand]').forEach(function (el) { el.textContent = b; }); }
  })();
</script>
</body>
</html>
HTML;
  exit;
}

/* ------------------------------------------------------------------ library mode (confirm.php) and cron */

if (defined('LEAD_LIB')) { return; }

if (PHP_SAPI === 'cli') {
  $B = lead_boot();
  if ($B['error'] !== null) { fwrite(STDERR, "lead.php: config error: {$B['error']}\n"); exit(1); }
  if (($argv[1] ?? '') !== 'purge') { fwrite(STDERR, "usage: php lead.php purge   (deletes inquiry files older than 24 months)\n"); exit(2); }
  $n = lead_purge($B);
  $salt = is_dir($B['dir']) ? lead_salt($B, false) : null;
  if ($salt !== null) { lead_rate($B, $salt, null); }   // also drops expired rate-limit keys
  echo "lead.php: purged $n inquiry file(s) in {$B['dir']}\n";
  exit(0);
}

/* ------------------------------------------------------------------ request */

$B = lead_boot();
$CFG = $B['cfg'];
$method = (string)($_SERVER['REQUEST_METHOD'] ?? '');
$ctype = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
$AS_HTML = $method === 'POST' && !str_contains($ctype, 'application/json');
$KIND = 'inquiry';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

/** Answer and stop: JSON for the JavaScript path, a Hebrew page for plain form posts. */
function reply(int $code, array $body, string $detail = ''): void {
  global $AS_HTML;
  if (!$AS_HTML) {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  }
  global $KIND, $CFG;
  $notify = $KIND === 'notify';
  if (($body['ok'] ?? false) === true) {
    if ($notify) {
      $conf = $body['confirm'] ?? '';
      if ($conf === 'sent') {
        lead_page(200, 'כמעט סיימנו.', ['שלחנו אליכם מייל קצר עם קישור לאישור ההרשמה. אחרי האישור נכתוב לכם כשהאור יידלק.'], ['href' => '../index.html', 'label' => 'חזרה לאתר']);
      }
      $p = $conf === 'failed' ? ['נרשמתם, אבל מייל האישור לא יצא. נסו להירשם שוב בעוד כמה דקות.'] : ['נכתוב לכם כשהאור יידלק. אפשר לבטל בכל רגע.'];
      lead_page(200, 'אתם ברשימה.', $p, ['href' => '../index.html', 'label' => 'חזרה לאתר']);
    }
    lead_page(200, 'קיבלנו.', ['נקרא, נדמיין קצת ונחזור אליכם.'], ['href' => '../index.html', 'label' => 'חזרה לאתר']);
  }
  $why = [
    'rejected' => 'לא שמרנו את הטופס. כדי לסנן שליחות אוטומטיות, הטופס עובד רק כש־JavaScript פעיל בדפדפן. הפעילו אותו ונסו שוב.',
    'email' => 'כתובת המייל לא נראית תקינה. חזרו לטופס, בדקו אותה ונסו שוב.',
    'contact' => 'המייל או מספר הטלפון לא נראים תקינים. חזרו לטופס, בדקו אותם ונסו שוב.',
    'consent' => $detail === 'text'
      ? 'נוסח האישור בטופס לא תאם את הנוסח שלנו, ולכן לא שמרנו את ההרשמה. נסו שוב מאוחר יותר.'
      : 'כדי שנוכל לעדכן אתכם, סמנו את תיבת האישור ונסו שוב.',
    'required' => 'חסרים פרטים. מלאו את כל השדות ונסו שוב.',
    'rate' => 'שלחתם כמה פעמים ברצף. נסו שוב בעוד כמה דקות.',
    'full' => 'הטופס עמוס כרגע. נסו שוב מאוחר יותר.',
    'store' => 'יש אצלנו תקלה בשמירה. נסו שוב מאוחר יותר.',
    'save' => 'יש אצלנו תקלה בשמירה. נסו שוב מאוחר יותר.',
    'config' => 'יש אצלנו תקלה בשמירה. נסו שוב מאוחר יותר.',
  ];
  $err = (string)($body['error'] ?? '');
  $p = [$why[$err] ?? 'הטופס לא הגיע אלינו כמו שצריך. חזרו לאתר ונסו לשלוח משם.'];
  $mail = $CFG['CONTACT_EMAIL'] ?? '';
  if (lead_addr_ok($mail)) { $p[] = ['אפשר גם לכתוב לנו ישירות במייל: ', ['ltr' => $mail]]; }
  lead_page($code, $notify ? 'ההרשמה לא נקלטה.' : 'ההודעה לא נשלחה.', $p, ['href' => '../index.html#contact', 'label' => 'חזרה לאתר']);
}

if ($B['error'] !== null) { reply(500, ['ok' => false, 'error' => 'config']); }
if ($method === 'OPTIONS') { header('Allow: POST, OPTIONS'); http_response_code(204); exit; }
if ($method !== 'POST') { header('Allow: POST'); reply(405, ['ok' => false, 'error' => 'method']); }

// Same-site posts only: browsers send Origin on every POST, and on a cross-site one it names the other site.
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$host = (string)($_SERVER['HTTP_HOST'] ?? '');
if ($origin !== '' && $host !== '' && parse_url($origin, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) {
  reply(403, ['ok' => false, 'error' => 'origin']);
}

if ($AS_HTML) {
  $in = $_POST;
} else {
  $in = json_decode((string)file_get_contents('php://input', false, null, 0, 20000), true);
}
if (!is_array($in)) { reply(400, ['ok' => false, 'error' => 'body']); }

$str = static function ($v, int $max): string {
  $s = is_string($v) ? $v : '';
  if (!mb_check_encoding($s, 'UTF-8')) { $s = mb_scrub($s, 'UTF-8'); }
  $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
  return mb_substr(trim($s), 0, $max);
};
// Single-line fields: any run of whitespace (including CR/LF) becomes one space.
$one = static fn($v, int $max): string => trim(preg_replace('/\s+/u', ' ', $str($v, $max)) ?? '');

$kind = $str($in['kind'] ?? '', 20);
if (!in_array($kind, ['inquiry', 'notify'], true)) { reply(400, ['ok' => false, 'error' => 'kind']); }
$KIND = $kind;

$emailOk = static fn(string $e): bool => filter_var($e, FILTER_VALIDATE_EMAIL) !== false;
$page = $one($in['page'] ?? '', 120);

if ($kind === 'notify') {
  $email = mb_strtolower($one($in['email'] ?? '', 400));
  $c = $in['consent'] ?? false;
  $ticked = $c === true || in_array($c, ['on', 'true', '1', 'yes'], true);
  $sent = trim(preg_replace('/[\s\x{00A0}\x{2007}\x{202F}\x{200E}\x{200F}]+/u', ' ', $str($in['consentText'] ?? '', 400)) ?? '');
  $version = array_search($sent, LEAD_CONSENT, true);
  if (mb_strlen($email) > 254 || !$emailOk($email)) { reply(422, ['ok' => false, 'error' => 'email']); }
  if (!$ticked) { reply(422, ['ok' => false, 'error' => 'consent']); }
  if ($version === false) { reply(422, ['ok' => false, 'error' => 'consent'], 'text'); }
  $source = $one($in['source'] ?? '', 40);
  if (preg_match('/^[a-z0-9-]*$/', $source) !== 1) { $source = ''; }
} else {
  $name = $one($in['name'] ?? '', 120);
  $contact = $one($in['contact'] ?? '', 160);
  $message = $str($in['message'] ?? '', 4000);
  if ($name === '' || $contact === '' || $message === '') { reply(422, ['ok' => false, 'error' => 'required']); }
  $digits = preg_replace('/\D/', '', $contact) ?? '';
  $contactIsEmail = $emailOk($contact);
  $contactOk = $contactIsEmail || (preg_match('/^\+?[0-9][0-9\s\-().]{7,18}$/', $contact) === 1 && strlen($digits) >= 9);
  if (!$contactOk) { reply(422, ['ok' => false, 'error' => 'contact']); }
}

// Bot gate: a filled hidden field, or no believable time between first focus and submit. Nothing is stored,
// and the answer is an error, never a false success. Plain form posts (no JavaScript) carry no elapsed: refused.
$honeypot = $str($in['website'] ?? '', 200);
$elapsed = filter_var($in['elapsed'] ?? null, FILTER_VALIDATE_INT);
if ($honeypot !== '' || $elapsed === false || $elapsed < LEAD_MIN_ELAPSED) {
  reply(422, ['ok' => false, 'error' => 'rejected']);
}

if (!lead_ensure_dir($B)) { reply(500, ['ok' => false, 'error' => 'store']); }
$SALT = lead_salt($B, true);
if ($SALT === null) { reply(500, ['ok' => false, 'error' => 'store']); }

$verdict = lead_rate($B, $SALT, lead_client_key(lead_client_ip($CFG)));
if ($verdict === 'rate') { reply(429, ['ok' => false, 'error' => 'rate']); }
if ($verdict === 'full') { lead_alert_full($B, 'busy'); reply(503, ['ok' => false, 'error' => 'full']); }
if ($verdict !== '') { reply(500, ['ok' => false, 'error' => 'store']); }

$now = gmdate('c');
$record = ['id' => bin2hex(random_bytes(8)), 'at' => $now, 'kind' => $kind];
if ($kind === 'notify') {
  $token = lead_token_new($SALT);
  $record += [
    'email' => $email,
    'consent' => true,
    'consent_version' => $version,
    'consent_text' => LEAD_CONSENT[$version],
    'consent_at' => $now,
    'source' => $source,
    'token' => $token,
    'confirmed' => false,
  ];
} else {
  $record += ['name' => $name, 'contact' => $contact, 'message' => $message];
}
$record['page'] = $page;

$line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
if ($line === false) { reply(500, ['ok' => false, 'error' => 'save']); }
$fail = lead_append($B, lead_path($B, $SALT, $kind), $line . "\n");
if ($fail === 'full') { lead_alert_full($B, $kind, lead_path($B, $SALT, $kind)); reply(503, ['ok' => false, 'error' => 'full']); }
if ($fail !== '') { reply(500, ['ok' => false, 'error' => 'store']); }

// Saved. Everything below is best effort and never changes the answer.
lead_purge($B);
$out = ['ok' => true, 'id' => $record['id']];

if ($kind === 'inquiry' && $CFG['NOTIFY_TO'] !== '') {
  $body = "פנייה חדשה הגיעה מהטופס באתר.\n\n"
    . "שם: {$name}\n"
    . "מייל או טלפון: {$contact}\n"
    . "נשלחה: {$now} (UTC)\n"
    . "מזהה: {$record['id']}\n\n"
    . "ההודעה:\n{$message}\n\n"
    . "העותק הזה נשלח אוטומטית. הפנייה עצמה שמורה בשרת האתר.\n";
  lead_mail($CFG, $CFG['NOTIFY_TO'], 'פנייה חדשה מהאתר: ' . mb_substr($name, 0, 60), $body, $contactIsEmail ? $contact : '');
}

if ($kind === 'notify' && $CFG['CONFIRM_EMAILS'] && lead_addr_ok($CFG['MAIL_FROM']) && preg_match('#^https://[^\s/?\#]+(/[^\s?\#]*)?$#', $CFG['SITE_URL']) === 1) {
  $link = $CFG['SITE_URL'] . '/api/confirm.php?t=' . $token;
  $body = "שלום,\n\n"
    . "קיבלנו בקשה לשלוח לכתובת הזו עדכונים והכרזות במייל.\n"
    . "כדי לאשר את ההרשמה, פתחו את הקישור ולחצו על \"אישור ההרשמה\":\n\n"
    . $link . "\n\n"
    . "אם לא אתם ביקשתם, אפשר פשוט להתעלם מהמייל הזה. בלי אישור לא נשלח אליכם עדכונים.\n";
  $out['confirm'] = lead_mail($CFG, $email, 'אישור הרשמה לעדכונים', $body) ? 'sent' : 'failed';
}

reply(200, $out);
