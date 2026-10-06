import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api/client.js';
import { inr } from '../utils/format.js';
import { fmtDate, statusText, statusHeadline, orderNo, OrderItemRow, OrderActions, useOrderActions } from '../components/OrderParts.jsx';

const ORDER_FILTERS = [
  { key: 'all', label: 'All orders', test: () => true },
  { key: 'active', label: 'In progress', test: (o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status) },
  { key: 'delivered', label: 'Delivered', test: (o) => o.status === 'delivered' },
  { key: 'closed', label: 'Cancelled & returns', test: (o) => ['cancelled', 'return_requested', 'return_approved', 'refund_initiated', 'refunded'].includes(o.status) },
];

// Amazon-style order list: each order is a card with a summary strip (date,
// total, ship-to, order number, "View order details"), then every item with a
// thumbnail and name that link to the product page.
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const actions = useOrderActions((updated) =>
    setOrders((cur) => cur.map((o) => (o._id === updated._id ? { ...o, ...updated, items: updated.items || o.items } : o)))
  );

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

  const current = ORDER_FILTERS.find((f) => f.key === filter) || ORDER_FILTERS[0];
  const shown = orders.filter(current.test);

  return (
    <div>
      <div className="ord-filters">
        {ORDER_FILTERS.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? 'active' : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({orders.filter(f.test).length})
          </button>
        ))}
      </div>

      {shown.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>No orders in this view.</p>}

      {shown.map((o) => {
        const inProgressReturn = ['return_requested', 'return_approved', 'refund_initiated'].includes(o.status);
        return (
          <div className="ord-card" key={o._id}>
            <div className="ord-card__strip">
              <div><span>Order placed</span><strong>{fmtDate(o.createdAt)}</strong></div>
              <div><span>Total</span><strong>{inr(o.totalPrice)}</strong></div>
              <div><span>Ship to</span><strong>{o.fullName}</strong></div>
              <div className="ord-card__no">
                <span>Order # {orderNo(o)}</span>
                <Link to={`/account/orders/${o._id}`}>View order details</Link>
              </div>
            </div>

            <div className="ord-card__body">
              <div className="ord-card__top">
                <h3>{statusHeadline(o)}</h3>
                <span className={`status-pill status-${o.status}`}>{statusText(o.status)}</span>
              </div>
              <div className="ord-card__cols">
                <div className="ord-items">
                  {o.items.map((i) => (
                    <OrderItemRow key={i.id || i._id || i.slug + i.name} item={i} />
                  ))}
                </div>
                <div className="ord-card__side">
                  <Link to={`/account/orders/${o._id}`} className="btn btn--primary ord-btn">
                    {['shipped', 'out_for_delivery'].includes(o.status) ? 'Track package' : 'View order details'}
                  </Link>
                  <OrderActions order={o} actions={actions} />
                </div>
              </div>
              {inProgressReturn && (
                <p className="ord-note">Your return/refund is in progress — we’ll keep you updated by email.</p>
              )}
            </div>
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
