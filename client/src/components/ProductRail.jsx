import { useCallback, useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard.jsx';

// Horizontal, swipeable row of product cards (Myntra-style "similar products").
// Shows 4 at a time on desktop, ~2.3 on phones so the next card peeks in and
// signals that there's more. Arrow buttons page the row on desktop; touch
// users just swipe.
export default function ProductRail({ products }) {
  const ref = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return undefined;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update, products]);

  // Start from the left whenever the list changes (e.g. after clicking a
  // product inside the row and landing on a new product page).
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = 0;
  }, [products]);

  const page = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div className="rail">
      {canPrev && (
        <button className="rail__arrow rail__arrow--prev" onClick={() => page(-1)} aria-label="Previous products">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}
      <div className="rail__track" ref={ref}>
        {products.map((p) => (
          <div className="rail__item" key={p._id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {canNext && (
        <button className="rail__arrow rail__arrow--next" onClick={() => page(1)} aria-label="More products">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
}
