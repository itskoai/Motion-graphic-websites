<?php
/**
 * Lead endpoint for the two site forms: "inquiry" (a project idea) and "notify" (the announcement list).
 *
 * It answers {"ok":true} ONLY after the submission is written to disk. Anything else is an error,
 * and the page then tells the visitor the message did not go through.
 *
 * Storage: one JSON line per submission in leads-YYYY-MM.jsonl, inside a "site-leads" folder created next to
 * the web root (outside public_html, so never reachable from the web). If that folder cannot be created, it uses
 * api/data instead (closed by api/data/.htaccess). Set LEADS_DIR in api/config.php to choose the folder yourself.
 * Optional email alert: set NOTIFY_TO in api/config.php (copy api/config.sample.php). The alert never
 * decides success; the saved line does.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

$cfgFile = __DIR__ . '/config.php';
$CFG = is_file($cfgFile) ? (require $cfgFile) : [];
if (!is_array($CFG)) { $CFG = []; }
// Default storage: a folder next to the web root (never reachable from the web). If that is not writable,
// fall back to api/data, which api/data/.htaccess closes on Apache and LiteSpeed hosts.
$defaultDir = __DIR__ . '/data';
$docroot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
if ($docroot !== '' && is_dir(dirname($docroot))) {
  $outside = dirname($docroot) . '/site-leads';
  if ((is_dir($outside) && is_writable($outside)) || (!is_dir($outside) && is_writable(dirname($docroot)))) { $defaultDir = $outside; }
}
$DATA_DIR = rtrim((string)(($CFG['LEADS_DIR'] ?? '') !== '' ? $CFG['LEADS_DIR'] : $defaultDir), '/');
$NOTIFY_TO = (string)($CFG['NOTIFY_TO'] ?? '');
$SALT = (string)($CFG['HASH_SALT'] ?? 'change-me-in-config');
$MAX_PER_WINDOW = (int)($CFG['RATE_MAX'] ?? 8);
$WINDOW = (int)($CFG['RATE_WINDOW'] ?? 600);

function reply(int $code, array $body): void {
  http_response_code($code);
  echo json_encode($body, JSON_UNESCAPED_UNICODE);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { reply(204, ['ok' => true]); }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); reply(405, ['ok' => false, 'error' => 'method']); }

// Same-site posts only: a browser always sends Origin on a cross-site fetch.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && $host !== '' && parse_url($origin, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) {
  reply(403, ['ok' => false, 'error' => 'origin']);
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$type = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
if (str_contains($type, 'application/json')) {
  $in = json_decode((string)$raw, true);
} else {
  $in = $_POST;
}
if (!is_array($in)) { reply(400, ['ok' => false, 'error' => 'body']); }

$str = static function ($v, int $max): string {
  $s = is_string($v) ? $v : '';
  $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
  $s = trim($s);
  return mb_substr($s, 0, $max);
};

$kind = $str($in['kind'] ?? '', 20);
if (!in_array($kind, ['inquiry', 'notify'], true)) { reply(400, ['ok' => false, 'error' => 'kind']); }

// Bots: a filled hidden field or an impossibly fast submit is refused and not stored.
$honeypot = $str($in['website'] ?? '', 200);
$elapsed = (int)($in['elapsed'] ?? 0);
$isBot = $honeypot !== '' || ($elapsed > 0 && $elapsed < 1200);

$emailOk = static fn(string $e): bool => (bool)filter_var($e, FILTER_VALIDATE_EMAIL);
$record = [
  'id' => bin2hex(random_bytes(8)),
  'at' => gmdate('c'),
  'kind' => $kind,
];

if ($kind === 'notify') {
  $email = mb_strtolower($str($in['email'] ?? '', 254));
  $consent = ($in['consent'] ?? false) === true || ($in['consent'] ?? '') === 'on' || ($in['consent'] ?? '') === 'true';
  if (!$emailOk($email)) { reply(422, ['ok' => false, 'error' => 'email']); }
  if (!$consent) { reply(422, ['ok' => false, 'error' => 'consent']); }
  $record += [
    'email' => $email,
    'consent' => true,
    'consent_text' => $str($in['consentText'] ?? '', 400),
    'consent_at' => gmdate('c'),
    'source' => $str($in['source'] ?? '', 40),
  ];
} else {
  $name = $str($in['name'] ?? '', 120);
  $contact = $str($in['contact'] ?? '', 160);
  $message = $str($in['message'] ?? '', 4000);
  $digits = preg_replace('/\D/', '', $contact) ?? '';
  $contactOk = $emailOk($contact) || (preg_match('/^\+?[0-9][0-9\s\-().]{7,18}$/', $contact) === 1 && strlen($digits) >= 9);
  if ($name === '' || $message === '') { reply(422, ['ok' => false, 'error' => 'required']); }
  if (!$contactOk) { reply(422, ['ok' => false, 'error' => 'contact']); }
  $record += ['name' => $name, 'contact' => $contact, 'message' => $message];
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$record['ip_hash'] = substr(hash('sha256', $SALT . '|' . $ip), 0, 16);
$record['ua'] = mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 180);
$record['page'] = $str($in['page'] ?? '', 120);

if (!is_dir($DATA_DIR) && !mkdir($DATA_DIR, 0750, true) && !is_dir($DATA_DIR)) {
  reply(500, ['ok' => false, 'error' => 'store']);
}

// Rate limit per hashed IP, kept in one small file under a lock.
$rlFile = $DATA_DIR . '/ratelimit.json';
$rl = @fopen($rlFile, 'c+');
if ($rl === false) { reply(500, ['ok' => false, 'error' => 'store']); }
flock($rl, LOCK_EX);
$rlData = json_decode((string)stream_get_contents($rl), true);
if (!is_array($rlData)) { $rlData = []; }
$now = time();
foreach ($rlData as $k => $stamps) {
  $rlData[$k] = array_values(array_filter((array)$stamps, static fn($t) => (int)$t > $now - $WINDOW));
  if (!$rlData[$k]) { unset($rlData[$k]); }
}
$mine = $rlData[$record['ip_hash']] ?? [];
if (count($mine) >= $MAX_PER_WINDOW) {
  flock($rl, LOCK_UN); fclose($rl);
  reply(429, ['ok' => false, 'error' => 'rate']);
}
$mine[] = $now;
$rlData[$record['ip_hash']] = $mine;
ftruncate($rl, 0); rewind($rl);
fwrite($rl, json_encode($rlData));
fflush($rl); flock($rl, LOCK_UN); fclose($rl);

if ($isBot) {
  // Looks like a bot: nothing is stored, so the answer is an error (never a false success).
  reply(422, ['ok' => false, 'error' => 'rejected']);
}

$file = $DATA_DIR . '/leads-' . gmdate('Y-m') . '.jsonl';
$line = json_encode($record, JSON_UNESCAPED_UNICODE) . "\n";
$fh = @fopen($file, 'ab');
if ($fh === false) { reply(500, ['ok' => false, 'error' => 'store']); }
$okLock = flock($fh, LOCK_EX);
$written = $okLock ? fwrite($fh, $line) : false;
fflush($fh);
if ($okLock) { flock($fh, LOCK_UN); }
fclose($fh);
if ($written === false || $written !== strlen($line)) { reply(500, ['ok' => false, 'error' => 'store']); }
@chmod($file, 0640);

if ($NOTIFY_TO !== '' && function_exists('mail')) {
  $subject = $kind === 'inquiry' ? 'פנייה חדשה מהאתר' : 'נרשם/ה חדש/ה לרשימת העדכונים';
  $body = $kind === 'inquiry'
    ? "שם: {$record['name']}\nפרטי קשר: {$record['contact']}\n\n{$record['message']}\n"
    : "מייל: {$record['email']}\nמקור: {$record['source']}\n";
  $headers = "Content-Type: text/plain; charset=UTF-8\r\n";
  @mail($NOTIFY_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}

reply(200, ['ok' => true, 'id' => $record['id']]);
