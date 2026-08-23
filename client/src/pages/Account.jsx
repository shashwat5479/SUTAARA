import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api/client.js';
import { inr } from '../utils/format.js';

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      {orders.map((o) => (
        <div className="order-card" key={o._id}>
          <div className="order-card__head">
            <div>
              <strong style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>#{o._id.slice(-8)}</strong>
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
            <span>{o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Pay online'}</span>
            <span>{inr(o.totalPrice)}</span>
          </div>
        </div>
      ))}
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
