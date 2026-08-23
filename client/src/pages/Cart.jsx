import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { inr } from '../utils/format.js';
import { Minus, Plus, Bag } from '../components/Icons.jsx';

export default function Cart() {
  const { items, setQty, remove, subtotal, shipping, total, freeShipAbove } = useCart();

  return (
    <>
      <div className="page-head">
        <h1>Your Bag</h1>
        <div className="crumbs">
          <Link to="/">Home</Link> / <span>Bag</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          {items.length === 0 ? (
            <div className="empty">
              <Bag width="46" height="46" style={{ color: 'var(--line-strong)' }} />
              <h3>Your bag is empty</h3>
              <p>Find something you’ll love to wear.</p>
              <Link to="/shop" className="btn btn--primary">Explore the collection</Link>
            </div>
          ) : (
            <div className="cart-page">
              <div className="cart-list">
                {items.map((i) => (
                  <div className="line-item" key={i._id}>
                    <Link to={`/product/${i.slug}`} className="line-item__img">
                      <img src={i.image} alt={i.name} />
                    </Link>
                    <div>
                      <Link to={`/product/${i.slug}`} className="line-item__name">{i.name}</Link>
                      <div className="line-item__fabric">{i.fabric}</div>
                      <div className="price-now" style={{ fontSize: '0.9rem' }}>{inr(i.price)}</div>
                      <div className="stepper" style={{ height: 36, width: 'fit-content', marginTop: 10 }}>
                        <button aria-label="Decrease" onClick={() => setQty(i._id, i.qty - 1)}>
                          <Minus width="14" height="14" />
                        </button>
                        <span>{i.qty}</span>
                        <button aria-label="Increase" onClick={() => setQty(i._id, i.qty + 1)}>
                          <Plus width="14" height="14" />
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="price-now">{inr(i.price * i.qty)}</div>
                      <button className="line-item__remove" onClick={() => remove(i._id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-card">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{inr(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : inr(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--sage)', margin: '0 0 12px' }}>
                    Add {inr(freeShipAbove - subtotal)} more for free shipping.
                  </p>
                )}
                <div className="summary-row summary-row--total">
                  <span>Total</span>
                  <span>{inr(total)}</span>
                </div>
                <Link to="/checkout" className="btn btn--primary btn--block" style={{ marginTop: 18 }}>
                  Proceed to checkout
                </Link>
                <Link to="/shop" className="btn btn--ghost btn--block" style={{ marginTop: 10 }}>
                  Continue shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
