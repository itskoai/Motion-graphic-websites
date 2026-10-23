'use client';
import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * The page is one physical material whose state changes as the story moves on.
 * Each scene declares the state it owns; while it owns the viewport, <html data-material> carries that state and
 * the page background follows (see globals.css). Scenes also receive a scalar `--p` (0..1) on their root element,
 * written by their own ScrollTrigger, so CSS and GSAP can both read the same progress.
 */
export type Material = 'paper' | 'bath' | 'dark' | 'light';

export function setMaterial(state: Material | 'light') {
  const html = document.documentElement;
  if (html.dataset.material !== state) html.dataset.material = state;
}

/** While footage is full-bleed, the header goes transparent with light type (html[data-media="1"]). */
export function setOverMedia(on: boolean) {
  const html = document.documentElement;
  const v = on ? '1' : '';
  if ((html.dataset.media ?? '') !== v) { if (on) html.dataset.media = '1'; else delete html.dataset.media; }
}

/* The edge code readout (SC 0N) */
type Stop = { sheet: number; stop: number };
let currentStop: Stop = { sheet: 1, stop: 1 };
const stopListeners = new Set<(s: Stop) => void>();
export function setStop(sheet: number, stop: number) {
  if (currentStop.sheet === sheet && currentStop.stop === stop) return;
  currentStop = { sheet, stop };
  stopListeners.forEach((l) => l(currentStop));
}
export function subscribeStop(l: (s: Stop) => void) { stopListeners.add(l); l(currentStop); return () => { stopListeners.delete(l); }; }

type ProgressOpts = {
  /** The scroll range that maps to 0..1. Default: the element's own height minus the viewport. */
  start?: string;
  end?: string;
  /** When set, the scene owns the page material while its trigger is active. */
  material?: Material;
  /** The edge-code readout while this scene is active: [sheet, stop]. */
  stop?: [number, number];
  /** GSAP scrub smoothing in seconds (0 = locked to scroll). Default 0.35. */
  scrub?: number;
  /** Called every update with progress 0..1 and the direction (1 down, -1 up). */
  onProgress?: (p: number, direction: number) => void;
  /** Disable completely (reduced motion): --p is set to 1 and onProgress(1) is called once. */
  disabled?: boolean;
  /** Pin the element for the length of the scroll range. */
  pin?: boolean | Element;
  pinSpacing?: boolean;
  /** Which element is the trigger; default: the ref element. */
  trigger?: RefObject<HTMLElement | null>;
  anticipatePin?: number;
};

/**
 * Writes `--p` (0..1) on the ref element as the visitor scrolls through it, in both directions.
 * Returns nothing: read `--p` in CSS (e.g. opacity: var(--p)) or use onProgress for canvas/GSAP work.
 */
export function useSceneProgress(ref: RefObject<HTMLElement | null>, opts: ProgressOpts = {}) {
  const { start = 'top top', end = 'bottom bottom', material, stop, scrub = 0.35, onProgress, disabled = false, pin, pinSpacing = true, trigger, anticipatePin = 1 } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (disabled) {
      el.style.setProperty('--p', '1');
      onProgress?.(1, 1);
      // Even without motion the page material and the edge code follow the scene on screen.
      const st0 = ScrollTrigger.create({ trigger: trigger?.current ?? el, start: 'top 60%', end: 'bottom 40%', onToggle: (self) => { if (self.isActive) { if (material) setMaterial(material); if (stop) setStop(stop[0], stop[1]); } } });
      return () => st0.kill();
    }
    const setP = gsap.quickSetter(el, '--p');
    const proxy = { p: 0 };
    let last = -1;
    let dir = 1;
    const write = () => {
      const v = Math.round(proxy.p * 1000) / 1000;
      if (v === last) return;
      last = v;
      setP(v);
      onProgress?.(v, dir);
    };
    const st = ScrollTrigger.create({
      trigger: trigger?.current ?? el,
      start,
      end,
      pin: pin ?? false,
      pinSpacing,
      anticipatePin,
      scrub,
      onToggle: (self) => { if (self.isActive) { if (material) setMaterial(material); if (stop) setStop(stop[0], stop[1]); } },
      onUpdate: (self) => {
        dir = self.direction || dir;
        if (scrub > 0) {
          gsap.to(proxy, { p: self.progress, duration: scrub, ease: 'none', overwrite: true, onUpdate: write });
        } else { proxy.p = self.progress; write(); }
      },
      onRefresh: (self) => { proxy.p = self.progress; last = -1; write(); },
    });
    proxy.p = st.progress; write();
    return () => { gsap.killTweensOf(proxy); st.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, start, end, material, stop, scrub, disabled, pin, pinSpacing, trigger, anticipatePin]);
}

/** Linear map helper for scene timelines: progress p inside [a,b] → 0..1 clamped. */
export const seg = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
/** Smoothstep for softer in/out inside a segment. */
export const smooth = (t: number) => t * t * (3 - 2 * t);
