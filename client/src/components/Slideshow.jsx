import { useEffect, useState } from 'react';

// Two modes:
//   images = ['a.jpg', 'b.jpg']            → cross-fade one image at a time
//   images = [ ['a1','a2','a3'], ['b1'…] ] → cross-fade each SET of images
//                                            as a strip, side-by-side
//
// The set-mode is what makes the hero read like a lookbook: three shots of
// the same piece appear together, then swap for the next piece's three shots,
// instead of shuffling unrelated photos.
export default function Slideshow({ images, interval = 4500, className = '' }) {
  const [index, setIndex] = useState(0);

  // Normalize both shapes into [[…], [...]] internally
  const slides = images.length && Array.isArray(images[0]) ? images : images.map((s) => [s]);
  const isGroup = slides.some((s) => s.length > 1);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(id);
  }, [slides.length, interval]);

  return (
    <div className={`slideshow ${isGroup ? 'slideshow--grouped' : ''} ${className}`} aria-hidden="true">
      {slides.map((group, i) => (
        <div
          key={i}
          className={`slideshow__slide ${i === index ? 'slideshow__slide--active' : ''}`}
        >
          {group.map((src, j) => (
            <img
              key={src}
              src={src}
              alt=""
              loading={i === 0 && j === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>
      ))}

      {slides.length > 1 && (
        <div className="slideshow__dots">
          {slides.map((_, i) => (
            <button
              key={i}
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