import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Tilfi-style sliding hero carousel with:
// - translateX sliding animation (not opacity fade)
// - Non-passive touch listeners for real mobile swipe
// - heroRef: attaches swipe to the entire hero <section> (over scrim + text)
// - onIndexChange: tells Home.jsx which slide is active (for per-slide text)
// - Transparent arrow buttons on desktop, hidden on mobile
export default function HeroCarousel({ slides = [], interval = 4800, heroRef, onIndexChange }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const ownRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, locked: false, horizontal: false, swiped: false });

  const safe = (Array.isArray(slides) ? slides : [])
    .map((s) => ({
      slug: (s && s.slug) || 'shop',
      title: (s && s.title) || '',
      imgs: Array.isArray(s && s.imgs) ? s.imgs.filter(Boolean)
        : Array.isArray(s && s.images) ? s.images.filter(Boolean) : [],
    }))
    .filter((s) => s.imgs.length > 0);
  const count = safe.length;

  const go = useCallback((dir) => {
    setIndex((i) => {
      const next = (i + dir + count) % count;
      if (onIndexChange) onIndexChange(next);
      return next;
    });
    setDragOffset(0);
  }, [count, onIndexChange]);

  // Auto-advance
  useEffect(() => {
    if (paused || isDragging || count <= 1) return;
    const id = setInterval(() => go(1), interval);
    return () => clearInterval(id);
  }, [paused, isDragging, go, interval, count]);

  // Non-passive touch listeners on the HERO SECTION (via heroRef) so swipe
  // works anywhere — over the scrim, over the text, anywhere on the hero.
  // Falls back to own container if heroRef isn't provided.
  useEffect(() => {
    const el = (heroRef && heroRef.current) || ownRef.current;
    if (!el || count <= 1) return;

    const onStart = (e) => {
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY, locked: false, horizontal: false, swiped: false };
      setIsDragging(true);
    };

    const onMove = (e) => {
      const ref = touchRef.current;
      const t = e.touches[0];
      const dx = t.clientX - ref.startX;
      const dy = t.clientY - ref.startY;

      if (!ref.locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        ref.locked = true;
        ref.horizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (ref.horizontal) {
        e.preventDefault();
        e.stopPropagation();
        setDragOffset(dx);
      }
    };

    const onEnd = (e) => {
      const ref = touchRef.current;
      const dx = e.changedTouches[0].clientX - ref.startX;
      if (ref.horizontal && Math.abs(dx) > 50) {
        go(dx < 0 ? 1 : -1);
        ref.swiped = true;
      } else {
        setDragOffset(0);
      }
      setIsDragging(false);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [count, go, heroRef]);

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
      ref={ownRef}
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {safe.map((slide, i) => {
        const diff = i - index;
        const baseX = diff * 100;
        const style = {
          transform: `translateX(calc(${baseX}% + ${isDragging ? dragOffset : 0}px))`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        };

        return (
          <div key={slide.slug} className="hero-carousel__slide" style={style}>
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
              </div>
            ))}
          </div>
        );
      })}

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
