import { useEffect, useState } from 'react';

// A plain full-bleed background slideshow — no external carousel library,
// just an interval swapping which image is opacity:1. Renders as an
// absolutely-positioned layer; wrap it in a position:relative container
// and put your overlay content as a sibling.
export default function Slideshow({ images, interval = 4500, className = '' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className={`slideshow ${className}`} aria-hidden="true">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`slideshow__slide ${i === index ? 'slideshow__slide--active' : ''}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
      {images.length > 1 && (
        <div className="slideshow__dots">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`slideshow__dot ${i === index ? 'slideshow__dot--active' : ''}`}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
