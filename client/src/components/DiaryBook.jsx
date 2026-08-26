import { useState, useEffect, useRef, useCallback } from 'react';

function Stars({ n = 5 }) {
  return (
    <div className="diary-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? 'on' : ''}>★</span>
      ))}
    </div>
  );
}

// An open-book widget that turns pages through 5-star customer reviews. Each
// spread shows the product photo on the left leaf and the written review on
// the right leaf. Auto-turns; arrows + swipe to control.
export default function DiaryBook({ reviews = [], auto = true, interval = 5000 }) {
  const [page, setPage] = useState(0);
  const [turning, setTurning] = useState(false);
  const touchX = useRef(null);
  const count = reviews.length;

  const turn = useCallback((dir) => {
    if (count <= 1) return;
    setTurning(true);
    setTimeout(() => {
      setPage((p) => (p + dir + count) % count);
      setTurning(false);
    }, 260);
  }, [count]);

  useEffect(() => {
    if (!auto || count <= 1) return undefined;
    const id = setInterval(() => turn(1), interval);
    return () => clearInterval(id);
  }, [auto, turn, interval, count]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 45) turn(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  if (count === 0) {
    return (
      <div className="diary-book diary-book--empty">
        <p>The first pages are being written. Verified 5-star reviews will appear here.</p>
      </div>
    );
  }

  const r = reviews[page];
  const img = r.product?.images?.[0] || '/products/maroon-patola-ikat-1.jpg';

  return (
    <div className="diary-book" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={`diary-book__spread ${turning ? 'is-turning' : ''}`}>
        <div className="diary-leaf diary-leaf--left">
          <img src={img} alt={r.product?.name || 'Sutaara piece'} />
        </div>
        <div className="diary-leaf diary-leaf--right">
          <div className="diary-entry">
            <Stars n={r.rating} />
            {r.title && <h4>{r.title}</h4>}
            <p className="diary-entry__body">{r.body}</p>
            <div className="diary-entry__meta">
              <span className="diary-entry__name">— {r.user?.name || 'A Sutaara customer'}</span>
              {r.product?.name && <span className="diary-entry__product">on {r.product.name}</span>}
            </div>
          </div>
          <div className="diary-book__spine" aria-hidden="true" />
        </div>
      </div>

      {count > 1 && (
        <>
          <button className="diary-book__nav diary-book__nav--prev" aria-label="Previous entry" onClick={() => turn(-1)}>‹</button>
          <button className="diary-book__nav diary-book__nav--next" aria-label="Next entry" onClick={() => turn(1)}>›</button>
          <div className="diary-book__count">{page + 1} / {count}</div>
        </>
      )}
    </div>
  );
}
