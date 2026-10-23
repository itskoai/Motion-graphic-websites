'use client';
import { useEffect, useRef, useState } from 'react';
import { he } from '@/content/he';
import { siteConfig } from '@/site.config';
import { readMotionPref, setMotionOff } from '@/lib/motion';
import styles from './Nav.module.css';

const LINKS = [
  { href: '#create', label: he.nav.create },
  { href: '#story', label: he.nav.story },
  { href: '#work', label: he.nav.work },
  { href: '#creators', label: he.nav.creators },
  { href: '#process', label: he.nav.process },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [motionOff, setOff] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const pref = readMotionPref();
    if (pref) { setOff(true); setMotionOff(true); }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    sheet.current?.querySelector<HTMLElement>('a')?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [open]);

  const toggleMotion = () => { const next = !motionOff; setOff(next); setMotionOff(next); };

  return (
    <>
      <a className={`sr-only ${styles.skip}`} href="#main">{he.nav.skip}</a>
      <header className={`${styles.head} ${scrolled ? styles.scrolled : ''}`} data-nav>
        <div className={`wrap ${styles.inner}`}>
          <a className={styles.mark} href="#top" aria-label={`${siteConfig.brand.name}, ${he.nav.toTop}`}>
            <span className={styles.markFrame} aria-hidden="true"><i /><i /><i /><i /></span>
            <span className={styles.markName} dir="ltr">{siteConfig.brand.name}</span>
          </a>
          <nav className={styles.nav} aria-label="ניווט ראשי">
            <ul>{LINKS.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}</ul>
          </nav>
          <div className={styles.actions}>
            <button type="button" className={styles.motion} aria-pressed={motionOff} onClick={toggleMotion} title={motionOff ? he.nav.motionOn : he.nav.motionOff}>
              <span className={styles.motionIco} aria-hidden="true" />
              <span className="sr-only">{motionOff ? he.nav.motionOn : he.nav.motionOff}</span>
            </button>
            <a className={`btn btn-ghost ${styles.cta}`} href="#contact">{he.nav.contact}</a>
            <button ref={btn} type="button" className={styles.menuBtn} aria-expanded={open} aria-controls="menu-sheet" onClick={() => setOpen((o) => !o)}>
              <span className={styles.menuLines} aria-hidden="true" /><span>{open ? he.nav.close : he.nav.menu}</span>
            </button>
          </div>
        </div>
      </header>
      <div ref={sheet} id="menu-sheet" className={styles.sheet} hidden={!open} onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); }}>
        <nav aria-label={he.nav.menu}>
          <ul>
            {LINKS.map((l, i) => <li key={l.href} style={{ '--i': i } as React.CSSProperties}><a href={l.href}>{l.label}</a></li>)}
            <li style={{ '--i': LINKS.length } as React.CSSProperties}><a href="#contact" className={styles.sheetCta}>{he.nav.contact}</a></li>
          </ul>
        </nav>
      </div>
    </>
  );
}
