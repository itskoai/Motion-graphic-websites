/*
 * SITE CONFIG. Every fact about the studio that is not confirmed yet lives here, and only here.
 * Empty strings are on purpose: the page hides what is empty (or shows a clearly labelled placeholder)
 * instead of inventing anything. Fill a value, save, rebuild.
 *
 * NEVER put secrets here. This file is public.
 */
export type Founder = { name: string; role: string; photo: string; lines: string[] };
export type SiteConfig = {
  brand: { name: string; isWorkingName: boolean; tagline: string };
  contact: { email: string; phone: string; whatsapp: string; replyNote: string };
  founders: Founder[];
  socials: { label: string; url: string }[];
  forms: { endpoint: string };
  projects: { series: { url: string }; merch: { url: string } };
  legal: { owner: string; businessId: string; email: string; accessibilityCoordinator: string };
  siteUrl: string;
};

export const siteConfig: SiteConfig = {
  brand: {
    // TO CONFIRM: a working name. Shown as the wordmark, in <title>, in share cards.
    name: 'OUTFRAME',
    isWorkingName: true,
    // One line under the wordmark and in search results.
    tagline: 'סטודיו ליצירה דיגיטלית וקולנוע AI',
  },

  // TO CONFIRM: real contact details. Empty = hidden on the page.
  contact: {
    email: '',       // e.g. 'hello@your-domain.co.il'
    phone: '',       // e.g. '050-000-0000'
    whatsapp: '',    // digits only, international form, e.g. '972500000000'
    replyNote: '',   // optional, e.g. 'בדרך כלל אנחנו עונים תוך יום עבודה.'
  },

  // TO CONFIRM: the two founders. Leave empty until real names, roles and real portraits exist.
  // Never use generated portraits here. photo = a path like '/media/founders/a.jpg' (3:4 portrait recommended).
  founders: [
    { name: '', role: '', photo: '', lines: [] },
    { name: '', role: '', photo: '', lines: [] },
  ],

  // TO CONFIRM: social profiles. Empty url = not shown.
  socials: [
    { label: 'Instagram', url: '' },
    { label: 'TikTok', url: '' },
    { label: 'YouTube', url: '' },
  ],

  // Where the two forms send. The default is the PHP endpoint shipped in public/api (works on any PHP host).
  // It must answer JSON {"ok":true} only after saving. Empty = forms show the direct-contact fallback.
  forms: {
    endpoint: '/api/lead.php',
  },

  // Links for the selected work. Empty = no outbound link.
  projects: {
    series: { url: '' },   // TO CONFIRM: where "דור העתיד" lives
    merch: { url: '' },    // TO CONFIRM: the merch site's live address
  },

  // TO CONFIRM: who legally owns the site (privacy page) and the accessibility contact.
  legal: {
    owner: '',
    businessId: '',
    email: '',
    accessibilityCoordinator: '',
  },

  // The live address once deployed (canonical, og:url). TO CONFIRM.
  siteUrl: 'https://DEPLOY-DOMAIN',
};
