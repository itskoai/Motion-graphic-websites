'use client';
/*
 * Scene 4 · #work · עבודות נבחרות (DIRECTION.md §6.4, §7)
 * An editorial index: one row per piece, the title a LetterWindow at ~7vw resting at 500/100 with its window shut.
 * The row in the middle 40vh band (or the hovered/focused row) goes 900/62.5 by class (CSS transition), its window
 * opens with the muted preview and zooms to a mid-scale state (~40vh tall) so visitors who never hover still see the
 * work at size. Click / tap / Enter opens the full-bleed state: a fixed overlay with its own gsap timeline (roof zoom
 * to 1), close control, the row's line and outbound link; it closes on Escape, the close control, scroll-away (>120px)
 * and browser back. Scroll is never locked. Row 07 (clients) is an honest outline row that never opens.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { LetterWindow, type LetterWindowHandle, type MediaSpec } from '@/components/window/LetterWindow';
import { useViewer } from '@/components/ui/Viewer';
import { Rule } from '@/components/ui/Rule';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useSceneProgress, setOverMedia } from '@/lib/scene';
import { useMotionMode } from '@/lib/motion';
import { GLYPHS } from '@/lib/glyphs';
import { he } from '@/content/he';
import { siteConfig } from '@/site.config';
import styles from './Work.module.css';

type Item = (typeof he.work.items)[number];
type Src = { src: string; type: string }[];

/* The zoom canvases are portaled to body with only a z-index to tell them apart: rows get Z0..Z0+5. */
const Z0 = 32;
const MID_H = 0.4;          // the mid-scale preview height as a fraction of the viewport
const SCROLL_AWAY = 120;    // px of scroll that closes the full-bleed state
const REST_GRADE = 0.85;

const videoSrc = (base: string): Src => [{ src: `${base}.webm`, type: 'video/webm' }, { src: `${base}.mp4`, type: 'video/mp4' }];
const VIDEO: Record<string, { base: string; poster: string; aspect: 'portrait' | 'wide'; focus: [number, number] }> = {
  series: { base: '/media/reel', poster: '/media/reel-poster.jpg', aspect: 'portrait', focus: [0.5, 0.3] },
  drill: { base: '/media/work/drill', poster: '/media/work/drill-poster.jpg', aspect: 'portrait', focus: [0.5, 0.4] },
  merch: { base: '/media/site-capture', poster: '/media/site-poster.jpg', aspect: 'wide', focus: [0.5, 0.5] },
  film: { base: '/media/hero-scrub', poster: '/media/hero-poster.jpg', aspect: 'wide', focus: [0.5, 0.5] },
};
const FACES = '/media/merch/faces-itay-720.webp';
const TURN = '/media/merch/turn-itay-720.webp';
/* heroFrames() inserts a slash before the index; the umbrella files are idea/d00.webp, so the list is built here. */
const umbrellaFrames = (portrait: boolean) => Array.from({ length: 32 }, (_, i) => `/media/idea/${portrait ? 'm' : 'd'}${String(i).padStart(2, '0')}.webp`);

const letterOf = (title: string) => title.match(/\[(.)\]/)?.[1] ?? '';

/**
 * The zoom value at which the window letter stands `targetH` px tall (inverse of LetterWindow's roof zoom:
 * k = 1 + e(K-1), e = 4z³ for z < 0.5).
 */
function midZoom(letter: string, fontSize: number, targetH: number) {
  const g = GLYPHS[letter]; if (!g || !fontSize) return 0.3;
  const s = fontSize / 1000;
  const K = Math.max(window.innerWidth / (g.roof.w * s), window.innerHeight / (g.roof.h * s)) * 1.12;
  const k = targetH / (g.bbox.h * s);
  const e = Math.max(0.002, Math.min(0.5, (k - 1) / (K - 1)));
  return Math.cbrt(e / 4);
}

/**
 * Slices a sprite sheet (cols × rows) into blob URLs, one per cell, so a LetterWindow frames media can step through
 * the cells (its cover-fit cannot isolate a cell of a sheet by focus alone). `aspect` pads each cell to that ratio by
 * extending its edge pixels (the turnaround views become 16:9 plates for the full-bleed state).
 */
