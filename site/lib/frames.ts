'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Loads an image sequence coarse-to-fine (every 16th frame, then 8th, 4th, 2nd, all), so a scrub is usable
 * long before every frame has arrived. nearest(i) returns the closest loaded frame index (or -1).
 */
export function useFrameSequence(urls: string[], enabled: boolean, concurrency = 6) {
  const frames = useRef<(HTMLImageElement | null)[]>([]);
  const ok = useRef<boolean[]>([]);
  const [loaded, setLoaded] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled || urls.length === 0) return;
    let cancelled = false;
    frames.current = new Array(urls.length).fill(null);
    ok.current = new Array(urls.length).fill(false);
    const order: number[] = [];
    const seen = new Set<number>();
    for (const stride of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < urls.length; i += stride) if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
    if (!seen.has(urls.length - 1)) order.splice(1, 0, urls.length - 1);
    let next = 0, count = 0;
    const run = () => {
      if (cancelled || next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        frames.current[i] = img; ok.current[i] = true; count++;
        setLoaded(count);
        if (count === urls.length) setDone(true);
        run();
      };
      img.onerror = () => { if (!cancelled) { count++; setLoaded(count); if (count === urls.length) setDone(true); run(); } };
      img.src = urls[i];
    };
    for (let k = 0; k < concurrency; k++) run();
    return () => { cancelled = true; };
  }, [urls, enabled, concurrency]);

  const nearest = (i: number) => {
    const n = urls.length;
    i = Math.max(0, Math.min(n - 1, Math.round(i)));
    for (let d = 0; d < n; d++) {
      if (i - d >= 0 && ok.current[i - d]) return i - d;
      if (i + d < n && ok.current[i + d]) return i + d;
    }
    return -1;
  };
  const get = (i: number) => frames.current[i] ?? null;
  return { loaded, done, total: urls.length, nearest, get };
}

/** Draws an image into a canvas with object-fit: cover semantics. */
export function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, w: number, h: number, focusX = 0.5, focusY = 0.5) {
  const iw = img.width, ih = img.height;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  const dx = (w - dw) * focusX, dy = (h - dh) * focusY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export const heroFrames = (count: number, base: string, pad = 3, ext = 'webp', start = 1) =>
  Array.from({ length: count }, (_, i) => `${base}/${String(i + start).padStart(pad, '0')}.${ext}`);
