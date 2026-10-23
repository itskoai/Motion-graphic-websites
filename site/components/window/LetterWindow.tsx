'use client';
/*
 * LetterWindow: a headline rendered as real text where ONE letter is a window onto media.
 * The window is a <canvas> that draws the media clipped to the letter's exact outline (glyph paths pre-extracted
 * from the font at the display instance, lib/glyphs.ts), so it never depends on font loading and works in Safari
 * (no SVG clip-path on video anywhere). zoom 0 = resting inside the letter; zoom 1 = the letter's roof (thick top
 * stroke) fills the viewport and the media is full-bleed. Above the point where the stroke covers the screen the
 * clip is dropped (cheap full-bleed draw) and restored on reverse.
 *
 * Usage:
 *   const win = useRef<LetterWindowHandle>(null);
 *   <LetterWindow ref={win} as="h1" className="hl-xl" text="שעוד לא ראית[ם]." media={{ kind: 'video', sources, poster }} active={near} />
 *   win.current?.set({ zoom, frame, mix })   // from a ScrollTrigger onProgress, 60 times a second if needed
 * Props can also be passed directly (zoom, frame, mix) for simple cases; the imperative handle avoids React renders.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ElementType } from 'react';
import { createPortal } from 'react-dom';
import { GLYPHS, GLYPH_FONT } from '@/lib/glyphs';
import { useFrameSequence } from '@/lib/frames';

export type MediaSpec =
  | { kind: 'video'; sources: { src: string; type: string }[]; poster?: string; loop?: boolean; focus?: [number, number] }
  | { kind: 'frames'; urls: string[]; poster?: string; focus?: [number, number] }
  | { kind: 'image'; src: string; focus?: [number, number] };

export type WindowState = {
  /** 0 = resting inside the letter, 1 = the roof fills the viewport (full-bleed). */
  zoom: number;
  /** 0..1 position inside a frames media (both layers). */
  frame: number;
  /** 0 = media only, 1 = mediaB only (crossfade between the two layers). */
  mix: number;
  /** Brightness of the media at rest (0..1); it lifts to 1 at full-bleed automatically. */
  grade: number;
  /** false = a solid ink letter (before the entrance tween ends, or when inactive). */
  opened: boolean;
};

export type LetterWindowHandle = {
  set: (s: Partial<WindowState>) => void;
  get: () => WindowState;
  /** The window letter's current viewport rect (for scenes that place things relative to it). */
  rect: () => DOMRect | null;
  redraw: () => void;
};

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
  media: MediaSpec;
  mediaB?: MediaSpec;
  /** Decode/play media only while true (scene near the viewport). */
  active?: boolean;
  zoom?: number;
  frame?: number;
  mix?: number;
  grade?: number;
  opened?: boolean;
  /** How much of the media is visible through the letter at rest: the media is cover-fitted into a box this many times the glyph box. */
  restScale?: number;
  /** Extra zoom-mode canvas layering (default 30: above the page, below the header). */
  zIndex?: number;
  /** Called once the media of the active layer has its first frame ready. */
  onReady?: () => void;
  /** aria-label override for the whole headline (default: the text without markers). */
  label?: string;
};

const UPEM = GLYPH_FONT.unitsPerEm;
const INK = '#16140F';

function parse(text: string) {
  const m = text.match(/^(.*)\[(.)\](.*)$/s);
  if (!m) return { before: text, letter: '', after: '' };
  return { before: m[1], letter: m[2], after: m[3] };
}

function useVideo(spec: MediaSpec | undefined, active: boolean) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!spec || spec.kind !== 'video') return;
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.loop = spec.loop ?? true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.style.cssText = 'position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:-10px;top:-10px';
    for (const s of spec.sources) { const el = document.createElement('source'); el.src = s.src; el.type = s.type; v.appendChild(el); }
    const onCan = () => setReady(true);
    v.addEventListener('loadeddata', onCan);
    document.body.appendChild(v);
    ref.current = v;
    return () => { v.removeEventListener('loadeddata', onCan); v.pause(); v.remove(); ref.current = null; setReady(false); };
  }, [spec]);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (active) { if (v.preload === 'none') { v.preload = 'auto'; v.load(); } v.play().catch(() => {}); }
    else v.pause();
  }, [active, spec]);
  return { video: ref, ready };
}

function useImage(spec: MediaSpec | undefined, active: boolean) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const src = spec?.kind === 'image' ? spec.src : spec?.kind === 'video' ? spec.poster : spec?.kind === 'frames' ? spec.poster : undefined;
  useEffect(() => {
    if (!src || !active) return;
    const img = new Image(); img.decoding = 'async';
    img.onload = () => { ref.current = img; setReady(true); };
    img.src = src;
    return () => { img.onload = null; };
  }, [src, active]);
  return { image: ref, ready };
}

