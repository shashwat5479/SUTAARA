import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { inr } from '../utils/format.js';
import {
  fmtDate, statusText, statusHeadline, orderNo, paymentLabel,
  ProgressTrack, OrderItemRow, OrderActions, useOrderActions,
} from '../components/OrderParts.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const actions = useOrderActions((updated) => setOrder((cur) => ({ ...cur, ...updated, items: updated.items || cur.items })));

  useEffect(() => {
    let alive = true;
    setOrder(null);
    setError('');
    api
      .getOrder(id)
      .then((o) => alive && setOrder(o))
      .catch((err) => alive && setError(err.message || 'Could not load this order'));
    return () => { alive = false; };
  }, [id]);

  if (error) {
    return (
      <section className="section--tight">
        <div className="container">
          <div className="empty">
            <h3>We couldn’t open this order</h3>
            <p>{error}</p>
            <Link to="/account" className="btn btn--primary">Back to My Orders</Link>
          </div>
        </div>
      </section>
    );
  }
  if (!order) return <div className="loader"><div className="spinner" /></div>;

  const history = order.statusHistory || [];
  const inProgressReturn = ['return_requested', 'return_approved', 'refund_initiated'].includes(order.status);

  return (
    <>
      <div className="page-head">
        <h1>Order details</h1>
        <div className="crumbs">
          <Link to="/account">Your account</Link> / <Link to="/account">Your orders</Link> / <span>{orderNo(order)}</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container ord-detail">
          <div className="ord-headline">
            <div>
              <span>Ordered on {fmtDate(order.createdAt)}</span>
              <span className="ord-sep">|</span>
              <span>Order # <strong style={{ fontFamily: 'monospace' }}>{orderNo(order)}</strong></span>
            </div>
            <div className="ord-headline__actions">
              <OrderActions order={order} actions={actions} />
            </div>
          </div>

          <div className="ord-summary-grid">
            <div className="ord-box">
              <h4>Shipping address</h4>
              <p>
                <strong>{order.fullName}</strong><br />
                {order.line1}<br />
                {order.line2 && <>{order.line2}<br /></>}
                {order.city}, {order.state} {order.pincode}<br />
                Phone: {order.phone}
              </p>
            </div>
            <div className="ord-box">
              <h4>Payment method</h4>
              <p>{paymentLabel(order)}</p>
              {order.invoiceNumber && <p className="ord-box__sub">Invoice {order.invoiceNumber}</p>}
            </div>
            <div className="ord-box">
              <h4>Order summary</h4>
              <div className="ord-sumrow"><span>Items</span><span>{inr(order.itemsPrice)}</span></div>
              <div className="ord-sumrow">
                <span>Shipping</span><span>{order.shippingPrice ? inr(order.shippingPrice) : 'Free'}</span>
              </div>
              {order.discountPrice > 0 && (
                <div className="ord-sumrow"><span>Discount</span><span>− {inr(order.discountPrice)}</span></div>
              )}
              {order.taxPrice > 0 && (
                <div className="ord-sumrow"><span>Tax</span><span>{inr(order.taxPrice)}</span></div>
              )}
              <div className="ord-sumrow ord-sumrow--total"><span>Total</span><span>{inr(order.totalPrice)}</span></div>
            </div>
          </div>

          <div className="ord-panel">
            <div className="ord-panel__head">
              <h3>{statusHeadline(order)}</h3>
              <span className={`status-pill status-${order.status}`}>{statusText(order.status)}</span>
            </div>
            <ProgressTrack status={order.status} />

            {(order.awbNumber || order.courierName || order.trackingUrl || order.estDelivery) && (
              <div className="ord-shipinfo">
                {order.courierName && <div><span>Courier</span><strong>{order.courierName}</strong></div>}
                {order.awbNumber && <div><span>Tracking no.</span><strong style={{ fontFamily: 'monospace' }}>{order.awbNumber}</strong></div>}
                {order.estDelivery && order.status !== 'delivered' && (
                  <div><span>Expected by</span><strong>{fmtDate(order.estDelivery)}</strong></div>
                )}
                {order.trackingUrl && (
                  <a className="btn btn--primary ord-btn" href={order.trackingUrl} target="_blank" rel="noreferrer">
                    Track package
                  </a>
                )}
              </div>
            )}

            {inProgressReturn && (
              <p className="ord-note">Your return/refund is in progress — we’ll keep you updated by email.</p>
            )}

            <div className="ord-items">
              {order.items.map((i) => (
                <OrderItemRow key={i.id || i._id || i.slug + i.name} item={i} />
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="ord-panel">
              <h3>Order updates</h3>
              <ul className="ord-history">
                {[...history].reverse().map((h) => (
                  <li key={h.id || h._id || h.createdAt}>
                    <strong>{statusText(h.status)}</strong>
                    <span>{new Date(h.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    {h.note && <em>{h.note}</em>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link to="/account" className="btn btn--ghost">← Back to My Orders</Link>
        </div>
      </section>
    </>
  );
}
