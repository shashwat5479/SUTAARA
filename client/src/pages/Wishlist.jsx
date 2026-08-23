import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Heart } from '../components/Icons.jsx';

export default function Wishlist() {
  const { items } = useWishlist();

  return (
    <>
      <div className="page-head">
        <h1>Wishlist</h1>
        <div className="crumbs">
          <Link to="/">Home</Link> / <span>Wishlist</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          {items.length === 0 ? (
            <div className="empty">
              <Heart width="46" height="46" style={{ color: 'var(--line-strong)' }} />
              <h3>Your wishlist is empty</h3>
              <p>Tap the heart on any piece to save it for later.</p>
              <Link to="/shop" className="btn btn--primary">Explore the collection</Link>
            </div>
          ) : (
            <div className="grid">
              {items.map((p) => (
                <ProductCard product={p} key={p._id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