const EMPTY: string[] = [];

export const LetterWindow = forwardRef<LetterWindowHandle, Props>(function LetterWindow(
  { text, as: Tag = 'h2', className = '', style, id, media, mediaB, active = true, zoom = 0, frame = 0, mix = 0, grade = 0.7, opened = true, restScale = 2.2, zIndex = 30, onReady, label }, ref,
) {
  const { before, letter, after } = useMemo(() => parse(text), [text]);
  const glyph = GLYPHS[letter];
  const win = useRef<HTMLSpanElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const restCanvas = useRef<HTMLCanvasElement>(null);
  const zoomCanvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<WindowState>({ zoom, frame, mix, grade, opened });
  const [zoomMounted, setZoomMounted] = useState(false);
  const metrics = useRef({ fontSize: 0, originX: 0, baselineY: 0, spanLeft: 0, spanTop: 0 });
  const path = useMemo(() => (glyph && typeof Path2D !== 'undefined' ? new Path2D(glyph.d) : null), [glyph]);

  const A = useVideo(media.kind === 'video' ? media : undefined, active);
  const B = useVideo(mediaB?.kind === 'video' ? mediaB : undefined, active);
  const Ai = useImage(media, active);
  const Bi = useImage(mediaB, active);
  const Af = useFrameSequence(media.kind === 'frames' ? media.urls : EMPTY, active && media.kind === 'frames');
  const Bf = useFrameSequence(mediaB?.kind === 'frames' ? mediaB.urls : EMPTY, active && mediaB?.kind === 'frames');

  const measure = useCallback(() => {
    const span = win.current, mk = marker.current;
    if (!span || !mk || !glyph) return;
    const r = span.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(span).fontSize);
    const baselineY = mk.getBoundingClientRect().top;
    metrics.current = { fontSize, originX: r.left, baselineY, spanLeft: r.left, spanTop: r.top };
    // Rest canvas: covers the glyph bbox (+2px), positioned inside the span
    const s = fontSize / UPEM, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = restCanvas.current; if (!c) return;
    const w = Math.ceil(glyph.bbox.w * s) + 4, h = Math.ceil(glyph.bbox.h * s) + 4;
    const left = glyph.bbox.x * s - 2, top = baselineY - r.top - (glyph.bbox.y + glyph.bbox.h) * s - 2;
    c.style.width = `${w}px`; c.style.height = `${h}px`; c.style.left = `${left}px`; c.style.top = `${top}px`;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  }, [glyph]);

  const pickLayer = (which: 'A' | 'B'): { src: CanvasImageSource | null; w: number; h: number; focus: [number, number] } => {
    const spec = which === 'A' ? media : mediaB; if (!spec) return { src: null, w: 0, h: 0, focus: [0.5, 0.5] };
    const focus = spec.focus ?? [0.5, 0.5];
    if (spec.kind === 'video') {
      const v = (which === 'A' ? A : B).video.current;
      if (v && v.readyState >= 2 && v.videoWidth) return { src: v, w: v.videoWidth, h: v.videoHeight, focus };
      const img = (which === 'A' ? Ai : Bi).image.current;
      return img ? { src: img, w: img.naturalWidth, h: img.naturalHeight, focus } : { src: null, w: 0, h: 0, focus };
    }
    if (spec.kind === 'frames') {
      const seq = which === 'A' ? Af : Bf;
      const i = seq.nearest(state.current.frame * (spec.urls.length - 1));
      const img = i >= 0 ? seq.get(i) : null;
      if (img) return { src: img, w: img.naturalWidth, h: img.naturalHeight, focus };
      const p = (which === 'A' ? Ai : Bi).image.current;
      return p ? { src: p, w: p.naturalWidth, h: p.naturalHeight, focus } : { src: null, w: 0, h: 0, focus };
    }
    const img = (which === 'A' ? Ai : Bi).image.current;
    return img ? { src: img, w: img.naturalWidth, h: img.naturalHeight, focus } : { src: null, w: 0, h: 0, focus };
  };

  const drawCoverInto = (ctx: CanvasRenderingContext2D, layer: ReturnType<typeof pickLayer>, x: number, y: number, w: number, h: number, alpha: number) => {
    if (!layer.src || alpha <= 0) return;
    const sc = Math.max(w / layer.w, h / layer.h);
    const dw = layer.w * sc, dh = layer.h * sc;
    ctx.globalAlpha = alpha;
    ctx.drawImage(layer.src, x + (w - dw) * layer.focus[0], y + (h - dh) * layer.focus[1], dw, dh);
    ctx.globalAlpha = 1;
  };

  const draw = useCallback(() => {
    if (!glyph || !path) return;
    const st = state.current;
    const m = metrics.current;
    if (!m.fontSize) measure();
    const { fontSize } = metrics.current;
    if (!fontSize) return;
    const s = fontSize / UPEM;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const z = Math.max(0, Math.min(1, st.zoom));
    const useZoom = z > 0.0005;
    const rc = restCanvas.current, zc = zoomCanvas.current;
    if (rc) rc.style.visibility = useZoom ? 'hidden' : 'visible';
    const canvas = useZoom ? zc : rc;
    if (!canvas) { if (useZoom && !zoomMounted) setZoomMounted(true); return; }
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    // Where is the glyph on screen right now?
    let originX: number, baselineY: number;
    if (useZoom) {
      const span = win.current, mk = marker.current; if (!span || !mk) return;
      originX = span.getBoundingClientRect().left; baselineY = mk.getBoundingClientRect().top;
      const vw = window.innerWidth, vh = window.innerHeight;
      if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) { canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr); canvas.style.width = `${vw}px`; canvas.style.height = `${vh}px`; }
    } else {
      // rest canvas is inside the span: glyph origin relative to the canvas
      originX = -(glyph.bbox.x * s - 2); baselineY = (glyph.bbox.y + glyph.bbox.h) * s + 2;
    }
    const W = canvas.width / dpr, H = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Zoom geometry: scale k about the roof centre C, which drifts to the viewport centre V as z → 1
    const roofCx = originX + (glyph.roof.x + glyph.roof.w / 2) * s;
    const roofCy = baselineY - (glyph.roof.y + glyph.roof.h / 2) * s;
    let k = 1, cx = roofCx, cy = roofCy;
    let covers = false;
    if (useZoom) {
      const vw = W, vh = H;
      const K = Math.max(vw / (glyph.roof.w * s), vh / (glyph.roof.h * s)) * 1.12;
      const e = z < 0.5 ? 4 * z * z * z : 1 - Math.pow(-2 * z + 2, 3) / 2; // easeInOutCubic
      k = 1 + e * (K - 1);
      cx = roofCx + (vw / 2 - roofCx) * e; cy = roofCy + (vh / 2 - roofCy) * e;
      covers = k * glyph.roof.w * s >= vw * 1.02 && k * glyph.roof.h * s >= vh * 1.02;
    }
    // The glyph path in screen space: translate(cx,cy) scale(k) translate(-roofCx,-roofCy) · translate(originX,baselineY) scale(s,-s)
    const T = (): void => { ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-roofCx, -roofCy); ctx.translate(originX, baselineY); ctx.scale(s, -s); };

    ctx.save();
    // Clip to the glyph (the clip is set under the glyph transform, then the transform is reset; restore() would drop the clip)
    if (!covers) { T(); ctx.beginPath(); ctx.clip(path); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    // Base: ink. (A solid letter until the media is ready / opened.)
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
    if (st.opened) {
      // The media box grows from a crop around the glyph (rest) to the viewport (full-bleed)
      const gx = originX + glyph.bbox.x * s, gy = baselineY - (glyph.bbox.y + glyph.bbox.h) * s, gw = glyph.bbox.w * s, gh = glyph.bbox.h * s;
      const rw = gw * restScale, rh = gh * restScale;
      const r0 = { x: gx + gw / 2 - rw / 2, y: gy + gh / 2 - rh / 2, w: rw, h: rh };
      const e2 = useZoom ? (z < 0.5 ? 4 * z * z * z : 1 - Math.pow(-2 * z + 2, 3) / 2) : 0;
      let box = useZoom ? { x: r0.x + (0 - r0.x) * e2, y: r0.y + (0 - r0.y) * e2, w: r0.w + (W - r0.w) * e2, h: r0.h + (H - r0.h) * e2 } : r0;
      if (useZoom) {
        // The media must always cover the visible part of the (scaled) glyph, or ink would show around it
        const tx = cx + (gx - roofCx) * k, ty = cy + (gy - roofCy) * k, tw = gw * k, th = gh * k;
        const vx0 = Math.max(0, tx), vy0 = Math.max(0, ty), vx1 = Math.min(W, tx + tw), vy1 = Math.min(H, ty + th);
        const ux0 = Math.min(box.x, vx0), uy0 = Math.min(box.y, vy0), ux1 = Math.max(box.x + box.w, vx1), uy1 = Math.max(box.y + box.h, vy1);
        box = { x: ux0, y: uy0, w: ux1 - ux0, h: uy1 - uy0 };
      }
      const la = pickLayer('A'), lb = mediaB ? pickLayer('B') : null;
      const mixv = Math.max(0, Math.min(1, st.mix));
      drawCoverInto(ctx, la, box.x, box.y, box.w, box.h, lb && lb.src ? 1 - mixv : 1);
      if (lb) drawCoverInto(ctx, lb, box.x, box.y, box.w, box.h, mixv);
      // Grade: darken at rest so the letter still reads as a letter; lift to clear at full-bleed
      const g = Math.max(0, Math.min(1, st.grade));
      const dark = (1 - g) * (1 - (useZoom ? e2 : 0));
      if (dark > 0.002) { ctx.fillStyle = `rgba(22,20,15,${dark})`; ctx.fillRect(0, 0, W, H); }
    }
    ctx.restore();
    // A hairline of ink along the letter's edge keeps the glyph crisp over bright media
    if (!covers && st.opened) { ctx.save(); T(); ctx.lineWidth = 1 / (s * k); ctx.strokeStyle = INK; ctx.stroke(path); ctx.restore(); }
  }, [glyph, path, measure, media, mediaB, restScale, zoomMounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const raf = useRef(0);
  const schedule = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(() => { raf.current = 0; draw(); }); }, [draw]);

  // Keep external props in sync with the imperative state (props are the simple path; set() is the fast path)
  useEffect(() => {
    state.current = { ...state.current, zoom, frame, mix, grade, opened };
    if (zoom > 0.0005 && !zoomMounted) setZoomMounted(true);
    schedule();
  }, [zoom, frame, mix, grade, opened, zoomMounted, schedule]);

  useImperativeHandle(ref, () => ({
    set: (s) => { Object.assign(state.current, s); if (s.zoom !== undefined && s.zoom > 0.0005 && !zoomMounted) setZoomMounted(true); schedule(); },
    get: () => ({ ...state.current }),
    rect: () => win.current?.getBoundingClientRect() ?? null,
    redraw: schedule,
  }), [schedule, zoomMounted]);

  // Measure on mount, on font load, on resize
  useLayoutEffect(() => {
    measure(); schedule();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { measure(); schedule(); }) : null;
    if (win.current && ro) ro.observe(win.current);
    const onResize = () => { measure(); schedule(); };
    window.addEventListener('resize', onResize);
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) { measure(); schedule(); } });
    return () => { cancelled = true; ro?.disconnect(); window.removeEventListener('resize', onResize); if (raf.current) cancelAnimationFrame(raf.current); raf.current = 0; };
  }, [measure, schedule]);

  // Continuous drawing while a video layer plays (rest loop) or while active with video media
  useEffect(() => {
    if (!active) { schedule(); return; }
    const hasVideo = media.kind === 'video' || mediaB?.kind === 'video';
    if (!hasVideo) { schedule(); return; }
    let id = 0;
    const loop = () => { draw(); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active, media.kind, mediaB?.kind, draw, schedule]);

  // Redraw when frames or images arrive
  useEffect(() => { schedule(); }, [Af.loaded, Bf.loaded, Ai.ready, Bi.ready, A.ready, B.ready, schedule]);
  const readyA = media.kind === 'video' ? A.ready || Ai.ready : media.kind === 'frames' ? Af.loaded > 0 || Ai.ready : Ai.ready;
  useEffect(() => { if (readyA) onReady?.(); }, [readyA, onReady]);
  // Mount the zoom canvas when first needed
  useEffect(() => { if (zoomMounted) schedule(); }, [zoomMounted, schedule]);

  const plain = `${before}${letter}${after}`;
  return (
    <>
      <Tag id={id} className={`hl ${className}`} style={style} aria-label={label ?? plain}>
        <span aria-hidden="true">{before}</span>
        <span ref={win} className="win" aria-hidden="true">
          {letter}
          <span ref={marker} className="win-baseline" aria-hidden="true" />
          <canvas ref={restCanvas} className="win-canvas" aria-hidden="true" />
        </span>
        <span aria-hidden="true">{after}</span>
      </Tag>
      {zoomMounted && typeof document !== 'undefined' && createPortal(
        <canvas ref={zoomCanvas} className="win-zoom" style={{ zIndex }} aria-hidden="true" />,
        document.body,
      )}
    </>
  );
});
