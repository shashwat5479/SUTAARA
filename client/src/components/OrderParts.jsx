import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api/client.js';
import { payForOrder } from '../utils/razorpay.js';
import { inr } from '../utils/format.js';

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

export const statusText = (s) =>
  String(s || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export const orderNo = (o) => o.orderNumber || `#${String(o._id).slice(-8)}`;

// Plain-language headline for an order, like the line at the top of an
// Amazon order ("Delivered", "Arriving 12 October" …).
export function statusHeadline(o) {
  switch (o.status) {
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'return_requested':
      return 'Return requested';
    case 'return_approved':
      return 'Return approved';
    case 'refund_initiated':
      return 'Refund initiated';
    case 'refunded':
      return 'Refunded';
    case 'out_for_delivery':
      return 'Out for delivery';
    case 'shipped':
      return o.estDelivery ? `Arriving by ${fmtDate(o.estDelivery)}` : 'Shipped';
    case 'packed':
    case 'processing':
      return 'Being prepared';
    default:
      return 'Order placed';
  }
}

// Where the order is on the normal happy path (null for cancelled/returns).
const TRACK_STEPS = ['Ordered', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
const TRACK_INDEX = {
  pending: 0, confirmed: 0, processing: 1, packed: 1, shipped: 2, out_for_delivery: 3, delivered: 4,
};

export function ProgressTrack({ status }) {
  const at = TRACK_INDEX[status];
  if (at === undefined) return null;
  return (
    <ol className="ord-track">
      {TRACK_STEPS.map((label, idx) => (
        <li key={label} className={idx < at ? 'is-done' : idx === at ? 'is-current' : ''}>
          <span className="ord-track__dot" />
          <span className="ord-track__label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

// One purchased line: thumbnail + name link to the product page, qty and
// price, and a "View product" button — or a plain note if the product has
// since been removed from the shop.
export function OrderItemRow({ item }) {
  const available = item.available !== false;
  const img = item.image ? <img src={item.image} alt={item.name} /> : <div className="ord-item__noimg" />;
  return (
    <div className="ord-item">
      {available ? (
        <Link to={`/product/${item.slug}`} className="ord-item__img">{img}</Link>
      ) : (
        <div className="ord-item__img">{img}</div>
      )}
      <div className="ord-item__body">
        {available ? (
          <Link to={`/product/${item.slug}`} className="ord-item__name">{item.name}</Link>
        ) : (
          <span className="ord-item__name">{item.name}</span>
        )}
        <div className="ord-item__meta">
          Qty: {item.qty} · {inr(item.price)} each
        </div>
        <div className="ord-item__price">{inr(item.price * item.qty)}</div>
        {available ? (
          <Link to={`/product/${item.slug}`} className="btn btn--ghost ord-btn">
            {item.inStock ? 'View / buy again' : 'View product'}
          </Link>
        ) : (
          <span className="ord-item__gone">This product is no longer available</span>
        )}
      </div>
    </div>
  );
}

// Retry payment / download bill / request return — shared by the order list
// and the order detail page. `onUpdate(order)` receives a changed order.
export function useOrderActions(onUpdate) {
  const { user } = useAuth();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);

  const run = async (order, fn) => {
    setBusyId(order._id);
    try {
      await fn();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const retryPayment = (order) =>
    run(order, async () => {
      const result = await payForOrder(order, { customerEmail: user?.email });
      if (result.ok) {
        onUpdate(result.order);
        toast('Payment successful');
      } else if (!result.dismissed) {
        toast(result.message || 'Payment failed — please try again');
      }
    });

  const downloadInvoice = (order) =>
    run(order, () => api.downloadInvoice(order._id, order.orderNumber));

  const requestReturn = (order) => {
    const reason =
      window.prompt('Briefly tell us why you\u2019d like to return/refund this order (optional):') || '';
    return run(order, async () => {
      const updated = await api.requestReturn(order._id, reason);
      onUpdate(updated);
      toast('Return/refund request sent — we\u2019ll be in touch shortly');
    });
  };

  return { busyId, retryPayment, downloadInvoice, requestReturn };
}

export function OrderActions({ order, actions }) {
  const { busyId, retryPayment, downloadInvoice, requestReturn } = actions;
  const failed = order.paymentMethod === 'online' && order.paymentStatus === 'failed';
  const pending = order.paymentMethod === 'online' && order.paymentStatus === 'pending';
  const canRetry = (failed || pending) && order.status !== 'cancelled';
  const canDownload = Boolean(order.invoiceNumber);
  const canReturn = order.returnEligible && order.status === 'delivered';
  const busy = busyId === order._id;
  if (!canRetry && !canDownload && !canReturn) return null;
  return (
    <>
      {canRetry && (
        <button className="btn btn--primary ord-btn" onClick={() => retryPayment(order)} disabled={busy}>
          {busy ? 'Opening…' : 'Retry payment'}
        </button>
      )}
      {canDownload && (
        <button className="btn btn--ghost ord-btn" onClick={() => downloadInvoice(order)} disabled={busy}>
          {busy ? 'Preparing…' : 'Download bill (PDF)'}
        </button>
      )}
      {canReturn && (
        <button className="btn btn--ghost ord-btn" onClick={() => requestReturn(order)} disabled={busy}>
          {busy ? 'Sending…' : 'Return / refund'}
        </button>
      )}
    </>
  );
}

export function paymentLabel(o) {
  if (o.paymentMethod === 'cod') return 'Cash on delivery';
  if (o.paymentStatus === 'failed') return 'Online payment — failed';
  if (o.paymentStatus === 'pending') return 'Online payment — pending';
  return 'Online payment — paid';
}
