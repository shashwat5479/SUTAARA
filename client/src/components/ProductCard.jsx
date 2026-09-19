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
  const outOfStock = product.stock === 0;

  return (
    <article className={`card ${outOfStock ? 'card--oos' : ''}`}>
      <div className="card__media">
        <Link to={`/product/${product.slug}`}>
          <img src={product.images?.[0]} alt={product.name} loading="lazy" />
        </Link>
        {outOfStock ? (
          <span className="card__tag card__tag--oos">Out of Stock</span>
        ) : (
          product.isNewArrival && <span className="card__tag">New</span>
        )}
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
            disabled={outOfStock}
            onClick={() => {
              const result = add(product, 1);
              if (result === 'none') toast(`Only ${product.stock} in stock — already in your bag`);
              else if (result === 'capped') toast(`Only ${product.stock} in stock — added what's available`);
              else toast('Added to bag');
            }}
          >
            {outOfStock ? 'Out of Stock' : 'Add to bag'}
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
