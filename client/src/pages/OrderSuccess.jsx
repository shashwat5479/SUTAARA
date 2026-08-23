import { useLocation, useParams, Link } from 'react-router-dom';
import { inr, WHATSAPP_NUMBER } from '../utils/format.js';
import { Check } from '../components/Icons.jsx';

export default function OrderSuccess() {
  const { id } = useParams();
  const { state } = useLocation();
  const order = state?.order;

  const waText = encodeURIComponent(
    `Hi Sutaara, I just placed order ${id}. Looking forward to it!`
  );

  return (
    <section className="section">
      <div className="container">
        <div className="success">
          <div className="success__mark">
            <Check width="42" height="42" />
          </div>
          <span className="eyebrow">Order placed</span>
          <h1>Thank you</h1>
          <p style={{ color: 'var(--ink-soft)' }}>
            Your order has been received. We’ll pack it with care and be in touch shortly.
          </p>

          <div className="order-box">
            <div className="summary-row">
              <span>Order number</span>
              <span style={{ fontFamily: 'monospace' }}>{id}</span>
            </div>
            {order && (
              <>
                <div className="summary-row">
                  <span>Items</span>
                  <span>{order.items.reduce((n, i) => n + i.qty, 0)}</span>
                </div>
                <div className="summary-row">
                  <span>Payment</span>
                  <span>{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Pay online (pending)'}</span>
                </div>
                <div className="summary-row summary-row--total">
                  <span>Total</span>
                  <span>{inr(order.totalPrice)}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/account" className="btn btn--primary">View my orders</Link>
            <a
              className="btn btn--ghost"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
            >
              Confirm on WhatsApp
            </a>
          </div>
          <div style={{ marginTop: 20 }}>
            <Link to="/shop" className="link-underline">Continue shopping</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
