'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// One registration for the whole app. Import gsap/ScrollTrigger/useGSAP from here, never from the packages directly,
// so every scene shares the same configured instance.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // Phones resize the viewport when the address bar hides; recalculating every pinned scene on each of those
  // resizes makes scroll jump. Only real orientation/size changes refresh.
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power2.out', duration: 0.8 });
}

export { gsap, ScrollTrigger, useGSAP };
