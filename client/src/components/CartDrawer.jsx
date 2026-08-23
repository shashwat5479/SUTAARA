import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { inr } from '../utils/format.js';
import { Close, Minus, Plus, Bag } from './Icons.jsx';

export default function CartDrawer() {
  const { open, setOpen, items, setQty, remove, subtotal, shipping, total, freeShipAbove } =
    useCart();

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-label="Shopping bag">
        <div className="drawer__head">
          <h3>Your Bag</h3>
          <button className="close-btn" aria-label="Close" onClick={() => setOpen(false)}>
            <Close width="24" height="24" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty" style={{ margin: 'auto' }}>
            <Bag width="46" height="46" style={{ color: 'var(--line-strong)' }} />
            <h3>Your bag is empty</h3>
            <p>Beautiful things are waiting.</p>
            <Link to="/shop" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Explore the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer__body">
              {items.map((i) => (
                <div className="line-item" key={i._id}>
                  <Link
                    to={`/product/${i.slug}`}
                    className="line-item__img"
                    onClick={() => setOpen(false)}
                  >
                    <img src={i.image} alt={i.name} />
                  </Link>
                  <div>
                    <div className="line-item__name">{i.name}</div>
                    <div className="line-item__fabric">{i.fabric}</div>
                    <div className="stepper" style={{ height: 34, width: 'fit-content' }}>
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
                    <button className="line-item__remove" onClick={() => remove(i._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer__foot">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : inr(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--sage)', margin: '0 0 12px' }}>
                  Add {inr(freeShipAbove - subtotal)} more for free shipping.
                </p>
              )}
              <div className="summary-row summary-row--total">
                <span>Total</span>
                <span>{inr(total)}</span>
              </div>
              <Link
                to="/checkout"
                className="btn btn--primary btn--block"
                style={{ marginTop: 16 }}
                onClick={() => setOpen(false)}
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                className="btn btn--ghost btn--block"
                style={{ marginTop: 10 }}
                onClick={() => setOpen(false)}
              >
                View bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
