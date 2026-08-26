import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function Stars({ n }) {
  return (
    <span className="rv-stars" aria-label={`${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? 'on' : ''}>★</span>
      ))}
    </span>
  );
}

// Shows a product's reviews, and — only for a signed-in customer who has
// actually bought this product and not yet reviewed it — a form to add one.
export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState({ canReview: false, alreadyReviewed: false });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.getProductReviews(productId).then(setReviews).catch(() => {});
  };

  useEffect(() => {
    load();
    if (user) {
      api.canReview(productId).then(setEligibility).catch(() => {});
    } else {
      setEligibility({ canReview: false, alreadyReviewed: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createReview({ productId, rating, title, body });
      toast(rating === 5 ? 'Thank you! Your review may appear in Sutaara Diaries.' : 'Thank you for your review.');
      setTitle('');
      setBody('');
      setEligibility({ canReview: false, alreadyReviewed: true });
      load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="product-reviews">
      <h3>Customer reviews</h3>

      {reviews.length === 0 ? (
        <p className="product-reviews__empty">No reviews yet. Bought this piece? Be the first to share your thoughts.</p>
      ) : (
        <ul className="product-reviews__list">
          {reviews.map((r) => (
            <li key={r._id} className="rv-item">
              <div className="rv-item__head">
                <Stars n={r.rating} />
                {r.verified && <span className="rv-verified">Verified purchase</span>}
              </div>
              {r.title && <h4>{r.title}</h4>}
              {r.body && <p>{r.body}</p>}
              <span className="rv-item__name">— {r.user?.name || 'Sutaara customer'}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Review form — gated to verified buyers */}
      {!user ? (
        <p className="product-reviews__note">
          <Link to="/login">Sign in</Link> to review a piece you have purchased.
        </p>
      ) : eligibility.alreadyReviewed ? (
        <p className="product-reviews__note">You have reviewed this piece. Thank you!</p>
      ) : eligibility.canReview ? (
        <form className="review-form" onSubmit={submit}>
          <h4>Write a review</h4>
          <div className="review-form__stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                className={i <= rating ? 'on' : ''}
                onClick={() => setRating(i)}
                aria-label={`${i} star${i > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A dream to drape" />
          </div>
          <div className="field">
            <label>Your review</label>
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <button className="btn btn--primary" disabled={busy}>
            {busy ? 'Posting…' : 'Post review'}
          </button>
          <p className="review-form__hint">Only 5-star reviews are featured in Sutaara Diaries.</p>
        </form>
      ) : (
        <p className="product-reviews__note">Only customers who have purchased this piece can review it.</p>
      )}
    </div>
  );
}
