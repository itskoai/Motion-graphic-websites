'use client';
import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useSceneProgress } from '@/lib/scene';
import { useMotionMode } from '@/lib/motion';
import { he } from '@/content/he';
import { siteConfig, type Founder } from '@/site.config';
import { Rule } from '@/components/ui/Rule';
import { Portrait } from './creators/Portrait';
import { DRAW_SECONDS } from './creators/silhouettes';
import { isStill } from './creators/still';
import css from './Creators.module.css';

/*
 * Scene 5 · #creators · שניים
 * Two drawn portrait frames side by side with a 1px fold between them, the names dominant beneath,
 * one shared sentence doing the work, and the four values on a single baseline rail. Not pinned.
 * Everything is real HTML in its final state; the client only adds the drawing.
 */
const STOP: [number, number] = [1, 5];
const EMPTY: Founder = { name: '', role: '', photo: '', lines: [] };

/** The designed name placeholder: "שם · בקרוב" with the last word (after the middle dot) in the ballpoint blue. */
function PlaceholderName() {
  const parts = he.creators.placeholderName.split(' · ');
  if (parts.length < 2) return <>{he.creators.placeholderName}</>;
  const last = parts[parts.length - 1];
  return <>{parts.slice(0, -1).join(' · ')} · <span className={css.soon}>{last}</span></>;
}

export function Creators() {
  const root = useRef<HTMLElement>(null);
  const divider = useRef<SVGPathElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLUListElement>(null);
  const mode = useMotionMode();
  const still = mode.reduced || mode.saveData || mode.landscapePhone;
  const founders: Founder[] = [siteConfig.founders[0] ?? EMPTY, siteConfig.founders[1] ?? EMPTY];

  useSceneProgress(root, { start: 'top 80%', end: 'bottom 20%', stop: STOP, scrub: 0, disabled: still });

  /* The fold: a 1px vertical ink rule between the frames that draws itself once both studies are on the sheet. */
  useLayoutEffect(() => {
    const path = divider.current;
    if (!path || still || isStill()) return;
    const compact = window.matchMedia('(max-width: 767px)').matches;
    gsap.set(path, { strokeDashoffset: 1 });
    const tl = gsap.timeline({ paused: true });
    // Side by side the fold waits for the two studies (they start together); stacked, the first is long done.
    tl.to(path, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, compact ? 0.15 : DRAW_SECONDS + 0.1);
    const st = ScrollTrigger.create({
      trigger: path,
      start: 'top 80%',
      onEnter: () => { tl.timeScale(1).play(); },
      onLeaveBack: () => { tl.timeScale(3).reverse(); },
    });
    if (st.isActive) tl.timeScale(1).play();
    else if (st.progress >= 1) tl.progress(1);
    return () => { st.kill(); tl.kill(); gsap.set(path, { clearProps: 'strokeDashoffset' }); };
  }, [still]);

  /* The values: four words on one baseline, ash until the ballpoint rail passes beneath each one. The Rule draws
     itself on enter (0.9s, power3.inOut, from the start edge); each word turns to ink at the moment the rail reaches it. */
  useLayoutEffect(() => {
    const railEl = rail.current;
    const rowEl = row.current;
    if (!railEl || !rowEl || still || isStill()) return;
    const words = Array.from(rowEl.querySelectorAll<HTMLElement>('[data-val]'));
    if (!words.length) return;
    const ease = gsap.parseEase('power3.inOut');
    const invert = (y: number) => { let lo = 0, hi = 1; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (ease(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
    let tl: gsap.core.Timeline | null = null;
    const toAsh = () => { tl?.kill(); tl = null; words.forEach((w) => w.classList.add(css.ash)); };
    const toInk = () => {
      tl?.kill();
      const r = railEl.getBoundingClientRect();
      const t = gsap.timeline();
      words.forEach((w) => {
        const b = w.getBoundingClientRect();
        // The rail draws from the start edge (right, RTL): the fraction of its length under this word's centre.
        const f = r.width > 0 ? Math.max(0, Math.min(1, (r.right - (b.left + b.width / 2)) / r.width)) : 1;
        t.call(() => w.classList.remove(css.ash), [], 0.9 * invert(f));
      });
      tl = t;
    };
    toAsh();
    const st = ScrollTrigger.create({ trigger: railEl, start: 'top 88%', onEnter: toInk, onLeaveBack: toAsh });
    if (st.isActive) toInk();
    else if (st.progress >= 1) words.forEach((w) => w.classList.remove(css.ash));
    return () => { st.kill(); tl?.kill(); words.forEach((w) => w.classList.remove(css.ash)); };
  }, [still]);

  return (
    <section ref={root} id="creators" data-scene="Creators" className={`wrap ${css.scene}`} aria-labelledby="creators-title">
      <header className={css.head}>
        <p className={`kicker ${css.kicker}`}>{he.creators.kicker}</p>
        <h2 id="creators-title" className={`hl hl-l ${css.h2}`}>{he.creators.h2}</h2>
        <div className={css.text}>
          <p>{he.creators.p1}</p>
          <p>{he.creators.p2}</p>
        </div>
      </header>

      <div className={css.pair}>
        {founders.map((f, i) => (
          <figure key={i} className={css.figure}>
            <Portrait index={i} founder={f} still={still} />
            <figcaption className={css.caption}>
              <h3 className={`hl ${css.name}`}>{f.name.trim() ? f.name : <PlaceholderName />}</h3>
              <p className={css.role}>{f.role.trim() ? f.role : he.creators.placeholderRole}</p>
              {f.lines.length > 0 && (
                <div className={css.lines}>
                  {f.lines.map((l, j) => <p key={j}>{l}</p>)}
                </div>
              )}
            </figcaption>
          </figure>
        )).flatMap((fig, i) => (i === 0 ? [fig, (
          <svg key="fold" className={css.fold} viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path ref={divider} d="M 1 0 V 100" pathLength={1} strokeDasharray="1 2" fill="none" />
          </svg>
        )] : [fig]))}
      </div>

      <div className={css.values}>
        <ul ref={row} className={css.row} aria-label={he.creators.kicker}>
          {he.creators.values.map((v) => <li key={v} className={css.val} data-val>{v}</li>)}
        </ul>
        <div ref={rail} className={css.rail}>
          <Rule className={css.rule} thickness={1.5} />
        </div>
      </div>
    </section>
  );
}
