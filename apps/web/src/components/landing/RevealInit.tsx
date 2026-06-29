'use client';

import { useEffect } from 'react';

/**
 * Ativa o scroll-reveal premium: adiciona `.in-view` aos elementos `.reveal`
 * quando entram na viewport. Respeita prefers-reduced-motion via CSS.
 */
export function RevealInit() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (els.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
