<?php
/**
 * Form backend settings. Copy this file to config.php (same folder) and fill it in before going live.
 * config.php is never served (api/.htaccess denies it, and run as PHP it prints nothing).
 * No passwords or API keys go here: lead.php needs none. Its random secret is created by itself (DATA_DIR/.salt).
 *
 * After filling it, run review/studio/tools/predeploy.sh from the repo root. It refuses to pass while
 * NOTIFY_TO or MAIL_FROM is empty, or while LEADS_DIR points at a temp folder.
 */
return [
  // Where submissions are saved. Empty = a "site-leads" folder created next to public_html (outside the web),
  // or api/data if the host does not allow that (files there get unguessable .php names that print nothing).
  // To choose yourself, give a full path OUTSIDE public_html, e.g. '/home/u123456789/domains/example.co.il/site-leads'.
  // Never a temp folder (/tmp and the like): lead.php refuses to run with one, because temp folders get wiped.
  'LEADS_DIR' => '',

  // REQUIRED for going live. The studio mailbox that gets a copy of every new inquiry, so nobody waits unseen.
  // privacy.html tells visitors that a copy is sent to the studio's mailbox.
  'NOTIFY_TO' => '',

  // REQUIRED for going live. The sender address for every mail the site sends (inquiry copies, confirmation mails).
  // Use an address on your own domain that exists in the hosting mail panel (Hostinger: Emails), e.g. 'site@example.co.il',
  // so SPF/DKIM pass and the mail does not land in spam. Never taken from the visitor's request.
  'MAIL_FROM' => '',

  // Optional. Shown on the error page that visitors without JavaScript get, so they can still reach you.
  // Usually the same address as contact.email in assets/config.js.
  'CONTACT_EMAIL' => '',

  // Double opt-in: right after someone joins the list, they get a short mail with a confirm link (needs MAIL_FROM
  // and SITE_URL). Keep it true: privacy.html promises that a mailing service only ever gets confirmed addresses.
  'CONFIRM_EMAILS' => true,

  // The live address of the site, where index.html lives, with https and no trailing slash, e.g. 'https://example.co.il'.
  // Used only to build the confirm link in confirmation mails.
  'SITE_URL' => '',

  // Optional. Only if the site sits behind a proxy or CDN (for example Cloudflare): the proxy addresses or
  // ranges, e.g. ['173.245.48.0/20', '2400:cb00::/32']. Only requests that come from these addresses may name the
  // visitor's IP in CF-Connecting-IP or X-Forwarded-For. Leave empty on plain hosting.
  'TRUSTED_PROXIES' => [],

  // Per visitor: at most RATE_MAX submissions per RATE_WINDOW seconds (IPv4 address, or the IPv6 /64).
  'RATE_MAX' => 8,
  'RATE_WINDOW' => 600,

  // Whole site: at most SITE_MAX saved submissions per SITE_WINDOW seconds, so a flood cannot fill the disk.
  'SITE_MAX' => 60,
  'SITE_WINDOW' => 600,

  // A monthly file stops taking new lines at this size (in MB). The form then says it is busy; nothing is lost silently.
  'MAX_FILE_MB' => 20,
  // Security tripwire (see lead_php_patched in lead.php). Leave false. Set true ONLY if your host confirmed in
  // writing that its PHP build includes the PHP2Shell fix although the version number is older.
  'ALLOW_UNPATCHED_PHP' => false,
];
