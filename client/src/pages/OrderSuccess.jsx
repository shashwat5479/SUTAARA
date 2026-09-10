import { useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { payForOrder } from '../utils/razorpay.js';
import { inr, WHATSAPP_NUMBER } from '../utils/format.js';
import { Check } from '../components/Icons.jsx';

export default function OrderSuccess() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(state?.order || null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const waText = encodeURIComponent(
    `Hi Sutaara, I just placed order ${order?.orderNumber || id}. Looking forward to it!`
  );

  const paymentFailed = order?.paymentMethod === 'online' && order?.paymentStatus === 'failed';
  const paymentPending = order?.paymentMethod === 'online' && order?.paymentStatus === 'pending';
  const canDownloadInvoice = Boolean(order?.invoiceNumber);

  const retryPayment = async () => {
    if (!order) return;
    setRetrying(true);
    setRetryError('');
    try {
      const result = await payForOrder(order, { customerEmail: user?.email });
      if (result.ok) {
        setOrder(result.order);
      } else if (!result.dismissed) {
        setRetryError(result.message || 'Payment failed again — please try a different method.');
      }
    } catch (err) {
      setRetryError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      await api.downloadInvoice(order._id || id, order?.orderNumber);
    } catch (err) {
      setRetryError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="success">
          <div className={`success__mark ${paymentFailed ? 'success__mark--warn' : ''}`}>
            <Check width="42" height="42" />
          </div>
          <span className="eyebrow">
            {paymentFailed ? 'Payment not completed' : 'Order placed'}
          </span>
          <h1>{paymentFailed ? 'Almost there' : 'Thank you'}</h1>
          <p style={{ color: 'var(--ink-soft)' }}>
            {paymentFailed
              ? 'Your order is saved, but the payment didn\u2019t go through. You can retry below.'
              : 'Your order has been received. We\u2019ll pack it with care and be in touch shortly.'}
          </p>

          <div className="order-box">
            <div className="summary-row">
              <span>Order number</span>
              <span style={{ fontFamily: 'monospace' }}>{order?.orderNumber || id}</span>
            </div>
            {order && (
              <>
                <div className="summary-row">
                  <span>Items</span>
                  <span>{order.items.reduce((n, i) => n + i.qty, 0)}</span>
                </div>
                <div className="summary-row">
                  <span>Payment</span>
                  <span>
                    {order.paymentMethod === 'cod'
                      ? 'Cash on delivery'
                      : paymentFailed
                        ? 'Pay online — failed'
                        : paymentPending
                          ? 'Pay online — pending'
                          : 'Pay online — paid ✓'}
                  </span>
                </div>
                <div className="summary-row summary-row--total">
                  <span>Total</span>
                  <span>{inr(order.totalPrice)}</span>
                </div>
              </>
            )}
          </div>

          {retryError && <div className="form-error" style={{ marginTop: 12 }}>{retryError}</div>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            {(paymentFailed || paymentPending) && (
              <button className="btn btn--primary" onClick={retryPayment} disabled={retrying}>
                {retrying ? 'Opening payment…' : `Retry payment · ${order ? inr(order.totalPrice) : ''}`}
              </button>
            )}
            {canDownloadInvoice && (
              <button className="btn btn--ghost" onClick={downloadInvoice} disabled={downloading}>
                {downloading ? 'Preparing PDF…' : 'Download bill (PDF)'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
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
