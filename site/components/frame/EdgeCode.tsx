'use client';
import { useEffect, useState } from 'react';
import { subscribeStop } from '@/lib/scene';
import styles from './EdgeCode.module.css';

/** The sheet's edge code: a tiny mono readout in the bottom start corner, like the numbers printed on film stock. */
export function EdgeCode() {
  const [stop, setStop] = useState<{ sheet: number; stop: number }>({ sheet: 1, stop: 1 });
  useEffect(() => subscribeStop(setStop), []);
  const t = String(stop.stop).padStart(2, '0');
  return (
    <div className={styles.edge} aria-hidden="true" dir="ltr">
      <span className={styles.rec} /> SC {t}
    </div>
  );
}