function useSheetCells(src: string, cols: number, rows: number, aspect: number | null, enabled: boolean) {
  const [urls, setUrls] = useState<string[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const made: string[] = [];
    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      const cw = img.naturalWidth / cols, ch = img.naturalHeight / rows;
      const out: string[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement('canvas');
          let W = Math.round(cw), dx = 0;
          const H = Math.round(ch);
          if (aspect && W / H < aspect) { W = Math.round(H * aspect); dx = Math.round((W - cw) / 2); }
          canvas.width = W; canvas.height = H;
          const ctx = canvas.getContext('2d'); if (!ctx) return;
          const sx = c * cw, sy = r * ch;
          if (dx > 0) {
            ctx.drawImage(img, sx, sy, 1, ch, 0, 0, dx + 1, H);
            ctx.drawImage(img, sx + cw - 1, sy, 1, ch, dx + cw - 1, 0, W - dx - cw + 1, H);
          }
          ctx.drawImage(img, sx, sy, cw, ch, dx, 0, cw, ch);
          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.92));
          if (cancelled) return;
          if (blob) { const u = URL.createObjectURL(blob); made.push(u); out.push(u); }
        }
      }
      if (!cancelled) setUrls(out);
    };
    img.src = src;
    return () => { cancelled = true; img.onload = null; made.forEach((u) => URL.revokeObjectURL(u)); };
  }, [src, cols, rows, aspect, enabled]);
  return urls;
}

