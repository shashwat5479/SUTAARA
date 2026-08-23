import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { inr, discountPct } from '../utils/format.js';
import { Heart } from './Icons.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const toast = useToast();
  const off = discountPct(product.mrp, product.price);
  const wished = has(product._id);

  return (
    <article className="card">
      <div className="card__media">
        <Link to={`/product/${product.slug}`}>
          <img src={product.images?.[0]} alt={product.name} loading="lazy" />
        </Link>
        {product.isNewArrival && <span className="card__tag">New</span>}
        <button
          className={`card__wish ${wished ? 'active' : ''}`}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={() => {
            toggle(product);
            toast(wished ? 'Removed from wishlist' : 'Saved to wishlist');
          }}
        >
          <Heart filled={wished} />
        </button>
        <div className="card__quick">
          <button
            className="btn btn--gold btn--block btn--sm"
            onClick={() => {
              add(product, 1);
              toast('Added to bag');
            }}
          >
            Add to bag
          </button>
        </div>
      </div>
      <Link to={`/product/${product.slug}`}>
        <div className="card__fabric">{product.fabric}</div>
        <h3 className="card__name">{product.name}</h3>
        <div className="card__price">
          <span className="price-now">{inr(product.price)}</span>
          {off > 0 && <span className="price-was">{inr(product.mrp)}</span>}
          {off > 0 && <span className="price-off">{off}% off</span>}
        </div>
      </Link>
    </article>
  );
}
