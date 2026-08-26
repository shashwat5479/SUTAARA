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

// The text side of a page (right leaf / turning-page face content)
function Entry({ review }) {
  if (!review) return <div className="diary-entry" />;
  return (
    <div className="diary-entry">
      <Stars n={review.rating} />
      {review.title && <h4>{review.title}</h4>}
      <p className="diary-entry__body">{review.body}</p>
      <div className="diary-entry__meta">
        <span className="diary-entry__name">— {review.user?.name || 'A Sutaara customer'}</span>
        {review.product?.name && <span className="diary-entry__product">on {review.product.name}</span>}
      </div>
    </div>
  );
}

const imgOf = (r) => r?.product?.images?.[0] || '/products/maroon-patola-ikat-1.jpg';

// An open book that physically turns pages. The left leaf holds the product
// photo, the right leaf the written review. Advancing flips the right page
// over the spine (rotateY) to reveal the next entry; going back swings a page
// in. Auto-turns, with arrows + swipe.
export default function DiaryBook({ reviews = [], auto = true, interval = 5200 }) {
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState(null); // { dir, from, to } while turning
  const touchX = useRef(null);
  const busy = useRef(false);
  const count = reviews.length;

  const turn = useCallback((dir) => {
    if (count <= 1 || busy.current) return;
    busy.current = true;
    const from = page;
    const to = (page + dir + count) % count;
    setFlip({ dir, from, to });
    setTimeout(() => {
      setPage(to);
      setFlip(null);
      busy.current = false;
    }, 800);
  }, [count, page]);

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

  const current = reviews[page];
  // While flipping forward, the LEFT (image) leaf should already show the
  // destination image "underneath" as the page peels away; the turning page's
  // front face carries the current review, its back face the next.
  const leftReview = flip && flip.dir === 1 ? reviews[flip.to] : current;
  const frontReview = flip ? reviews[flip.dir === 1 ? flip.from : flip.to] : current;
  const backReview = flip ? reviews[flip.dir === 1 ? flip.to : flip.from] : current;

  return (
    <div className="diary-book" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="diary-book__book">
        {/* Left leaf — product photo */}
        <div className="diary-leaf diary-leaf--left">
          <img src={imgOf(leftReview)} alt={leftReview.product?.name || 'Sutaara piece'} draggable="false" />
          <div className="diary-leaf__edge--left" aria-hidden="true" />
        </div>

        {/* Right leaf — the review currently at rest */}
        <div className="diary-leaf diary-leaf--right">
          <Entry review={current} />
        </div>

        {/* Turning page overlaid on the right half */}
        {flip && (
          <div className={`diary-turn diary-turn--${flip.dir === 1 ? 'fwd' : 'bwd'} is-flipping`}>
            <div className="diary-turn__face diary-turn__face--front">
              <Entry review={frontReview} />
            </div>
            <div className="diary-turn__face diary-turn__face--back">
              <img src={imgOf(backReview)} alt={backReview.product?.name || 'Sutaara piece'} draggable="false" />
            </div>
          </div>
        )}

        <div className="diary-book__spine" aria-hidden="true" />
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
