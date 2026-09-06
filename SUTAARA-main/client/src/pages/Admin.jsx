import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { inr } from '../utils/format.js';
import MediaUploader from '../components/MediaUploader.jsx';
import { HeroSlidesTab, ExhibitionTab, DiariesTab, TeamTab, AnnouncementTab, NotificationsTab } from '../components/AdminPanels.jsx';

const EMPTY = {
  name: '',
  category: 'saree',
  fabric: '',
  occasion: '',
  color: '',
  sku: '',
  sareeLength: '',
  blousePiece: '',
  stylingNote: '',
  price: '',
  mrp: '',
  images: [],
  video: '',
  description: '',
  care: '',
  blouseNote: '',
  stock: 10,
  featured: false,
  isNewArrival: false,
};

const CATEGORIES = [
  { value: 'saree', label: 'Saree' },
  { value: 'suit', label: 'Suit Set' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'dupatta', label: 'Dupatta' },
  { value: 'potli', label: 'Potli / Bag' },
];

// Fabric suggestions per category — a datalist, not a hard restriction, so
// you can still type a fabric that isn't in the list.
const FABRICS = [
  'Banarasi Silk', 'Silk', 'Cotton', 'Mul Cotton', 'Chanderi', 'Linen',
  'Tissue', 'Organza', 'Maheshwari', 'Kota', 'Modal', 'Georgette',
  'Chiffon', 'Net', 'Velvet', 'Brocade', 'Ajrakh Cotton', 'Cotton Silk',
];
const OCCASIONS = ['Wedding', 'Festive', 'Party', 'Everyday', 'Daywear'];

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const APPOINTMENT_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled'];

