/*
 * SITE CONFIG. Every fact about the studio that is not confirmed yet lives here, and only here.
 * Empty strings are on purpose: the page hides whatever is empty instead of showing a placeholder.
 * Fill a value, save, reload. Nothing else needs to change.
 *
 * NEVER put secrets here (API keys, passwords). This file is public.
 * Form delivery secrets, if any, go in api/config.php (server side, not in this folder's public files).
 */
window.SITE_CONFIG = {
  // TO CONFIRM: "OUTFRAME" is a working name. Change it here and in the <title>/meta tags of index.html and privacy.html.
  brand: {
    name: 'OUTFRAME',
    isWorkingName: true
  },

  // DEPLOY STEP: the live address, e.g. 'https://example.co.il'. Used for share links and the privacy page.
  siteUrl: '',

  // TO CONFIRM: real contact details. Empty = hidden on the page.
  contact: {
    email: '',      // shown as "אפשר גם ישירות במייל" under the inquiry form, and on the privacy page
    phone: '',      // optional, e.g. '050-000-0000'
    whatsapp: ''    // optional, full link, e.g. 'https://wa.me/9725...'
  },

  // TO CONFIRM: social profiles. Empty url = not shown.
  socials: [
    { label: 'Instagram', url: '' },
    { label: 'TikTok', url: '' },
    { label: 'YouTube', url: '' },
    { label: 'Facebook', url: '' }
  ],

  // TO CONFIRM: the two founders. Leave empty until real details and real photos exist.
  // Never use generated portraits here. photo = a path like 'assets/media/founder-a.jpg'.
  founders: [
    { name: '', role: '', photo: '' },
    { name: '', role: '', photo: '' }
  ],

  // Where the two forms send. 'auto' picks the right path by itself:
  //   - inside the claude.ai preview: the preview's own private storage
  //   - on your own hosting: endpoint below (api/lead.php stores every submission on the server)
  // Set endpoint to another URL (Formspree, a CRM webhook, etc.) to send there instead. It must answer JSON {"ok":true}.
  forms: {
    mode: 'auto',               // 'auto' | 'endpoint' | 'preview'
    endpoint: 'api/lead.php'
  },

  // Links for the selected work. Empty = no outbound link button.
  projects: {
    series: { url: '' },        // TO CONFIRM: the social page where "דור העתיד" lives
    merch: { url: '' }          // TO CONFIRM: the live address of the merch website, once it is online
  },

  // TO CONFIRM: Israeli service-accessibility rules ask for a named contact for accessibility requests.
  accessibility: {
    coordinator: ''             // e.g. 'שם מלא, 050-000-0000'. Shown on accessibility.html when filled.
  },

  // Analytics: off. If you add any, update privacy.html first.
  analytics: false
};
