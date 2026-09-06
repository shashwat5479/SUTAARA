import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeroCarousel({ slides = [], interval = 4800 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, swiped: false, locked: false });

  const safe = (Array.isArray(slides) ? slides : [])
    .map((s) => ({
      slug: (s && s.slug) || 'shop',
      title: (s && s.title) || '',
      imgs: Array.isArray(s && s.imgs) ? s.imgs.filter(Boolean)
        : Array.isArray(s && s.images) ? s.images.filter(Boolean) : [],
    }))
    .filter((s) => s.imgs.length > 0);
  const count = safe.length;

  const go = useCallback((dir) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => go(1), interval);
    return () => clearInterval(id);
  }, [paused, go, interval, count]);

  // Attach NON-PASSIVE touch listeners directly to the DOM element.
  // React's onTouchMove is passive — e.preventDefault() is silently ignored,
  // which lets the browser steal horizontal swipes for back/forward navigation.
  // By using addEventListener with { passive: false }, our preventDefault
  // actually fires and the swipe stays inside the carousel.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || count <= 1) return;

    const onStart = (e) => {
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY, swiped: false, locked: false };
    };

    const onMove = (e) => {
      const ref = touchRef.current;
      const t = e.touches[0];
      const dx = t.clientX - ref.startX;
      const dy = t.clientY - ref.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // First significant movement decides: horizontal = carousel swipe,
      // vertical = page scroll. Once decided, we lock the direction.
      if (!ref.locked && (absDx > 8 || absDy > 8)) {
        ref.locked = true;
        ref.horizontal = absDx > absDy;
      }

      // If the user is swiping horizontally, prevent the browser from
      // doing ANYTHING with it (no back-gesture, no scroll, nothing).
      if (ref.horizontal) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onEnd = (e) => {
      const ref = touchRef.current;
      const dx = e.changedTouches[0].clientX - ref.startX;
      if (ref.horizontal && Math.abs(dx) > 30) {
        go(dx < 0 ? 1 : -1);
        ref.swiped = true;
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false }); // non-passive = preventDefault works
    el.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [count, go]);

  const handleImgClick = (slug) => {
    if (touchRef.current.swiped) {
      touchRef.current.swiped = false;
      return;
    }
    navigate(`/product/${slug}`);
  };

  if (count === 0) return null;

  return (
    <div
      ref={containerRef}
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {safe.map((slide, i) => (
        <div
          key={slide.slug}
          className={`hero-carousel__slide ${i === index ? 'is-active' : ''}`}
          aria-hidden={i !== index}
        >
          {slide.imgs.map((src, j) => (
            <div
              key={src}
              role="button"
              tabIndex={i === index ? 0 : -1}
              className="hero-carousel__img"
              onClick={() => handleImgClick(slide.slug)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/product/${slide.slug}`); }}
              aria-label={`View ${slide.title}`}
            >
              <img src={src} alt={slide.title} loading={i === 0 && j === 0 ? 'eager' : 'lazy'} draggable="false" />
              <span className="hero-carousel__view">View piece</span>
            </div>
          ))}
        </div>
      ))}

      {count > 1 && (
        <>
          <button className="hero-carousel__nav hero-carousel__nav--prev" aria-label="Previous" onClick={() => go(-1)}>‹</button>
          <button className="hero-carousel__nav hero-carousel__nav--next" aria-label="Next" onClick={() => go(1)}>›</button>
          <div className="hero-carousel__dots">
            {safe.map((_, i) => (
              <button key={i} className={i === index ? 'is-active' : ''} aria-label={`Slide ${i + 1}`} onClick={() => setIndex(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
