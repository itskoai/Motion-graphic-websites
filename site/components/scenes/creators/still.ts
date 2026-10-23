/*
 * Read the motion budget synchronously, inside a layout effect, before the first paint of a client effect:
 * reduced motion, the header's stop-motion switch, save-data, or a landscape phone. Mirrors lib/motion.ts
 * (which answers only after mount) so the drawn strokes are never hidden when they should stay complete.
 */
export function isStill(): boolean {
  if (typeof window === 'undefined') return true;
  const mm = (q: string) => window.matchMedia(q).matches;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return mm('(prefers-reduced-motion: reduce)')
    || document.documentElement.dataset.motion === 'off'
    || !!nav.connection?.saveData
    || mm('(orientation: landscape) and (max-height: 560px)');
}
