'use client';
/*
 * Scene 1 · #top · פתיחה (DIRECTION.md §6.1, §7).
 * Paper, a right-aligned two-line headline at 11vw; the ם of ראיתם is the window. At rest the 4s light-slit loop
 * plays inside the letter; the pinned scroll zooms into the letter's roof until the opening film is full-bleed,
 * the loop crossfading to the film's frames (scrubbed by p) on the way. Everything scroll-driven is a pure
 * function of p (reversible); the only timed motion is the 1.2s entrance (words arrive right to left, weight
 * 100→900 and width 100→62.5 per word, snapped to 30 steps; the window opens when the words have landed).
 *
 * SSR: the headline, the positioning line and the CTAs are real text and read without JavaScript. The entrance
 * start state is applied on the client only, in a layout effect before the first paint.
 *
 * Workaround (shared primitive): LetterWindow portals its zoom canvas to <body> as position:fixed and keeps the
 * last drawing when zoom returns to 0 or the pin releases. This scene finds its own zoom canvas (by its unique
 * z-index) and (a) hides it while zoom is 0, (b) moves it up with the section once the pin has released, so the
 * full-bleed footage scrolls away like part of the sheet and the next scene's paper slides in from below.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/gsap';
import { LetterWindow, type LetterWindowHandle, type MediaSpec } from '@/components/window/LetterWindow';
import { Rule } from '@/components/ui/Rule';
import { useViewer, type ViewerItem } from '@/components/ui/Viewer';
import { useSceneProgress, seg, smooth, setOverMedia } from '@/lib/scene';
import { useMotionMode } from '@/lib/motion';
import { heroFrames } from '@/lib/frames';
import { he } from '@/content/he';
import styles from './Hero.module.css';

const STOP: [number, number] = [1, 1];
/** The hero's zoom canvas layer (unique on the page so the scene can find it); the play affordance sits one above. */
const Z = 32;
const NAV_H = 64;

const LOOP: MediaSpec = {
  kind: 'video',
  sources: [{ src: '/media/door-loop.webm', type: 'video/webm' }, { src: '/media/door-loop.mp4', type: 'video/mp4' }],
  poster: '/media/door-poster.jpg',
  loop: true,
  focus: [0.14, 0.5],
};
const STILL: MediaSpec = { kind: 'image', src: '/media/door-poster.jpg', focus: [0.14, 0.5] };
const REEL: ViewerItem = {
  title: he.hero.reelTitle,
  sources: [{ src: '/media/reel.webm', type: 'video/webm' }, { src: '/media/reel.mp4', type: 'video/mp4' }],
  poster: '/media/reel-poster.jpg',
  aspect: 'portrait',
  note: he.hero.reelNote,
};

const plain = (s: string) => s.replace(/[[\]]/g, '');
const WIN_RE = /\[.\]/;

type Phase = 'ssr' | 'enter' | 'open';

