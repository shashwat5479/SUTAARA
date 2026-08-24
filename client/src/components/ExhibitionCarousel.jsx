import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

// Coverflow-style exhibition carousel: a large centre card in sharp focus,
// flanking cards shrunk + rotated into perspective, and a blurred, zoomed
// copy of the active image filling the backdrop. Auto-advances, pauses on
// hover, and supports arrow nav + a fullscreen (lightbox) view.
export default function ExhibitionCarousel({ slides = [], interval = 3200 }) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const count = slides.length;
  const go = useCallback(
    (dir) => setActive((cur) => (cur + dir + count) % count),
    [count]
  );
  const jump = (i) => setActive(((i % count) + count) % count);

  // Auto-advance unless paused (hover) or the lightbox is open.
  useEffect(() => {
    if (paused || expanded || count <= 1) return;
    const id = setInterval(() => go(1), interval);
    return () => clearInterval(id);
  }, [paused, expanded, go, interval, count]);

  // Keyboard nav while the fullscreen view is open.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setExpanded(false);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, go]);

  if (count === 0) return null;

  // Signed offset of a slide from the active one, wrapped to the shorter way
  // round the ring so the far edges animate correctly.
  const offsetOf = (i) => {
    let d = i - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const activeSlide = slides[active];

  return (
    <div
      className="exhibit"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* blurred zoomed backdrop of the active image */}
      <div
        className="exhibit__bg"
        key={active}
        style={{ backgroundImage: `url(${activeSlide.img})` }}
      />
      <div className="exhibit__bg-scrim" />

      <div
        className="exhibit__stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((s, i) => {
          const off = offsetOf(i);
          const abs = Math.abs(off);
          // Only render the centre + two on each side; hide the rest.
          const visible = abs <= 2;
          const style = {
            transform:
              `translateX(${off * 46}%) ` +
              `scale(${off === 0 ? 1 : 0.82 - (abs - 1) * 0.06}) ` +
              `rotateY(${off === 0 ? 0 : off > 0 ? -34 : 34}deg)`,
            opacity: visible ? (off === 0 ? 1 : 0.55 - (abs - 1) * 0.18) : 0,
            zIndex: 10 - abs,
            pointerEvents: visible ? 'auto' : 'none',
          };
          return (
            <div
              className={`exhibit__card ${off === 0 ? 'is-active' : ''}`}
              style={style}
              key={s.id ?? i}
              onClick={() => (off === 0 ? null : jump(i))}
            >
              <img src={s.img} alt={s.title || 'Exhibition piece'} draggable="false" />
              {off === 0 && (
                <div className="exhibit__caption">
                  <h3>{s.title}</h3>
                  {s.subtitle && <p>{s.subtitle}</p>}
                </div>
              )}
            </div>
          );
        })}

        <button className="exhibit__nav exhibit__nav--prev" aria-label="Previous" onClick={() => go(-1)}>
          ‹
        </button>
        <button className="exhibit__nav exhibit__nav--next" aria-label="Next" onClick={() => go(1)}>
          ›
        </button>

        <button
          className="exhibit__expand"
          aria-label="View fullscreen"
          onClick={() => setExpanded(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>

      <div className="exhibit__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={i === active ? 'is-active' : ''}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => jump(i)}
          />
        ))}
      </div>

      {expanded && (
        <div className="exhibit-lightbox" onClick={() => setExpanded(false)}>
          <button className="exhibit-lightbox__close" aria-label="Close">×</button>
          <button
            className="exhibit-lightbox__nav exhibit-lightbox__nav--prev"
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
          >
            ‹
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={activeSlide.img} alt={activeSlide.title || 'Exhibition piece'} />
            <figcaption>
              <h3>{activeSlide.title}</h3>
              {activeSlide.subtitle && <p>{activeSlide.subtitle}</p>}
              {activeSlide.to && (
                <Link to={activeSlide.to} className="btn btn--gold btn--sm">View piece</Link>
              )}
            </figcaption>
          </figure>
          <button
            className="exhibit-lightbox__nav exhibit-lightbox__nav--next"
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); go(1); }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
