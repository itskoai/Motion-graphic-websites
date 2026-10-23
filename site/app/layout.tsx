import type { Metadata, Viewport } from 'next';
import './globals.css';
import { he } from '@/content/he';
import { siteConfig } from '@/site.config';
import { Nav } from '@/components/ui/Nav';
import { ViewerProvider } from '@/components/ui/Viewer';
import { EdgeCode } from '@/components/frame/EdgeCode';

const title = `${siteConfig.brand.name} · ${he.meta.title}`;

export const metadata: Metadata = {
  title,
  description: he.meta.description,
  metadataBase: new URL(siteConfig.siteUrl),
  openGraph: { type: 'website', locale: 'he_IL', siteName: siteConfig.brand.name, title, description: he.meta.description, images: [{ url: '/media/og.jpg', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', images: ['/media/og.jpg'] },
  // While the studio name is a working name, search engines are asked to wait.
  robots: siteConfig.brand.isWorkingName ? { index: false, follow: false } : { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = { themeColor: '#F1EADC', colorScheme: 'light', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" data-material="paper">
      <head>
        <link rel="preload" href="/fonts/noto-serif-hebrew-var-hebrew.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/plex-hebrew-300.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem('motion')==='off')document.documentElement.dataset.motion='off'}catch(e){}` }} />
      </head>
      <body>
        <ViewerProvider>
          <Nav />
          <EdgeCode />
          <main id="main" tabIndex={-1}>{children}</main>
        </ViewerProvider>
      </body>
    </html>
  );
}
