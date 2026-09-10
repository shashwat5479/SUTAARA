import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api/client.js';
import { payForOrder } from '../utils/razorpay.js';
import { inr } from '../utils/format.js';

function OrdersTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const retryPayment = async (order) => {
    setBusyId(order._id);
    try {
      const result = await payForOrder(order, { customerEmail: user?.email });
      if (result.ok) {
        setOrders((cur) => cur.map((o) => (o._id === order._id ? result.order : o)));
        toast('Payment successful');
      } else if (!result.dismissed) {
        toast(result.message || 'Payment failed — please try again');
      }
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const downloadInvoice = async (order) => {
    setBusyId(order._id);
    try {
      await api.downloadInvoice(order._id, order.orderNumber);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const requestReturn = async (order) => {
    const reason = window.prompt('Briefly tell us why you\u2019d like to return/refund this order (optional):') || '';
    setBusyId(order._id);
    try {
      const updated = await api.requestReturn(order._id, reason);
      setOrders((cur) => cur.map((o) => (o._id === order._id ? updated : o)));
      toast('Return/refund request sent — we\u2019ll be in touch shortly');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (orders.length === 0) {
    return (
      <div className="empty">
        <h3>No orders yet</h3>
        <p>When you place an order, it’ll show up here.</p>
        <Link to="/shop" className="btn btn--primary">Start shopping</Link>
      </div>
    );
  }

  return (
    <div>
      {orders.map((o) => {
        const paymentFailed = o.paymentMethod === 'online' && o.paymentStatus === 'failed';
        const paymentPending = o.paymentMethod === 'online' && o.paymentStatus === 'pending';
        const canRetry = paymentFailed || paymentPending;
        const canDownload = Boolean(o.invoiceNumber);
        const canRequestReturn = o.returnEligible && o.status === 'delivered';
        return (
          <div className="order-card" key={o._id}>
            <div className="order-card__head">
              <div>
                <strong style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{o.orderNumber || `#${o._id.slice(-8)}`}</strong>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', marginLeft: 10 }}>
                  {new Date(o.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className={`status-pill status-${o.status}`}>{o.status}</span>
            </div>
            {o.items.map((i) => (
              <div className="summary-row" key={i.slug + i.name}>
                <span>{i.name} × {i.qty}</span>
                <span>{inr(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="summary-row summary-row--total">
              <span>
                {o.paymentMethod === 'cod'
                  ? 'Cash on delivery'
                  : paymentFailed
                    ? 'Pay online — failed'
                    : paymentPending
                      ? 'Pay online — pending'
                      : 'Pay online — paid ✓'}
              </span>
              <span>{inr(o.totalPrice)}</span>
            </div>
            {(canRetry || canDownload || canRequestReturn) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {canRetry && (
                  <button
                    className="btn btn--primary"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                    onClick={() => retryPayment(o)}
                    disabled={busyId === o._id}
                  >
                    {busyId === o._id ? 'Opening…' : 'Retry payment'}
                  </button>
                )}
                {canDownload && (
                  <button
                    className="btn btn--ghost"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                    onClick={() => downloadInvoice(o)}
                    disabled={busyId === o._id}
                  >
                    {busyId === o._id ? 'Preparing…' : 'Download bill (PDF)'}
                  </button>
                )}
                {canRequestReturn && (
                  <button
                    className="btn btn--ghost"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                    onClick={() => requestReturn(o)}
                    disabled={busyId === o._id}
                  >
                    {busyId === o._id ? 'Sending…' : 'Request return / refund'}
                  </button>
                )}
              </div>
            )}
            {['return_requested', 'return_approved', 'refund_initiated'].includes(o.status) && (
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: 10 }}>
                Your return/refund is in progress — we’ll keep you updated by email.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { name: form.name, phone: form.phone };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      setForm((f) => ({ ...f, password: '' }));
      toast('Profile updated');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} style={{ maxWidth: 460 }}>
      <div className="field">
        <label>Full name</label>
        <input value={form.name} onChange={set('name')} required />
      </div>
      <div className="field">
        <label>Email</label>
        <input value={user.email} disabled />
      </div>
      <div className="field">
        <label>Phone</label>
        <input value={form.phone} onChange={set('phone')} inputMode="tel" />
      </div>
      <div className="field">
        <label>New password (leave blank to keep)</label>
        <input type="password" value={form.password} onChange={set('password')} minLength={6} />
      </div>
      <button className="btn btn--primary" disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

export default function Account() {
  const { user, logout, isAdmin } = useAuth();
  const [tab, setTab] = useState('orders');

  return (
    <>
      <div className="page-head">
        <h1>My Account</h1>
        <div className="crumbs">Hello, {user.name.split(' ')[0]}</div>
      </div>

      <section className="section--tight">
        <div className="container">
          <div className="account">
            <div className="account__nav">
              <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
                My Orders
              </button>
              <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
                Profile
              </button>
              <Link to="/wishlist">
                <button style={{ width: '100%', textAlign: 'left' }}>Wishlist</button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <button style={{ width: '100%', textAlign: 'left' }}>Admin Dashboard</button>
                </Link>
              )}
              <button onClick={logout} style={{ color: 'var(--sindoor)' }}>Sign out</button>
            </div>
            <div>{tab === 'orders' ? <OrdersTab /> : <ProfileTab />}</div>
          </div>
        </div>
      </section>
    </>
  );
}
