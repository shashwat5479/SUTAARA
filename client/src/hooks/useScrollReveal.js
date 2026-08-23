import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Watches for anything marked as revealable and adds `.in-view` once it
// scrolls into the viewport, which is what the CSS transitions key off.
//
// It re-scans on route change and on DOM mutations because product rows
// arrive asynchronously — an observer attached once at mount would miss
// every card that renders after the fetch resolves.
export default function useScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    const SELECTOR = '.reveal-group, .reveal-item, .section-head';

    // No IntersectionObserver (very old browsers): show everything rather
    // than leaving the page permanently blank.
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('in-view'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target); // reveal once, don't re-hide
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const scan = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains('in-view')) observer.observe(el);
      });
    };

    scan();

    // Content that loads after mount (product rows, category rows) needs
    // picking up too.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
}