/** The motion decision for the entrance, read synchronously before the first paint (useMotionMode is one render late). */
function motionAllowedNow() {
  const mm = (q: string) => window.matchMedia(q).matches;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (document.documentElement.dataset.motion === 'off') return false;
  if (mm('(prefers-reduced-motion: reduce)')) return false;
  if (nav.connection?.saveData) return false;
  if (mm('(orientation: landscape) and (max-height: 560px)')) return false;
  return true;
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const win = useRef<LetterWindowHandle>(null);
  const sub = useRef<HTMLSpanElement>(null);
  const cue = useRef<HTMLSpanElement>(null);
  const play = useRef<HTMLButtonElement>(null);
  const zoomCanvas = useRef<HTMLCanvasElement | null>(null);
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const [phase, setPhase] = useState<Phase>('ssr');
  const [near, setNear] = useState(true);
  const mode = useMotionMode();
  const { open } = useViewer();

  // Reduced motion, save-data and landscape phones: no pin, no scrub, no entrance; the ם holds the slit still.
  const still = mode.reduced || mode.saveData || mode.landscapePhone;
  const compact = mode.compact;
  const modeRef = useRef({ still, compact });
  modeRef.current = { still, compact };

  const frames = useMemo(() => (compact ? heroFrames(68, '/media/herom', 2, 'webp', 0) : heroFrames(134, '/media/hero', 3, 'webp', 1)), [compact]);
  const media = useMemo<MediaSpec>(() => (still ? STILL : LOOP), [still]);
  const mediaB = useMemo<MediaSpec | undefined>(
    () => (still ? undefined : { kind: 'frames', urls: frames, poster: compact ? '/media/hero-poster-m.jpg' : '/media/hero-poster.jpg' }),
    [still, frames, compact],
  );

  // The headline lines: two on desktop, three on phones (the last line alone and larger).
  const lines = useMemo<readonly string[]>(() => (mode.ready && compact ? he.hero.h1Phone : [he.hero.h1a, he.hero.h1b]), [mode.ready, compact]);
  const label = useMemo(() => plain(lines.join(' ')), [lines]);

  /* ---------- the hero's zoom canvas (see the header comment) ---------- */
  const findZoomCanvas = useCallback(() => {
    const c = zoomCanvas.current;
    if (c && c.isConnected) return c;
    zoomCanvas.current = null;
    for (const el of document.querySelectorAll<HTMLCanvasElement>('canvas.win-zoom')) {
      if (getComputedStyle(el).zIndex === String(Z)) { zoomCanvas.current = el; break; }
    }
    return zoomCanvas.current;
  }, []);

  /** Keeps the fixed layers (zoom canvas, play affordance, header state) consistent with the section's position. */
  const sync = useCallback(() => {
    const el = root.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const z = win.current?.get().zoom ?? 0;
    const off = Math.min(0, Math.round(r.top)); // < 0 once the pin has released and the sheet scrolls on
    const visible = z > 0.0005 && r.bottom > 0;
    const c = findZoomCanvas();
    if (c) {
      c.style.transform = off ? `translate3d(0, ${off}px, 0)` : '';
      c.style.visibility = visible ? '' : 'hidden';
    }
    const p = play.current;
    if (p) p.dataset.on = z > 0.9 && off === 0 ? '1' : '';
    setOverMedia(z > 0.6 && r.bottom > NAV_H);
  }, [findZoomCanvas]);

  /* ---------- scroll: p → zoom / mix / frame ---------- */
  const fade = useRef<((v: number) => void) | null>(null);
  const onProgress = useCallback((p: number) => {
    const el = root.current; if (!el) return;
    if (!fade.current) fade.current = gsap.quickSetter(el, '--fade') as (v: number) => void;
    if (modeRef.current.still) {
      win.current?.set({ zoom: 0, mix: 0, frame: 0, opened: true });
      fade.current(1);
      sync();
      return;
    }
    const zoom = seg(p, 0.12, 0.8);
    const mix = seg(p, 0.22, 0.38);
    const frame = seg(p, 0.3, 0.95);
    win.current?.set({ zoom, mix, frame });
    // The kicker, the positioning line and the CTAs step aside while the letter grows (type only)
    fade.current(1 - smooth(seg(zoom, 0.1, 0.45)));
    // A visitor who scrolls during the entrance gets the finished headline at once
    if (p > 0.1 && entrance.current) entrance.current.progress(1);
    sync();
  }, [sync]);

  useSceneProgress(root, { pin: true, end: compact ? '+=200%' : '+=300%', scrub: 0.3, stop: STOP, onProgress, disabled: still });

  useEffect(() => {
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      setOverMedia(false);
      const c = zoomCanvas.current;
      if (c) { c.style.transform = ''; c.style.visibility = ''; }
    };
  }, [sync]);

  // Media decodes and plays only while the scene is near the viewport
  useEffect(() => {
    const el = root.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '40px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ---------- entrance (1.2s, once, before the first paint on the client) ---------- */
  const wordEls = useCallback(() => (root.current ? Array.from(root.current.querySelectorAll<HTMLElement>(`.${styles.w}`)) : []), []);
  const applyWord = useCallback((el: HTMLElement, t: number) => {
    const s = Math.round(t * 30) / 30; // 30 steps on both axes
    el.style.setProperty('--w', String(100 + 800 * s));
    if (!modeRef.current.compact) el.style.setProperty('--wd', String(100 - 37.5 * s)); // phones animate weight only
  }, []);

  // Decide once, synchronously, so the hydrated paint already shows the start state (no pop from 900 to 100)
  useLayoutEffect(() => {
    if (phase !== 'ssr') return;
    setPhase(motionAllowedNow() && window.scrollY <= 40 ? 'enter' : 'open');
  }, [phase]);

  // While entering and before the tween starts, every commit re-applies the start state to the current words
  // (the phone line split arrives one render after mount)
  useLayoutEffect(() => {
    if (phase !== 'enter' || entrance.current) return;
    for (const el of wordEls()) applyWord(el, 0);
    if (sub.current) sub.current.style.opacity = '0';
    if (cue.current) cue.current.style.opacity = '0';
  });

  useEffect(() => {
    if (phase !== 'enter' || !mode.ready || entrance.current) return;
    if (still) { setPhase('open'); return; }
    let cancelled = false;
    const start = () => {
      if (cancelled || entrance.current) return;
      const words = wordEls();
      const tl = gsap.timeline({ onComplete: () => { entrance.current = null; } });
      const D = 0.82, STAG = 0.04;
      words.forEach((el, i) => {
        const o = { t: 0 };
        tl.to(o, { t: 1, duration: D, ease: 'power3.out', onUpdate: () => applyWord(el, o.t) }, i * STAG);
      });
      const landed = D + STAG * Math.max(0, words.length - 1);
      tl.add(() => setPhase('open'), landed - 0.08); // the window opens as the last word lands
      tl.to([sub.current, cue.current].filter(Boolean), { opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.1 }, landed - 0.15);
      entrance.current = tl;
    };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const timeout = new Promise<void>((r) => setTimeout(r, 900));
    Promise.race([fonts, timeout]).then(start);
    return () => { cancelled = true; };
  }, [phase, mode.ready, still, wordEls, applyWord]);

  // If motion is switched off mid-entrance, land everything at once
  useEffect(() => {
    if (!still) return;
    entrance.current?.progress(1).kill();
    entrance.current = null;
    for (const el of wordEls()) { el.style.removeProperty('--w'); el.style.removeProperty('--wd'); }
    if (sub.current) sub.current.style.opacity = '';
    if (cue.current) cue.current.style.opacity = '';
    setPhase('open');
  }, [still, wordEls]);

  useEffect(() => () => { entrance.current?.kill(); entrance.current = null; }, []);

  const entering = phase === 'enter';
  const openReel = (e: React.MouseEvent<HTMLButtonElement>) => open(REEL, e.currentTarget);

  return (
    <section ref={root} id="top" data-scene="Hero" className={`${styles.root} ${still ? styles.still : ''}`}>
      <div className={`wrap ${styles.inner}`}>
        <p className={`kicker ${styles.kicker} ${styles.fade}`}>{he.hero.kicker}</p>
        <h1 className={`hl hl-xl ${styles.h1} ${entering ? styles.entering : ''}`} aria-label={label}>
          {lines.map((line, li) => (
            <span key={line} className={`${styles.line} ${li === lines.length - 1 ? styles.last : ''}`} aria-hidden="true">
              {line.split(' ').map((word, wi) => (
                <span key={`${li}-${wi}`}>
                  {wi > 0 ? ' ' : null}
                  {WIN_RE.test(word) ? (
                    <LetterWindow
                      ref={win}
                      as="span"
                      className={`${styles.w} ${entering ? 'win-off' : ''}`}
                      text={word}
                      media={media}
                      mediaB={mediaB}
                      active={near}
                      grade={0.85}
                      restScale={compact ? 1.25 : 1.5}
                      zIndex={Z}
                      label={plain(word)}
                    />
                  ) : (
                    <span className={styles.w}>{word}</span>
                  )}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className={`${styles.sub} ${styles.fade}`}><span ref={sub}>{he.hero.sub}</span></p>
        <div className={`${styles.ctas} ${styles.fade}`}>
          <a className="cta" href="#contact">{he.hero.ctaPrimary}<Rule className="rule" delay={1.05} /></a>
          <button type="button" className={styles.reel} onClick={openReel}>
            <svg className={styles.tri} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 1.5 10.5 6 2.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
            <span>{he.hero.ctaReel}</span>
          </button>
        </div>
        <p className={styles.cue} aria-hidden="true"><span ref={cue} className={styles.cueText}>{he.hero.scrollCue}</span></p>
      </div>
      {phase !== 'ssr' && !still && typeof document !== 'undefined' && createPortal(
        <button ref={play} type="button" className={styles.play} style={{ zIndex: Z + 1 }} onClick={openReel} data-on="">
          <svg className={styles.playTri} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 2 13.5 8 3.5 14Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /></svg>
          <span>{he.hero.reelPlay}</span>
        </button>,
        document.body,
      )}
    </section>
  );
}
