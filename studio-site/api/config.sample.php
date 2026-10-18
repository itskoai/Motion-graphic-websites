<?php
// Copy this file to config.php (same folder) and fill what you need. config.php is never served (see .htaccess).
return [
  // Where submissions are saved. Best: a folder OUTSIDE public_html, e.g. '/home/USER/leads'.
  // Default when empty: api/data (closed to the web by api/data/.htaccess).
  'LEADS_DIR' => '',

  // Email address that gets a short alert for each new submission (optional).
  'NOTIFY_TO' => '',

  // Any long random string. Used to hash visitor IPs for the rate limit (raw IPs are never stored).
  'HASH_SALT' => 'replace-with-a-long-random-string',

  // At most RATE_MAX submissions per visitor per RATE_WINDOW seconds.
  'RATE_MAX' => 8,
  'RATE_WINDOW' => 600,
];
