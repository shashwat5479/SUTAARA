import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api/client.js';
import { inr } from '../utils/format.js';
import AddressFields from '../components/AddressFields.jsx';
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

const blankAddress = (user) => ({
  label: 'Home', fullName: user?.name || '', phone: user?.phone || '',
  line1: '', line2: '', city: '', state: '', pincode: '',
});

// Manage saved delivery addresses: add (optionally from the current
// location), edit, delete and choose the default. Checkout offers the same list.
function AddressesTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | address id
  const [form, setForm] = useState(blankAddress(user));
  const [makeDefault, setMakeDefault] = useState(false);
  const [locateTick, setLocateTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.getAddresses().then(setAddresses).catch((err) => { setAddresses([]); toast(err.message); });
  useEffect(() => { load(); }, []);

  const openNew = (locate) => {
    setForm(blankAddress(user));
    setMakeDefault(false);
    setEditing('new');
    if (locate) setLocateTick((n) => n + 1);
  };
  const openEdit = (a) => {
    setForm({
      label: a.label || 'Home', fullName: a.fullName, phone: a.phone, line1: a.line1,
      line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode,
    });
    setMakeDefault(a.isDefault);
    setEditing(a._id);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing === 'new') await api.addAddress({ ...form, isDefault: makeDefault });
      else await api.updateAddress(editing, { ...form, ...(makeDefault ? { isDefault: true } : {}) });
      toast('Address saved');
      setEditing(null);
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await api.deleteAddress(a._id);
      toast('Address removed');
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const setDefault = async (a) => {
    try {
      await api.updateAddress(a._id, { isDefault: true });
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  if (addresses === null) return <div className="loader"><div className="spinner" /></div>;

  if (editing) {
    return (
      <form className="checkout__panel" onSubmit={save}>
        <h3>{editing === 'new' ? 'Add a new address' : 'Edit address'}</h3>
        <AddressFields form={form} setForm={setForm} autoLocate={locateTick} />
        <label className="addr-save">
          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
          Make this my default address
        </label>
        <div className="addr-form-actions">
          <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
          <button type="button" className="addr-link" onClick={() => setEditing(null)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="addr-head">
        <h3 style={{ margin: 0 }}>Saved addresses</h3>
        <button type="button" className="addr-link" onClick={() => openNew(true)}>◎ Use my current location</button>
      </div>
      {addresses.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', margin: '14px 0' }}>
          No saved addresses yet. Add one and checkout will be a single tap.
        </p>
      )}
      <div className="addr-list" style={{ marginTop: 16 }}>
        {addresses.map((a) => (
          <div key={a._id} className="addr-card addr-card--static">
            <div className="addr-card__body">
              <div className="addr-card__top">
                <strong>{a.fullName}</strong>
                <span className="addr-tag">{a.label}</span>
                {a.isDefault && <span className="addr-tag addr-tag--default">Default</span>}
              </div>
              <p>
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state} – {a.pincode}
              </p>
              <p className="addr-card__phone">Mobile: {a.phone}</p>
              <div className="addr-card__actions">
                <button type="button" onClick={() => openEdit(a)}>Edit</button>
                <button type="button" onClick={() => remove(a)}>Remove</button>
                {!a.isDefault && <button type="button" onClick={() => setDefault(a)}>Set as default</button>}
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="addr-add" onClick={() => openNew(false)}>+ Add a new address</button>
      </div>
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
              <button className={tab === 'addresses' ? 'active' : ''} onClick={() => setTab('addresses')}>
                Addresses
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
            <div>{tab === 'orders' ? <OrdersTab /> : tab === 'addresses' ? <AddressesTab /> : <ProfileTab />}</div>
          </div>
        </div>
      </section>
    </>
  );
}
