import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Swipeable hero band. Each slide is one piece shown as a strip of photos;
// clicking any photo opens that product. Arrows + swipe + auto-advance.
export default function HeroCarousel({ slides = [], interval = 4800 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const touchX = useRef(null);

  // Defend against malformed slides (e.g. an admin slide missing images) so a
  // single bad entry can never crash the homepage. Accept either `imgs` or
  // `images`, drop slides with no photos.
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

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  if (count === 0) return null;

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {safe.map((slide, i) => (
        <div
          key={slide.slug}
          className={`hero-carousel__slide ${i === index ? 'is-active' : ''}`}
          aria-hidden={i !== index}
        >
          {slide.imgs.map((src, j) => (
            <button
              key={src}
              type="button"
              className="hero-carousel__img"
              onClick={() => navigate(`/product/${slide.slug}`)}
              aria-label={`View ${slide.title}`}
              tabIndex={i === index ? 0 : -1}
            >
              <img src={src} alt={slide.title} loading={i === 0 && j === 0 ? 'eager' : 'lazy'} />
              <span className="hero-carousel__view">View piece</span>
            </button>
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