function ProductForm({ initial, onDone, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY;
    return {
      ...EMPTY,
      ...initial,
      images: Array.isArray(initial.images) ? initial.images : [],
      video: initial.video || '',
    };
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  // Called by the MediaUploader with { images, video }.
  const setMedia = ({ images, video }) =>
    setForm((f) => ({ ...f, images, video }));

  const submit = async (e) => {
    e.preventDefault();
    const images = (form.images || []).map((s) => s.trim()).filter(Boolean);
    if (images.length === 0) {
      toast('Add at least one photo');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        fabric: form.fabric.trim(),
        occasion: form.occasion.trim(),
        color: form.color.trim(),
        sku: form.sku.trim(),
        sareeLength: form.sareeLength.trim(),
        blousePiece: form.blousePiece.trim(),
        stylingNote: form.stylingNote.trim(),
        price: Number(form.price),
        mrp: Number(form.mrp) || 0,
        stock: Number(form.stock) || 0,
        images,
        video: (form.video || '').trim(),
        description: form.description.trim(),
        care: form.care.trim(),
        blouseNote: form.blouseNote.trim(),
        featured: !!form.featured,
        isNewArrival: !!form.isNewArrival,
      };
      if (initial) {
        await api.updateProduct(initial._id, payload);
        toast('Product updated');
      } else {
        await api.createProduct(payload);
        toast('Product created');
      }
      onDone();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="checkout__panel admin-form">
      <h3>{initial ? 'Edit product' : 'New product'}</h3>

      <div className="field">
        <label>Name</label>
        <input value={form.name} onChange={set('name')} required placeholder="Peacock Teal Banarasi Silk Saree" />
      </div>

      <p className="admin-form__legend">Specifications</p>
      <div className="field__row">
        <div className="field">
          <label>Category</label>
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Fabric</label>
          <input list="fabric-list" value={form.fabric} onChange={set('fabric')} placeholder="Banarasi Silk" />
          <datalist id="fabric-list">
            {FABRICS.map((f) => <option key={f} value={f} />)}
          </datalist>
        </div>
      </div>

      <div className="field__row">
        <div className="field">
          <label>Occasion</label>
          <input list="occasion-list" value={form.occasion} onChange={set('occasion')} placeholder="Wedding" />
          <datalist id="occasion-list">
            {OCCASIONS.map((o) => <option key={o} value={o} />)}
          </datalist>
        </div>
        <div className="field">
          <label>Colour</label>
          <input value={form.color} onChange={set('color')} placeholder="Mustard Yellow" />
        </div>
      </div>

      <div className="field__row">
        <div className="field">
          <label>SKU</label>
          <input value={form.sku} onChange={set('sku')} placeholder="ABSA154" />
        </div>
        <div className="field">
          <label>Saree Length <span className="field__opt">(sarees only)</span></label>
          <input value={form.sareeLength} onChange={set('sareeLength')} placeholder="5.5 m" />
        </div>
      </div>

      <div className="field__row">
        <div className="field">
          <label>Blouse Piece <span className="field__opt">(if applicable)</span></label>
          <input value={form.blousePiece} onChange={set('blousePiece')} placeholder="Yes; 1 m" />
        </div>
        <div className="field">
          <label>Care</label>
          <input value={form.care} onChange={set('care')} placeholder="Dry clean only" />
        </div>
      </div>

      <div className="field">
        <label>Sutaara Styling Note <span className="field__opt">(optional)</span></label>
        <textarea rows="3" value={form.stylingNote} onChange={set('stylingNote')} placeholder="Pair it with the running blouse for an easy coordinated look…" />
      </div>

      <div className="field__row">
        <div className="field">
          <label>Price (₹)</label>
          <input type="number" min="0" value={form.price} onChange={set('price')} required />
        </div>
        <div className="field">
          <label>MRP (₹)</label>
          <input type="number" min="0" value={form.mrp} onChange={set('mrp')} />
        </div>
        <div className="field">
          <label>Stock</label>
          <input type="number" min="0" value={form.stock} onChange={set('stock')} />
        </div>
      </div>

      <p className="admin-form__legend">
        Photos &amp; video <span>— upload from your gallery. First photo is the main image.</span>
      </p>
      <MediaUploader images={form.images} video={form.video} onChange={setMedia} target={0.8} />

      <p className="admin-form__legend">Details</p>
      <div className="field">
        <label>Description</label>
        <textarea rows="3" value={form.description} onChange={set('description')} />
      </div>
      <div className="field">
        <label>Care instructions</label>
        <textarea rows="2" value={form.care} onChange={set('care')} />
      </div>
      <div className="field">
        <label>Note (blouse piece, set contents, length…)</label>
        <input value={form.blouseNote} onChange={set('blouseNote')} placeholder="Comes with an unstitched blouse piece (0.8m)." />
      </div>

      <div style={{ display: 'flex', gap: 20, margin: '4px 0 18px' }}>
        <label className="filter-opt">
          <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured
        </label>
        <label className="filter-opt">
          <input type="checkbox" checked={form.isNewArrival} onChange={set('isNewArrival')} /> New arrival
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProductsTab() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // product | 'new' | null
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .getProducts({ limit: 60, sort: 'newest' })
      .then((res) => setProducts(res.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (p) => {
    if (!window.confirm(`Delete “${p.name}”?`)) return;
    try {
      await api.deleteProduct(p._id);
      toast('Product deleted');
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  if (editing) {
    return (
      <ProductForm
        initial={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="shop__count">{products.length} products</span>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing('new')}>
          + New product
        </button>
      </div>
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td><img src={p.images?.[0]} alt="" /></td>
                <td>{p.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td>{inr(p.price)}</td>
                <td>{p.stock}</td>
                <td className="table__actions">
                  <button onClick={() => setEditing(p)}>Edit</button>
                  <button onClick={() => del(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function OrdersTab() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getAllOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      setOrders((cur) => cur.map((o) => (o._id === id ? { ...o, status } : o)));
      toast('Order updated');
    } catch (err) {
      toast(err.message);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (orders.length === 0) return <div className="empty"><h3>No orders yet</h3></div>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Payment</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o._id}>
            <td style={{ fontFamily: 'monospace' }}>#{o._id.slice(-8)}</td>
            <td>{o.user?.name || '—'}<br /><span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{o.user?.email}</span></td>
            <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
            <td>{inr(o.totalPrice)}</td>
            <td style={{ textTransform: 'uppercase', fontSize: '0.78rem' }}>{o.paymentMethod}</td>
            <td>
              <select
                className="select"
                value={o.status}
                onChange={(e) => changeStatus(o._id, e.target.value)}
                style={{ padding: '6px 28px 6px 10px' }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AppointmentsTab() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getAllAppointments().then(setAppointments).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      setAppointments((cur) => cur.map((a) => (a._id === id ? { ...a, status } : a)));
      toast('Appointment updated');
    } catch (err) {
      toast(err.message);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (appointments.length === 0) return <div className="empty"><h3>No studio appointments yet</h3></div>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Service</th>
          <th>Date</th>
          <th>Time</th>
          <th>Contact</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((a) => (
          <tr key={a._id}>
            <td>{a.name}</td>
            <td>{a.service}</td>
            <td>{new Date(a.preferredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            <td>{a.preferredTime}</td>
            <td>{a.phone}<br /><span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{a.email}</span></td>
            <td>
              <select
                className="select"
                value={a.status}
                onChange={(e) => changeStatus(a._id, e.target.value)}
                style={{ padding: '6px 28px 6px 10px' }}
              >
                {APPOINTMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StudioEventTab() {
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', location: '', address: '',
    startDate: '', endDate: '', hours: '', phone: '', heroImage: '', active: true,
  });

  const load = () => {
    setLoading(true);
    api.getAllStudioEvents()
      .then((list) => {
        const ev = list && list[0];
        if (ev) {
          setEvent(ev);
          setForm({
            title: ev.title || '',
            subtitle: ev.subtitle || '',
            description: ev.description || '',
            location: ev.location || '',
            address: ev.address || '',
            startDate: ev.startDate ? ev.startDate.slice(0, 10) : '',
            endDate: ev.endDate ? ev.endDate.slice(0, 10) : '',
            hours: ev.hours || '',
            phone: ev.phone || '',
            heroImage: ev.heroImage || '',
            active: ev.active,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (event) {
        const updated = await api.updateStudioEvent(event._id, form);
        setEvent(updated);
      } else {
        const created = await api.createStudioEvent(form);
        setEvent(created);
      }
      toast('Studio event saved');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <form onSubmit={save} className="checkout__panel admin-form" style={{ maxWidth: 720 }}>
      <h3>Studio / Exhibition event</h3>
      <p className="admin-form__legend">
        Shown on the public <strong>/studio</strong> page. Leave fields blank to hide them.
      </p>

      <div className="field">
        <label>Title</label>
        <input value={form.title} onChange={set('title')} placeholder="Festive Exhibition — Lucknow" required />
      </div>
      <div className="field">
        <label>Subtitle</label>
        <input value={form.subtitle} onChange={set('subtitle')} placeholder="Meet the makers, feel the fabric." />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea rows="4" value={form.description} onChange={set('description')} placeholder="Full details about the event..." />
      </div>

      <div className="field__row">
        <div className="field">
          <label>Start date</label>
          <input type="date" value={form.startDate} onChange={set('startDate')} />
        </div>
        <div className="field">
          <label>End date</label>
          <input type="date" value={form.endDate} onChange={set('endDate')} />
        </div>
      </div>

      <div className="field__row">
        <div className="field">
          <label>Location</label>
          <input value={form.location} onChange={set('location')} placeholder="Lucknow, Uttar Pradesh" />
        </div>
        <div className="field">
          <label>Hours</label>
          <input value={form.hours} onChange={set('hours')} placeholder="11 AM - 7 PM" />
        </div>
      </div>

      <div className="field">
        <label>Address</label>
        <input value={form.address} onChange={set('address')} placeholder="Full studio address" />
      </div>

      <div className="field__row">
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={set('phone')} placeholder="+91 ..." />
        </div>
        <div className="field">
          <label>Hero image path</label>
          <input value={form.heroImage} onChange={set('heroImage')} placeholder="/products/mauve-kalamkari-peacock-1.jpg" />
        </div>
      </div>

      <div style={{ margin: '4px 0 18px' }}>
        <label className="filter-opt">
          <input type="checkbox" checked={form.active} onChange={set('active')} /> Show this event on the studio page
        </label>
      </div>

      <button className="btn btn--primary" disabled={busy}>
        {busy ? 'Saving…' : event ? 'Update event' : 'Create event'}
      </button>
    </form>
  );
}

export default function Admin() {
  const { isContentAdmin, isSuperAdmin, role } = useAuth();
  // Staff see only Orders (+ read-only products). Admins & super-admins get the
  // content/UI tabs. Super-admins additionally get the Team tab.
  const [tab, setTab] = useState(isContentAdmin ? 'products' : 'orders');

  const roleLabel = role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Staff';

  return (
    <>
      <div className="page-head">
        <h1>Admin Dashboard</h1>
        <div className="crumbs">Signed in as {roleLabel}</div>
      </div>
      <section className="section--tight">
        <div className="container">
          <div className="admin-tabs">
            {isContentAdmin && (
              <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
                Products
              </button>
            )}
            <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
              Orders
            </button>
            <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>
              Studio Appointments
            </button>
            {isContentAdmin && (
              <>
                <button className={tab === 'event' ? 'active' : ''} onClick={() => setTab('event')}>
                  Studio Event
                </button>
                <button className={tab === 'hero' ? 'active' : ''} onClick={() => setTab('hero')}>
                  Hero Panel
                </button>
                <button className={tab === 'exhibition' ? 'active' : ''} onClick={() => setTab('exhibition')}>
                  Exhibition
                </button>
                <button className={tab === 'diaries' ? 'active' : ''} onClick={() => setTab('diaries')}>
                  Diaries / Reviews
                </button>
                <button className={tab === 'announce' ? 'active' : ''} onClick={() => setTab('announce')}>
                  Announcement
                </button>
                <button className={tab === 'notify' ? 'active' : ''} onClick={() => setTab('notify')}>
                  Notifications
                </button>
              </>
            )}
            {isSuperAdmin && (
              <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
                Team
              </button>
            )}
          </div>
          {tab === 'products' && isContentAdmin ? <ProductsTab />
            : tab === 'orders' ? <OrdersTab />
            : tab === 'appointments' ? <AppointmentsTab />
            : tab === 'event' && isContentAdmin ? <StudioEventTab />
            : tab === 'hero' && isContentAdmin ? <HeroSlidesTab />
            : tab === 'exhibition' && isContentAdmin ? <ExhibitionTab />
            : tab === 'diaries' && isContentAdmin ? <DiariesTab />
            : tab === 'announce' && isContentAdmin ? <AnnouncementTab />
            : tab === 'notify' && isContentAdmin ? <NotificationsTab />
            : tab === 'team' && isSuperAdmin ? <TeamTab />
            : <OrdersTab />}
        </div>
      </section>
    </>
  );
}