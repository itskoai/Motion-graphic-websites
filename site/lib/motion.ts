'use client';
import { useEffect, useState } from 'react';

/**
 * The motion budget of this visit, decided on the client and re-checked live.
 * - reduced: prefers-reduced-motion, or the visitor pressed the "stop motion" button in the header.
 * - saveData: the browser asked for less data; heavy sequences are skipped.
 * - compact: phone-sized viewport (the simplified choreography).
 * - touch: coarse pointer (hover previews become tap previews).
 * - ready: false during SSR and the first client render; scenes render their complete static layout until then.
 */
export type MotionMode = {
  reduced: boolean;
  saveData: boolean;
  compact: boolean;
  touch: boolean;
  landscapePhone: boolean;
  ready: boolean;
};

const DEFAULT: MotionMode = { reduced: false, saveData: false, compact: false, touch: false, landscapePhone: false, ready: false };

function read(): MotionMode {
  const mm = (q: string) => window.matchMedia(q).matches;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  const manual = document.documentElement.dataset.motion === 'off';
  return {
    reduced: manual || mm('(prefers-reduced-motion: reduce)'),
    saveData: !!nav.connection?.saveData,
    compact: mm('(max-width: 767px)'),
    touch: mm('(pointer: coarse)'),
    landscapePhone: mm('(orientation: landscape) and (max-height: 560px)'),
    ready: true,
  };
}

const listeners = new Set<() => void>();
export function notifyMotionChange() { listeners.forEach((l) => l()); }

export function useMotionMode(): MotionMode {
  const [mode, setMode] = useState<MotionMode>(DEFAULT);
  useEffect(() => {
    const update = () => setMode(read());
    update();
    const queries = ['(prefers-reduced-motion: reduce)', '(max-width: 767px)', '(pointer: coarse)', '(orientation: landscape) and (max-height: 560px)'].map((q) => window.matchMedia(q));
    queries.forEach((q) => q.addEventListener('change', update));
    listeners.add(update);
    return () => { queries.forEach((q) => q.removeEventListener('change', update)); listeners.delete(update); };
  }, []);
  return mode;
}

/** Toggle the manual "stop motion" switch (header button). Persists for the session. */
export function setMotionOff(off: boolean) {
  document.documentElement.dataset.motion = off ? 'off' : 'on';
  try { sessionStorage.setItem('motion', off ? 'off' : 'on'); } catch {}
  notifyMotionChange();
}
export function readMotionPref(): boolean {
  try { return sessionStorage.getItem('motion') === 'off'; } catch { return false; }
}
