'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * The ballpoint rule: a slightly hand-drawn line that draws itself (stroke-dashoffset).
 * Controlled: pass `progress` (0..1). Uncontrolled: draws when it enters the viewport (and undraws on reverse).
 * Width follows the parent (preserveAspectRatio none). Colour: currentColor (set color on the parent, e.g. var(--accent)).
 */
export function Rule({ progress, className, style, delay = 0, thickness = 2 }: { progress?: number; className?: string; style?: CSSProperties; delay?: number; thickness?: number }) {
  const path = useRef<SVGPathElement>(null);
  const L = 1000;
  useEffect(() => {
    const el = path.current; if (!el) return;
    if (progress !== undefined) { el.style.strokeDashoffset = String(L * (1 - Math.max(0, Math.min(1, progress)))); return; }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
    if (reduced) { el.style.strokeDashoffset = '0'; return; }
    const st = ScrollTrigger.create({
      trigger: el, start: 'top 88%',
      onEnter: () => gsap.to(el, { strokeDashoffset: 0, duration: 0.9, delay, ease: 'power3.inOut', overwrite: true }),
      onLeaveBack: () => gsap.to(el, { strokeDashoffset: L, duration: 0.4, ease: 'power2.in', overwrite: true }),
    });
    return () => st.kill();
  }, [progress, delay]);
  return (
    <svg className={`rule ${className ?? ''}`} style={style} viewBox="0 0 1000 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path ref={path} d="M2 5 C 180 3, 420 7, 640 4 S 900 2, 998 5" fill="none" stroke="currentColor" strokeWidth={thickness} strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeDasharray={L} strokeDashoffset={L} />
    </svg>
  );
}
