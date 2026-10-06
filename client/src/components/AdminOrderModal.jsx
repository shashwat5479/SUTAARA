import { useEffect } from 'react';
import { inr } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';
import { fmtDate, statusText, orderNo, paymentLabel } from './OrderParts.jsx';

// Admin "what did this customer order?" panel: every item with its picture,
// SKU, quantity and price, plus who it's for, where it's going, and how it
// was paid. Opens from the Orders table.
export default function AdminOrderModal({ order: o, onClose }) {
  const toast = useToast();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const addressText = [
    o.fullName,
    o.line1,
    o.line2,
    `${o.city}, ${o.state} ${o.pincode}`,
    `Phone: ${o.phone}`,
  ]
    .filter(Boolean)
    .join('\n');

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(addressText);
      toast('Shipping address copied');
    } catch {
      toast('Could not copy — select the address and copy it manually');
    }
  };

  const qty = o.items.reduce((n, i) => n + i.qty, 0);

  return (
    <div className="aom-overlay" onClick={onClose}>
      <div className="aom" role="dialog" aria-modal="true" aria-label={`Order ${orderNo(o)}`} onClick={(e) => e.stopPropagation()}>
        <div className="aom__head">
          <div>
            <h3>Order {orderNo(o)}</h3>
            <span className="aom__sub">
              Placed {fmtDate(o.createdAt)} · <span className={`status-pill status-${o.status}`}>{statusText(o.status)}</span>
            </span>
          </div>
          <button className="aom__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="aom__body">
          <h4>Items ordered ({qty})</h4>
          <div className="aom__items">
            {o.items.map((i) => (
              <div className="aom__item" key={i.id || i._id || i.slug + i.name}>
                <div className="aom__img">{i.image ? <img src={i.image} alt={i.name} /> : null}</div>
                <div className="aom__info">
                  {i.available !== false ? (
                    <a href={`/product/${i.slug}`} target="_blank" rel="noreferrer" className="aom__name">{i.name}</a>
                  ) : (
                    <span className="aom__name">{i.name} <em>(archived)</em></span>
                  )}
                  <span className="aom__meta">
                    {i.sku ? <>SKU <b style={{ fontFamily: 'monospace' }}>{i.sku}</b></> : 'No SKU'}
                    {i.category ? ` · ${i.category}` : ''}
                  </span>
                  <span className="aom__meta">{inr(i.price)} each</span>
                </div>
                <div className="aom__qty">× {i.qty}</div>
                <div className="aom__line">{inr(i.price * i.qty)}</div>
              </div>
            ))}
          </div>

          <div className="aom__totals">
            <div><span>Items</span><span>{inr(o.itemsPrice)}</span></div>
            <div><span>Shipping</span><span>{o.shippingPrice ? inr(o.shippingPrice) : 'Free'}</span></div>
            {o.discountPrice > 0 && <div><span>Discount</span><span>− {inr(o.discountPrice)}</span></div>}
            {o.taxPrice > 0 && <div><span>Tax</span><span>{inr(o.taxPrice)}</span></div>}
            <div className="aom__grand"><span>Total</span><span>{inr(o.totalPrice)}</span></div>
          </div>

          <div className="aom__cols">
            <div>
              <h4>Customer</h4>
              <p>
                <strong>{o.user?.name || o.fullName}</strong>
                {o.user?.email && <><br />{o.user.email}</>}
                <br />{o.phone}
              </p>
              <h4>Payment</h4>
              <p>{paymentLabel(o)}{o.invoiceNumber ? <><br />Invoice {o.invoiceNumber}</> : null}</p>
            </div>
            <div>
              <h4>
                Ship to{' '}
                <button type="button" className="aom__copy" onClick={copyAddress}>Copy</button>
              </h4>
              <p style={{ whiteSpace: 'pre-line' }}>{addressText}</p>
              {(o.awbNumber || o.courierName) && (
                <>
                  <h4>Shipment</h4>
                  <p>
                    {o.courierName}
                    {o.awbNumber && <> · <span style={{ fontFamily: 'monospace' }}>{o.awbNumber}</span></>}
                    {o.trackingUrl && <><br /><a href={o.trackingUrl} target="_blank" rel="noreferrer" className="link-underline">Track package</a></>}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
