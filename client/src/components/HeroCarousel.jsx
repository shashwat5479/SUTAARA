import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Swipeable hero band. Each slide is one piece shown as a strip of photos;
// clicking any photo opens that product. Arrows + swipe + auto-advance.
export default function HeroCarousel({ slides = [], interval = 4800 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const touchRef = useRef({ startX: 0, startY: 0, swiped: false });

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

  // Touch handlers that work even when the touch lands on a child button.
  // We track start position and distance to distinguish a swipe from a tap:
  //   swipe = horizontal drag > 30px  → change slide
  //   tap   = barely moved            → navigate to product
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, swiped: false };
  };

  const onTouchMove = (e) => {
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchRef.current.startX);
    const dy = Math.abs(t.clientY - touchRef.current.startY);
    // If moving more horizontally than vertically, prevent page scroll
    // so the swipe feels smooth
    if (dx > dy && dx > 10) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(dx) > 30) {
      go(dx < 0 ? 1 : -1);
      touchRef.current.swiped = true;
    }
  };

  // Only navigate on tap (not swipe)
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
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