export function Work() {
  const root = useRef<HTMLElement>(null);
  const mode = useMotionMode();
  const { open: openViewer } = useViewer();
  const items = he.work.items;
  const still = mode.ready && (mode.reduced || mode.saveData || mode.landscapePhone);
  const live = mode.ready && !still;

  useSceneProgress(root, { start: 'top 60%', end: 'bottom 40%', stop: [1, 4], disabled: still });

  /* ---- media ---- */
  const faceCells = useSheetCells(FACES, 3, 2, null, mode.ready);
  const turnCells = useSheetCells(TURN, 4, 1, 16 / 9, mode.ready);
  const umbrella = useMemo(() => umbrellaFrames(mode.compact), [mode.compact]);
  const media = useMemo<Record<string, { a: MediaSpec; b?: MediaSpec }>>(() => {
    const out: Record<string, { a: MediaSpec; b?: MediaSpec }> = {};
    for (const [id, v] of Object.entries(VIDEO)) {
      out[id] = { a: still ? { kind: 'image', src: v.poster, focus: v.focus } : { kind: 'video', sources: videoSrc(v.base), poster: v.poster, loop: true, focus: v.focus } };
    }
    out.umbrella = { a: still ? { kind: 'image', src: umbrella[0], focus: [0.5, 0.5] } : { kind: 'frames', urls: umbrella, poster: umbrella[0], focus: [0.5, 0.5] } };
    out.faces = {
      a: faceCells ? { kind: 'frames', urls: faceCells, focus: [0.5, 0.5] } : { kind: 'image', src: FACES, focus: [0.5, 0.5] },
      b: turnCells ? { kind: 'frames', urls: turnCells, focus: [0.5, 0.5] } : undefined,
    };
    return out;
  }, [still, umbrella, faceCells, turnCells]);

  /* ---- refs and state ---- */
  const rowEls = useRef<(HTMLLIElement | null)[]>([]);
  const btnEls = useRef<(HTMLButtonElement | null)[]>([]);
  const wins = useRef<(LetterWindowHandle | null)[]>([]);
  const proxies = useRef(items.map(() => ({ z: 0, mix: 0 })));
  const closeBtn = useRef<HTMLButtonElement>(null);
  const overlayEl = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [focusIdx, setFocusIdx] = useState(-1);
  const [bandIdx, setBandIdx] = useState(-1);
  const [openIdx, setOpenIdx] = useState(-1);
  const [shown, setShown] = useState<boolean[]>(() => items.map(() => false));   // window open (media visible)
  const [near, setNear] = useState<boolean[]>(() => items.map(() => false));     // media may decode
  const bandIdxRef = useRef(-1);
  const openRef = useRef(-1);
  const overRef = useRef(false);
  const inBand = useRef<boolean[]>(items.map(() => false));
  const prevActive = useRef(-1);
  const pushed = useRef(false);
  const restoration = useRef<ScrollRestoration>('auto');
  openRef.current = openIdx;

  const canOpen = (i: number) => items[i].id !== 'clients';
  const activeIdx = openIdx >= 0 ? openIdx : (!mode.touch && hoverIdx >= 0) ? hoverIdx : focusIdx >= 0 ? focusIdx : bandIdx;

  const zoomCanvas = (i: number) => document.querySelector<HTMLCanvasElement>(`canvas.win-zoom[style*="z-index: ${Z0 + i}"]`);
  const setZoom = useCallback((i: number, z: number) => {
    wins.current[i]?.set({ zoom: z });
    const over = z > 0.6;
    if (over !== overRef.current) { overRef.current = over; setOverMedia(over); }
    if (overlayEl.current) overlayEl.current.style.setProperty('--f', String(Math.max(0, Math.min(1, (z - 0.72) / 0.26))));
  }, []);
  const midFor = useCallback((i: number) => {
    const btn = btnEls.current[i]; if (!btn) return 0.3;
    const fs = parseFloat(getComputedStyle(btn).fontSize);
    return midZoom(letterOf(items[i].title), fs, window.innerHeight * MID_H);
  }, [items]);

  const tweenTo = useCallback((i: number, z: number, dur: number, ease: string, onComplete?: () => void) => {
    const p = proxies.current[i];
    gsap.killTweensOf(p, 'z');
    gsap.to(p, { z, duration: dur, ease, overwrite: 'auto', onUpdate: () => setZoom(i, p.z), onComplete });
  }, [setZoom]);

  /* Activate: open the window, grow the letter to the mid-scale preview. Deactivate: shrink, then shut. */
  const activate = useCallback((i: number) => {
    if (!canOpen(i)) return;
    setShown((s) => (s[i] ? s : s.map((v, k) => (k === i ? true : v))));
    tweenTo(i, midFor(i), 0.6, 'power3.out');
  }, [midFor, tweenTo]); // eslint-disable-line react-hooks/exhaustive-deps
  const deactivate = useCallback((i: number) => {
    if (!canOpen(i)) return;
    const p = proxies.current[i];
    tweenTo(i, 0, 0.4 + 0.4 * p.z, 'power3.out', () => {
      // LetterWindow leaves the last frame on its zoom canvas when zoom returns to 0; clear it so no letter floats.
      const c = zoomCanvas(i); c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
      setShown((s) => s.map((v, k) => (k === i ? false : v)));
    });
  }, [tweenTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!live) return;
    const prev = prevActive.current;
    if (prev === activeIdx) return;
    prevActive.current = activeIdx;
    if (prev >= 0 && prev !== openIdx) deactivate(prev);
    if (activeIdx >= 0 && activeIdx !== openIdx) activate(activeIdx);
  }, [activeIdx, openIdx, live, activate, deactivate]);

  /* ---- per-row ScrollTriggers: the band (activation + frame scrub) and a wider "near" range (media decode) ---- */
  useEffect(() => {
    if (!live) return;
    const triggers: ScrollTrigger[] = [];
    const resolve = () => {
      const mid = window.innerHeight / 2;
      let best = -1, bestD = Infinity;
      rowEls.current.forEach((el, i) => {
        if (!el || !inBand.current[i] || !canOpen(i)) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      const cur = bandIdxRef.current;
      if (cur >= 0 && cur !== best && inBand.current[cur] && rowEls.current[cur]) {
        const r = rowEls.current[cur]!.getBoundingClientRect();
        if (Math.abs(r.top + r.height / 2 - mid) < bestD + 48) best = cur;   // hysteresis
      }
      if (best !== cur) { bandIdxRef.current = best; setBandIdx(best); }
    };
    rowEls.current.forEach((el, i) => {
      if (!el) return;
      const scrubs = items[i].id === 'umbrella' || items[i].id === 'faces';
      triggers.push(ScrollTrigger.create({
        trigger: el, start: 'top 70%', end: 'bottom 30%',
        onToggle: (self) => { inBand.current[i] = self.isActive; resolve(); },
        onUpdate: (self) => { if (scrubs && openRef.current !== i) wins.current[i]?.set({ frame: self.progress }); resolve(); },
      }));
      triggers.push(ScrollTrigger.create({
        trigger: el, start: 'top 130%', end: 'bottom -30%',
        onToggle: (self) => setNear((n) => (n[i] === self.isActive ? n : n.map((v, k) => (k === i ? self.isActive : v)))),
      }));
    });
    // A frames/image row at mid-zoom only redraws on set(); keep its big letter glued to the row while scrolling.
    const onScroll = () => { const i = prevActive.current; if (i >= 0 && proxies.current[i].z > 0) wins.current[i]?.redraw(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { triggers.forEach((t) => t.kill()); window.removeEventListener('scroll', onScroll); };
  }, [live, items]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- full-bleed state ---- */
  const closeFull = useCallback((reason: 'ui' | 'pop' | 'scroll' = 'ui') => {
    const i = openRef.current; if (i < 0) return;
    openRef.current = -1;
    setOpenIdx(-1);
    const p = proxies.current[i];
    gsap.killTweensOf(p, 'mix');
    if (p.mix > 0) gsap.to(p, { mix: 0, duration: 0.5, ease: 'power2.inOut', onUpdate: () => wins.current[i]?.set({ mix: p.mix }) });
    const stays = (!mode.touch && hoverIdx === i) || focusIdx === i || bandIdxRef.current === i;
    if (still) {
      setZoom(i, 0);
      const c = zoomCanvas(i); c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    } else if (stays) {
      tweenTo(i, midFor(i), 0.8, 'power3.inOut');
    }
    // otherwise the activation effect shrinks it (prev !== next active)
    if (pushed.current && reason !== 'pop') { pushed.current = false; history.back(); }
    if (reason === 'pop') pushed.current = false;
    history.scrollRestoration = restoration.current;
    btnEls.current[i]?.focus({ preventScroll: true });
  }, [mode.touch, hoverIdx, focusIdx, still, setZoom, tweenTo, midFor]);

  const openFull = useCallback((i: number) => {
    if (!canOpen(i) || openRef.current === i) return;
    const it = items[i];
    const v = VIDEO[it.id];
    if (still && v) {
      openViewer({ title: it.plain, sources: videoSrc(v.base), poster: v.poster, aspect: v.aspect, note: he.work.charactersNote }, btnEls.current[i]);
      return;
    }
    openRef.current = i;
    setOpenIdx(i);
    setShown((s) => (s[i] ? s : s.map((x, k) => (k === i ? true : x))));
    restoration.current = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    history.pushState({ work: it.id }, '');
    pushed.current = true;
    const p = proxies.current[i];
    if (still) { setZoom(i, 1); if (it.id === 'faces') { p.mix = 1; wins.current[i]?.set({ mix: 1, frame: 0 }); } }
    else {
      tweenTo(i, 1, 0.9, 'power3.inOut');
      if (it.id === 'faces') { gsap.killTweensOf(p, 'mix'); wins.current[i]?.set({ frame: 0 }); gsap.to(p, { mix: 1, duration: 0.5, delay: 0.25, ease: 'power2.inOut', onUpdate: () => wins.current[i]?.set({ mix: p.mix }) }); }
    }
    requestAnimationFrame(() => closeBtn.current?.focus({ preventScroll: true }));
  }, [items, still, openViewer, setZoom, tweenTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape, scroll-away, browser back, and the turnaround spin (pointer x on desktop, scroll on everything)
  useEffect(() => {
    if (openIdx < 0) return;
    const i = openIdx;
    const y0 = window.scrollY;
    const faces = items[i].id === 'faces';
    let view = 0;
    const setView = (v: number) => { v = ((v % 4) + 4) % 4; if (v !== view) { view = v; wins.current[i]?.set({ frame: v / 3 }); } };
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); closeFull('ui'); } };
    const onScroll = () => {
      const dy = window.scrollY - y0;
      if (Math.abs(dy) > SCROLL_AWAY) { closeFull('scroll'); return; }
      if (faces) setView(Math.floor(Math.abs(dy) / 30));
    };
    const onPop = () => closeFull('pop');
    const onMove = (e: PointerEvent) => { if (e.pointerType === 'mouse') setView(Math.floor((1 - e.clientX / window.innerWidth) * 4)); };
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onPop);
    if (faces) window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('pointermove', onMove);
    };
  }, [openIdx, items, closeFull]);

  // Leaving the scene: never leave the header in its over-media state
  useEffect(() => () => { if (overRef.current) setOverMedia(false); }, []);

  /* ---- reduced motion: every window open on its poster, rows static at 900/62.5 ---- */
  useEffect(() => {
    if (!still) return;
    setShown(items.map((it) => it.id !== 'clients'));
    setNear(items.map(() => true));
  }, [still, items]);

  const onRowKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    // Enter and Space already click a button; Escape on a focused row shuts its preview by blurring.
    if (e.key === 'Escape' && openRef.current < 0) { e.currentTarget.blur(); setFocusIdx(-1); }
  };

  const openItem = openIdx >= 0 ? items[openIdx] : null;
  const openUrl = openItem ? (openItem.id === 'series' ? siteConfig.projects.series.url : openItem.id === 'merch' ? siteConfig.projects.merch.url : '') : '';
  const openVideo = openItem ? VIDEO[openItem.id] : undefined;

  return (
    <section ref={root} id="work" data-scene="Work" className={`${styles.scene} ${live ? styles.live : ''}`}>
      <div className="wrap">
        <header className={styles.head}>
          <p className="kicker">{he.work.kicker}</p>
          <h2 className={`hl hl-m ${styles.h2}`}>{he.work.srTitle}</h2>
          <p className={`lede ${styles.lede}`}>{he.work.lede}</p>
        </header>

        <ol className={styles.index}>
          {items.map((it: Item, i) => {
            const isClients = it.id === 'clients';
            const on = live ? activeIdx === i : still;
            const m = media[it.id];
            const style = { '--i': i } as CSSProperties;
            return (
              <li
                key={it.id}
                ref={(el) => { rowEls.current[i] = el; }}
                className={`${styles.row} ${on ? styles.on : ''} ${isClients ? styles.outline : ''} ${openIdx === i ? styles.open : ''}`}
                style={style}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse' && !isClients) setHoverIdx(i); }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHoverIdx((h) => (h === i ? -1 : h)); }}
              >
                <span className={`edge ${styles.n}`} dir="ltr">{it.n}</span>
                <div className={styles.titleCell}>
                  {isClients ? (
                    <h3 className={`hl ${styles.title} ${styles.t}`}>{it.plain}</h3>
                  ) : (
                    <h3 className={styles.title}>
                      <button
                        ref={(el) => { btnEls.current[i] = el; }}
                        type="button"
                        className={`${styles.tbtn} ${shown[i] ? '' : 'win-off'}`}
                        aria-expanded={openIdx === i}
                        aria-label={it.plain}
                        onClick={() => openFull(i)}
                        onFocus={() => setFocusIdx(i)}
                        onBlur={() => setFocusIdx((f) => (f === i ? -1 : f))}
                        onKeyDown={onRowKey}
                      >
                        <LetterWindow
                          ref={(h) => { wins.current[i] = h; }}
                          as="span"
                          className={styles.t}
                          text={it.title}
                          media={m.a}
                          mediaB={m.b}
                          active={near[i]}
                          grade={REST_GRADE}
                          restScale={1}
                          zIndex={Z0 + i}
                        />
                      </button>
                    </h3>
                  )}
                  <div className={styles.meta}>
                    {it.code && <span className={`edge ${styles.code}`} dir="ltr">{it.code}</span>}
                    <p className={styles.line}>{it.line}</p>
                  </div>
                </div>
                <div className={styles.tagCell}>
                  {it.tag && <span className={styles.tag}>{it.tag}</span>}
                  {it.label && <span className={styles.label}>{it.label}</span>}
                </div>
              </li>
            );
          })}
        </ol>

        <footer className={styles.foot}>
          <p className={styles.note}>{he.work.charactersNote}</p>
          <a className={`cta ${styles.ask}`} href="#contact">{he.work.ask}<Rule className="rule" /></a>
        </footer>
      </div>

      {openItem && (
        <div ref={overlayEl} className={styles.overlay} role="dialog" aria-label={openItem.plain} style={{ '--f': still ? 1 : 0 } as CSSProperties}>
          <button ref={closeBtn} type="button" className={styles.close} onClick={() => closeFull('ui')}>{he.work.close}</button>
          <div className={styles.cap}>
            <p className={styles.capTitle}><span className="edge" dir="ltr">{openItem.n}</span> {openItem.plain}</p>
            <p className={styles.capLine}>{openItem.line}</p>
            <p className={styles.capActions}>
              {openVideo && !still && (
                <button type="button" className={styles.capBtn} onClick={(e) => openViewer({ title: openItem.plain, sources: videoSrc(openVideo.base), poster: openVideo.poster, aspect: openVideo.aspect, note: he.work.charactersNote }, e.currentTarget)}>{he.work.view}</button>
              )}
              {openUrl && <a className={styles.capBtn} href={openUrl} target="_blank" rel="noopener noreferrer">{openItem.plain} ↗</a>}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
