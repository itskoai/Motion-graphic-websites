<?php
/**
 * Click counter for the YOKO ONO site. Privacy first: each click stores an ISO minute, the event name and
 * whether the page was in its phone or desktop layout. Nothing else: no IP address, no user agent, no cookie, no ID.
 *
 * The page sends navigator.sendBeacon('api/click.php', e=reserve) when a visitor uses one of the main actions.
 * Events outside the allowlist are dropped. The answer is always 204 (empty), so nothing can be probed through it.
 *
 * Storage: clicks-YYYY-MM.jsonl in the "site-leads" folder next to the web root (outside public_html, never served),
 * the same convention as lead.php. If that folder cannot be used, api/data gets guarded files (.php names that exit).
 * Each month's file is capped at 2 MB. On a host without PHP this file is never run and the site works all the same.
 *
 * PHP2Shell tripwire (CVE-2026-109618 / CVE-2026-109619): on an unpatched PHP nothing is written and the answer is 503.
 */
declare(strict_types=1);
umask(0027);
@ini_set('display_errors', '0');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); header('Allow: POST'); exit; }

function click_php_patched(): bool {
  $cfgFile = __DIR__ . '/config.php';
  $cfg = is_file($cfgFile) ? (require $cfgFile) : [];
  if (is_array($cfg) && !empty($cfg['ALLOW_UNPATCHED_PHP'])) { return true; }
  $v = PHP_VERSION_ID;
  $fixed = [80500 => 80512, 80400 => 80427, 80300 => 80336, 80200 => 80235];
  $branch = intdiv($v, 100) * 100;
  if (isset($fixed[$branch])) { return $v >= $fixed[$branch]; }
  return $v >= 80600;
}
if (!click_php_patched()) { http_response_code(503); exit; }

$allowed = ['reserve', 'menu', 'delivery', 'call', 'directions', 'instagram', 'facebook', 'skip', 'gallery'];
$e = isset($_POST['e']) && is_string($_POST['e']) ? $_POST['e'] : '';
if (!in_array($e, $allowed, true)) { http_response_code(204); exit; }
$s = (isset($_POST['s']) && $_POST['s'] === 'phone') ? 'phone' : 'desktop';

// Where the file lives: outside the web root when possible.
$siteRoot = dirname(__DIR__);
$docroot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
if ($docroot === '' || !is_dir($docroot)) { $docroot = $siteRoot; }
$outside = dirname($docroot) . '/site-leads';
$usable = is_dir($outside) ? is_writable($outside) : (!file_exists($outside) && is_writable(dirname($docroot)));
$guarded = !$usable;
$dir = $usable ? $outside : __DIR__ . '/data';
if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) { http_response_code(204); exit; }
@file_put_contents($dir . '/.gitignore', "*\n");
if ($guarded) {
  if (!is_file($dir . '/.htaccess')) {
    @file_put_contents($dir . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
  }
  if (!is_file($dir . '/index.html')) { @file_put_contents($dir . '/index.html', "\n"); }
}
$file = $dir . '/clicks-' . gmdate('Y-m') . ($guarded ? '.php' : '.jsonl');
$fresh = !is_file($file);
if (!$fresh && filesize($file) > 2 * 1024 * 1024) { http_response_code(204); exit; }

$line = json_encode(['t' => gmdate('Y-m-d\TH:i'), 'e' => $e, 's' => $s], JSON_UNESCAPED_SLASHES) . "\n";
$fh = @fopen($file, 'ab');
if ($fh) {
  if (@flock($fh, LOCK_EX)) {
    if ($fresh && $guarded) { fwrite($fh, "<?php exit; ?>\n"); }
    fwrite($fh, $line);
    fflush($fh);
    flock($fh, LOCK_UN);
  }
  fclose($fh);
  @chmod($file, 0640);
}
http_response_code(204);
