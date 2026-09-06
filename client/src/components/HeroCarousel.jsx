import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Swipeable hero band. Each slide is one piece shown as a strip of photos;
// clicking any photo opens that product. Arrows + phone swipe + auto-advance.
export default function HeroCarousel({ slides = [], interval = 4800 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const startX = useRef(null);
  const swiped = useRef(false);

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

  const begin = (x) => {
    startX.current = x;
    swiped.current = false;
    setPaused(true);
  };
  const end = (x) => {
    if (startX.current == null) return;
    const dx = x - startX.current;
    if (Math.abs(dx) > 40) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    }
    startX.current = null;
    setPaused(false);
  };

  const onTouchStart = (e) => begin(e.touches[0].clientX);
  const onTouchEnd = (e) => end(e.changedTouches[0].clientX);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    begin(e.clientX);
  };
  const onPointerUp = (e) => end(e.clientX);
  const onPointerCancel = () => {
    startX.current = null;
    setPaused(false);
  };

  const openPiece = (slug) => {
    if (swiped.current) return;
    navigate(`/product/${slug}`);
  };

  if (count === 0) return null;

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {safe.map((slide, i) => (
        <div
          key={slide.slug}
          className={`hero-carousel__slide ${i === index ? 'is-active' : ''}`}
          style={{ transform: `translateX(${(i - index) * 100}%)` }}
          aria-hidden={i !== index}
        >
          {slide.imgs.map((src, j) => (
            <button
              key={src}
              type="button"
              className="hero-carousel__img"
              onClick={() => openPiece(slide.slug)}
              aria-label={`View ${slide.title}`}
              tabIndex={i === index ? 0 : -1}
            >
              <img src={src} alt={slide.title} draggable="false" loading={i === 0 && j === 0 ? 'eager' : 'lazy'} />
              <span className="hero-carousel__view">View piece</span>
            </button>
          ))}
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            className="hero-carousel__nav hero-carousel__nav--prev"
            aria-label="Previous"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); go(-1); }}
          >‹</button>
          <button
            type="button"
            className="hero-carousel__nav hero-carousel__nav--next"
            aria-label="Next"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); go(1); }}
          >›</button>
          <div className="hero-carousel__dots">
            {safe.map((_, i) => (
              <button key={i} type="button" className={i === index ? 'is-active' : ''} aria-label={`Slide ${i + 1}`} onClick={() => setIndex(i)} />
            ))}
          </div>
          <p className="hero-carousel__swipe-hint">Swipe</p>
        </>
      )}
    </div>
  );
}
