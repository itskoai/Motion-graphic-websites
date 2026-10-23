'use client';
// TEMPORARY stub used to validate the window primitive on the lab route; the Hero builder replaces this file entirely.
import { useMemo, useRef } from 'react';
import { LetterWindow, type LetterWindowHandle } from '@/components/window/LetterWindow';
import { useSceneProgress, seg } from '@/lib/scene';
import { heroFrames } from '@/lib/frames';
import { useMotionMode } from '@/lib/motion';
import { he } from '@/content/he';

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const win = useRef<LetterWindowHandle>(null);
  const mode = useMotionMode();
  const frames = useMemo(() => (mode.compact ? heroFrames(68, '/media/herom', 2, 'webp', 0) : heroFrames(134, '/media/hero', 3, 'webp', 1)), [mode.compact]);
  useSceneProgress(root, { pin: true, end: '+=300%', scrub: 0.3, stop: [1, 1], onProgress: (p) => win.current?.set({ zoom: seg(p, 0.12, 0.8), mix: seg(p, 0.25, 0.4), frame: seg(p, 0.3, 0.95) }) });
  return (
    <section ref={root} id="top" data-scene="Hero" style={{ height: '100vh', display: 'grid', alignContent: 'center', padding: '0 var(--gutter)' }}>
      <p className="kicker">{he.hero.kicker}</p>
      <h1 className="hl hl-xl" style={{ margin: 0 }}>{he.hero.h1a}</h1>
      <LetterWindow ref={win} as="p" className="hl-xl" style={{ margin: 0 }} text={he.hero.h1b}
        media={{ kind: 'video', sources: [{ src: '/media/door-loop.webm', type: 'video/webm' }, { src: '/media/door-loop.mp4', type: 'video/mp4' }], poster: '/media/door-poster.jpg', loop: true, focus: [0.14, 0.5] }}
        mediaB={{ kind: 'frames', urls: frames, poster: mode.compact ? '/media/hero-poster-m.jpg' : '/media/hero-poster.jpg' }} active grade={0.85} restScale={1.5} />
    </section>
  );
}
