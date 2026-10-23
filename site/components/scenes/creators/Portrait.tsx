'use client';
import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { he } from '@/content/he';
import type { Founder } from '@/site.config';
import { SILHOUETTES, DRAW_SECONDS } from './silhouettes';
import { isStill } from './still';
import css from '../Creators.module.css';

/**
 * One drawn portrait frame: a 1px ink rectangle at 3:4 with a pencil study inside (or the real photo once
 * site.config has one), the mono PORTRAIT code at the top start corner and the honest Plex note at the bottom.
 * The rectangle and the study draw themselves (stroke-dashoffset) when the frame reaches 80% of the viewport,
 * and undraw when the visitor scrolls back above it. Without JS or with reduced motion they are simply complete.
 */
export function Portrait({ index, founder, still }: { index: number; founder: Founder; still: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const strokes = SILHOUETTES[index] ?? SILHOUETTES[0];
  const code = he.creators.portraitCodes[index] ?? he.creators.portraitCodes[0];
  const photo = founder.photo.trim();

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el || still || isStill()) return;
    const paths = Array.from(el.querySelectorAll<SVGPathElement>('path[data-t]'));
    if (!paths.length) return;
    // 1.02, not 1: with round caps an offset of exactly the length leaves a dot at the start of every stroke
    gsap.set(paths, { strokeDashoffset: 1.02 });
    const tl = gsap.timeline({ paused: true });
    paths.forEach((p) => {
      const [a, b] = (p.dataset.t ?? '0,1').split(',').map(Number);
      tl.to(p, { strokeDashoffset: 0, duration: Math.max(0.05, (b - a) * DRAW_SECONDS), ease: 'power1.inOut' }, a * DRAW_SECONDS);
    });
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => { tl.timeScale(1).play(); },
      onLeaveBack: () => { tl.timeScale(2.6).reverse(); },
    });
    // Already on screen (a deep link, a reload mid-page): draw now; already scrolled past: stay complete.
    if (st.isActive) tl.timeScale(1).play();
    else if (st.progress >= 1) tl.progress(1);
    return () => { st.kill(); tl.kill(); gsap.set(paths, { clearProps: 'strokeDashoffset' }); };
  }, [still]);

  return (
    <div ref={frame} className={css.frame}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- a static export with a config-provided path; no loader
        <img className={css.photo} src={photo} alt={founder.name} loading="lazy" decoding="async" />
      ) : (
        <svg className={css.study} viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
          {strokes.map((s, i) => (
            <path key={i} className={css[s.k]} d={s.d} data-t={`${s.t[0]},${s.t[1]}`} pathLength={1} strokeDasharray="1 2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      )}
      {/* The frame itself, a drawn line: starts at the top start corner and runs round the sheet */}
      <svg className={css.edgeLine} viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M 300 0 V 400 H 0 V 0 Z" data-t="0,0.34" pathLength={1} strokeDasharray="1 2" fill="none" />
      </svg>
      <span className={`edge ${css.code}`} dir="ltr">{code}</span>
      {!photo && <span className={css.note}>{he.creators.placeholderPortrait}</span>}
    </div>
  );
}
