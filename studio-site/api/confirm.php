<?php
/**
 * Double opt-in for the announcement list.
 *
 *   GET  confirm.php?t=TOKEN   shows one button ("אישור ההרשמה"). Nothing is written yet, so mail scanners
 *                              that open every link cannot confirm an address on the visitor's behalf.
 *   POST confirm.php  t=TOKEN  appends {"token","at"} to confirm-YYYY-MM.jsonl and shows "confirmed".
 *
 * Tokens are made by lead.php and carry their own HMAC (keyed by this install's .salt), so a made-up token is
 * refused without reading the list. The page says "confirmed" only after the line is saved.
 * To export the list: take notify rows whose token appears in a confirm file, minus the suppress list.
 */
declare(strict_types=1);

define('LEAD_LIB', true);
require __DIR__ . '/lead.php';

header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

$B = lead_boot();
if (!lead_php_patched($B['cfg'] ?? [])) {
  lead_page(503, 'האתר בתחזוקה קצרה.', ['נסו שוב בעוד כמה שעות. ההרשמה שלכם שמורה.']);
  exit;
}
$method = (string)($_SERVER['REQUEST_METHOD'] ?? '');
$t = $method === 'POST' ? ($_POST['t'] ?? '') : ($_GET['t'] ?? '');
$t = is_string($t) ? strtolower(trim($t)) : '';

$bad = static function (): void {
  lead_page(400, 'הקישור לא תקין.', [
    'ייתכן שהוא נקטע בדרך. נסו לפתוח שוב את הקישור המלא מהמייל, או להירשם שוב באתר.',
  ]);
};
$broken = static function (): void {
  lead_page(500, 'האישור לא נשמר.', ['יש אצלנו תקלה זמנית. נסו שוב מאוחר יותר, מאותו קישור.']);
};

if ($B['error'] !== null) { $broken(); }
if ($method !== 'GET' && $method !== 'HEAD' && $method !== 'POST') {
  header('Allow: GET, POST');
  lead_page(405, 'הקישור לא תקין.', ['אפשר לפתוח את הקישור מהמייל בדפדפן.']);
}

// The token is checked with this install's secret. No secret yet means no token was ever issued here.
$salt = is_dir($B['dir']) ? lead_salt($B, false) : null;
if ($salt === null || !lead_token_ok($t, $salt)) { $bad(); }

if ($method !== 'POST') {
  lead_page(200, 'רק עוד לחיצה.', [
    'כדי לאשר שאתם רוצים לקבל מאיתנו עדכונים והכרזות במייל, לחצו על הכפתור.',
    'אם לא אתם נרשמתם, אפשר פשוט לסגור את העמוד. בלי אישור לא נשלח אליכם עדכונים.',
  ], ['form' => ['t' => $t], 'to' => 'confirm.php', 'label' => 'אישור ההרשמה']);
}

// Same-site posts only (the button above lives on this site).
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$host = (string)($_SERVER['HTTP_HOST'] ?? '');
if ($origin !== '' && $host !== '' && parse_url($origin, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) { $bad(); }

$done = static function (): void {
  lead_page(200, 'הכתובת אושרה.', [
    'תודה. נעדכן אתכם במייל כשיהיה מה לספר.',
    'אפשר לבטל בכל רגע, דרך הקישור שיופיע בכל מייל או בפנייה אלינו.',
  ]);
};

$path = lead_path($B, $salt, 'confirm');
// Already confirmed this month: say so without writing the same line again.
if (is_file($path) && filesize($path) < 4 * 1048576 && str_contains((string)@file_get_contents($path), '"token":"' . $t . '"')) { $done(); }

$line = json_encode(['token' => $t, 'at' => gmdate('c')], JSON_UNESCAPED_SLASHES);
if ($line === false || lead_append($B, $path, $line . "\n") !== '') { $broken(); }
lead_purge($B);
$done();
