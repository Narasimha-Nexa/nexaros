'use client';

import { useEffect } from 'react';

export default function ScrollReveal() {
  useEffect(() => {
    // Mark body as JS-loaded so CSS hides elements for animation
    document.body.classList.add('js-loaded');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    // Observe all current .reveal elements
    const observeAll = () => {
      const elements = document.querySelectorAll('.reveal:not(.visible)');
      elements.forEach((el) => observer.observe(el));
    };

    observeAll();

    // Also observe dynamically added elements
    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
