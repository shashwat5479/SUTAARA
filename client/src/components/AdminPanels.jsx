import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import MediaUploader from './MediaUploader.jsx';
import { inr } from '../utils/format.js';

/* ---------------- Hero slides tab ---------------- */
export function HeroSlidesTab() {
  const toast = useToast();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // slide | 'new' | null

  const load = () => {
    setLoading(true);
    api.getAllHeroSlides().then(setSlides).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (s) => {
    if (!window.confirm('Delete this hero slide?')) return;
    try { await api.deleteHeroSlide(s._id); toast('Slide deleted'); load(); }
    catch (err) { toast(err.message); }
  };

  if (editing) {
    return <HeroSlideForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />;
  }

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="shop__count">{slides.length} hero slides</span>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing('new')}>+ New slide</button>
      </div>
      {slides.length === 0 ? (
        <div className="empty"><h3>No hero slides yet</h3><p>Add up to a few; each shows a strip of images and links to a product.</p></div>
      ) : (
        <table className="table">
          <thead><tr><th></th><th>Title</th><th>Links to</th><th>Order</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {slides.map((s) => (
              <tr key={s._id}>
                <td><img src={s.images?.[0]} alt="" /></td>
                <td>{s.title || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.slug || '—'}</td>
                <td>{s.order}</td>
                <td>{s.active ? 'Yes' : 'No'}</td>
                <td className="table__actions">
                  <button onClick={() => setEditing(s)}>Edit</button>
                  <button onClick={() => del(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function HeroSlideForm({ initial, onCancel, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState(() => initial || { title: '', slug: '', images: [], heading: '', subheading: '', description: '', ctaText: '', ctaLink: '', order: 0, active: true });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.images || form.images.length === 0) { toast('Add at least one image'); return; }
    setBusy(true);
    try {
      const payload = {
        title: form.title, slug: form.slug, images: form.images,
        heading: form.heading, subheading: form.subheading,
        description: form.description, ctaText: form.ctaText, ctaLink: form.ctaLink,
        order: Number(form.order) || 0, active: !!form.active,
      };
      if (initial) await api.updateHeroSlide(initial._id, payload);
      else await api.createHeroSlide(payload);
      toast('Hero slide saved');
      onDone();
    } catch (err) { toast(err.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="checkout__panel admin-form" style={{ maxWidth: 640 }}>
      <h3>{initial ? 'Edit hero slide' : 'New hero slide'}</h3>
      <div className="field"><label>Title (for your reference)</label><input value={form.title} onChange={set('title')} placeholder="Kalamkari Peacock" /></div>
      <div className="field"><label>Product slug it links to</label><input value={form.slug} onChange={set('slug')} placeholder="mauve-kalamkari-peacock" /></div>
      <p className="admin-form__legend">Images <span>— up to 3, shown side by side. Upload from your gallery.</span></p>
      <MediaUploader images={form.images} video="" onChange={({ images }) => setForm((f) => ({ ...f, images: images.slice(0, 3) }))} target={2} />
      <p className="admin-form__legend" style={{ marginTop: 16 }}>Text overlay <span>— shown on this slide. Leave blank for image-only.</span></p>
      <div className="field"><label>Subheading (small eyebrow text)</label><input value={form.subheading} onChange={set('subheading')} placeholder="New Season" /></div>
      <div className="field"><label>Heading (main large text)</label><input value={form.heading} onChange={set('heading')} placeholder="Woven by hand, worn with meaning" /></div>
      <div className="field"><label>Description</label><textarea rows="2" value={form.description} onChange={set('description')} placeholder="Hand-painted sarees and one-of-a-kind blouses…" /></div>
      <div className="field__row">
        <div className="field"><label>Button text</label><input value={form.ctaText} onChange={set('ctaText')} placeholder="Shop the collection" /></div>
        <div className="field"><label>Button link</label><input value={form.ctaLink} onChange={set('ctaLink')} placeholder="/shop" /></div>
      </div>
      <div className="field__row">
        <div className="field"><label>Order</label><input type="number" value={form.order} onChange={set('order')} /></div>
        <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label className="filter-opt"><input type="checkbox" checked={form.active} onChange={set('active')} /> Show on homepage</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save slide'}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------------- Exhibition slides tab ---------------- */
export function ExhibitionTab() {
  const toast = useToast();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    api.getAllExhibitionSlides().then(setSlides).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (s) => {
    if (!window.confirm('Delete this exhibition slide?')) return;
    try { await api.deleteExhibitionSlide(s._id); toast('Slide deleted'); load(); }
    catch (err) { toast(err.message); }
  };

  if (editing) {
    return <ExhibitionForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />;
  }
  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="shop__count">{slides.length} exhibition slides</span>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing('new')}>+ New slide</button>
      </div>
      {slides.length === 0 ? (
        <div className="empty"><h3>No exhibition slides yet</h3></div>
      ) : (
        <table className="table">
          <thead><tr><th></th><th>Title</th><th>Subtitle</th><th>Order</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {slides.map((s) => (
              <tr key={s._id}>
                <td><img src={s.image} alt="" /></td>
                <td>{s.title || '—'}</td>
                <td>{s.subtitle || '—'}</td>
                <td>{s.order}</td>
                <td>{s.active ? 'Yes' : 'No'}</td>
                <td className="table__actions">
                  <button onClick={() => setEditing(s)}>Edit</button>
                  <button onClick={() => del(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function ExhibitionForm({ initial, onCancel, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState(() => initial || { title: '', subtitle: '', image: '', link: '', order: 0, active: true });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.image) { toast('Add an image'); return; }
    setBusy(true);
    try {
      const payload = { title: form.title, subtitle: form.subtitle, image: form.image, link: form.link, order: Number(form.order) || 0, active: !!form.active };
      if (initial) await api.updateExhibitionSlide(initial._id, payload);
      else await api.createExhibitionSlide(payload);
      toast('Exhibition slide saved');
      onDone();
    } catch (err) { toast(err.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="checkout__panel admin-form" style={{ maxWidth: 640 }}>
      <h3>{initial ? 'Edit exhibition slide' : 'New exhibition slide'}</h3>
      <div className="field"><label>Title</label><input value={form.title} onChange={set('title')} placeholder="Kalamkari Peacock" /></div>
      <div className="field"><label>Subtitle</label><input value={form.subtitle} onChange={set('subtitle')} placeholder="Hand-painted saree" /></div>
      <p className="admin-form__legend">Image <span>— upload from your gallery.</span></p>
      <MediaUploader images={form.image ? [form.image] : []} video="" onChange={({ images }) => setForm((f) => ({ ...f, image: images[0] || '' }))} target={2} />
      <div className="field"><label>Links to (URL)</label><input value={form.link} onChange={set('link')} placeholder="/shop?category=saree" /></div>
      <div className="field__row">
        <div className="field"><label>Order</label><input type="number" value={form.order} onChange={set('order')} /></div>
        <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label className="filter-opt"><input type="checkbox" checked={form.active} onChange={set('active')} /> Show on homepage</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save slide'}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------------- Sutaara Edits tab (curated edits menu + page) ---------------- */
export function EditsTab() {
  const toast = useToast();
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    api.getAllCuratedEdits().then(setEdits).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (e) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    try { await api.deleteCuratedEdit(e._id); toast('Edit removed'); load(); }
    catch (err) { toast(err.message); }
  };

  if (editing) {
    return <EditForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />;
  }
  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <>
      <p className="admin-form__legend" style={{ marginTop: 0 }}>
        These show under <strong>Sutaara Edits</strong> in the header menu and on the /story page.
        <span> Drag order isn't supported yet — set the "Order" number instead (lower shows first).</span>
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="shop__count">{edits.length} curated edits</span>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing('new')}>+ New edit</button>
      </div>
      {edits.length === 0 ? (
        <div className="empty"><h3>No curated edits yet</h3></div>
      ) : (
        <table className="table">
          <thead><tr><th></th><th>Title</th><th>Description</th><th>Products</th><th>Links to</th><th>Order</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {edits.map((e) => (
              <tr key={e._id}>
                <td>{e.image ? <img src={e.image} alt="" /> : '—'}</td>
                <td>{e.title || '—'}</td>
                <td style={{ maxWidth: 260 }}>{e.description || '—'}</td>
                <td>{e.products?.length ? `${e.products.length} product${e.products.length === 1 ? '' : 's'}` : '—'}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{e.link || '—'}</td>
                <td>{e.order}</td>
                <td>{e.active ? 'Yes' : 'No'}</td>
                <td className="table__actions">
                  <button onClick={() => setEditing(e)}>Edit</button>
                  <button onClick={() => del(e)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// Search-and-add picker for attaching multiple products to a curated edit
// (Founder's picks, Statement Pieces, etc). Shows matching products as the
// admin types, and the currently-selected products as removable chips.
function ProductPicker({ selected, onChange }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setBusy(true);
    const t = setTimeout(() => {
      api.getProducts({ search: term, limit: 8 })
        .then((r) => setResults(r.products || []))
        .catch(() => setResults([]))
        .finally(() => setBusy(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const isSelected = (p) => selected.some((s) => (s._id || s.id) === (p._id || p.id));
  const add = (p) => { if (!isSelected(p)) onChange([...selected, p]); };
  const remove = (id) => onChange(selected.filter((s) => (s._id || s.id) !== id));

  return (
    <div className="field">
      <label>Products <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>— add as many as this edit should feature</span></label>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products by name…" />
      {busy && <p className="admin-form__legend" style={{ margin: '6px 0 0' }}>Searching…</p>}
      {results.length > 0 && (
        <div className="picker__results">
          {results.map((p) => (
            <button
              type="button"
              key={p._id || p.id}
              className="picker__result"
              disabled={isSelected(p)}
              onClick={() => add(p)}
            >
              {p.images?.[0] && <img src={p.images[0]} alt="" />}
              <span className="picker__result-name">{p.name}</span>
              <span className="picker__add">{isSelected(p) ? 'Added' : '+ Add'}</span>
            </button>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="picker__selected">
          {selected.map((p) => (
            <div key={p._id || p.id} className="picker__chip">
              {p.images?.[0] && <img src={p.images[0]} alt="" />}
              <span>{p.name}</span>
              <button type="button" aria-label={`Remove ${p.name}`} onClick={() => remove(p._id || p.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditForm({ initial, onCancel, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState(() => initial || { title: '', description: '', image: '', link: '', order: 0, active: true });
  const [products, setProducts] = useState(() => initial?.products || []);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast('Add a title'); return; }
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        image: form.image,
        link: form.link.trim(),
        productIds: products.map((p) => p._id || p.id),
        order: Number(form.order) || 0,
        active: !!form.active,
      };
      if (initial) await api.updateCuratedEdit(initial._id, payload);
      else await api.createCuratedEdit(payload);
      toast('Curated edit saved');
      onDone();
    } catch (err) { toast(err.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="checkout__panel admin-form" style={{ maxWidth: 640 }}>
      <h3>{initial ? 'Edit curated edit' : 'New curated edit'}</h3>
      <div className="field"><label>Title</label><input value={form.title} onChange={set('title')} placeholder="Founder's picks" /></div>
      <div className="field">
        <label>Description</label>
        <textarea className="textarea" rows={2} value={form.description} onChange={set('description')} placeholder="The pieces we'd reach for first." />
      </div>
      <p className="admin-form__legend">Image <span>— optional, shown as a thumbnail in the menu/page.</span></p>
      <MediaUploader images={form.image ? [form.image] : []} video="" onChange={({ images }) => setForm((f) => ({ ...f, image: images[0] || '' }))} target={2} />
      <ProductPicker selected={products} onChange={setProducts} />
      <div className="field"><label>Links to (URL)</label><input value={form.link} onChange={set('link')} placeholder="/shop?edit=founders-picks" /></div>
      <div className="field__row">
        <div className="field"><label>Order</label><input type="number" value={form.order} onChange={set('order')} /></div>
        <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label className="filter-opt"><input type="checkbox" checked={form.active} onChange={set('active')} /> Show on site</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save edit'}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------------- Diaries / Reviews tab ---------------- */
export function DiariesTab() {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getAllReviews().then(setReviews).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (r) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try { await api.deleteReview(r._id); setReviews((cur) => cur.filter((x) => x._id !== r._id)); toast('Review deleted'); }
    catch (err) { toast(err.message); }
  };
  const toggle = async (r) => {
    try {
      await api.setReviewApproval(r._id, !r.approved);
      setReviews((cur) => cur.map((x) => (x._id === r._id ? { ...x, approved: !x.approved } : x)));
      toast(r.approved ? 'Hidden' : 'Shown');
    } catch (err) { toast(err.message); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (reviews.length === 0) return <div className="empty"><h3>No reviews yet</h3><p>Customers who buy a product can review it. 5-star reviews appear in Sutaara Diaries.</p></div>;

  return (
    <table className="table">
      <thead><tr><th>Rating</th><th>Review</th><th>Customer</th><th>Product</th><th>In Diaries</th><th></th></tr></thead>
      <tbody>
        {reviews.map((r) => (
          <tr key={r._id}>
            <td style={{ color: 'var(--gold)', whiteSpace: 'nowrap' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
            <td style={{ maxWidth: 320 }}>
              {r.title && <strong>{r.title}</strong>}<br />
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{r.body}</span>
            </td>
            <td>{r.user?.name || '—'}</td>
            <td>{r.product?.name || '—'}</td>
            <td>{r.rating === 5 && r.approved ? 'Yes' : '—'}</td>
            <td className="table__actions">
              <button onClick={() => toggle(r)}>{r.approved ? 'Hide' : 'Show'}</button>
              <button onClick={() => del(r)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------------- Team tab (super admin: manage staff/admin accounts) ---------------- */
export function TeamTab() {
  const toast = useToast();
  const { user, updateProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [busy, setBusy] = useState(false);

  // Super admin's own account (change login email / password)
  const [selfOpen, setSelfOpen] = useState(false);
  const [self, setSelf] = useState({ email: user?.email || '', password: '' });
  const [selfBusy, setSelfBusy] = useState(false);

  const saveSelf = async (e) => {
    e.preventDefault();
    setSelfBusy(true);
    try {
      const payload = {};
      if (self.email && self.email !== user?.email) payload.email = self.email;
      if (self.password) payload.password = self.password;
      if (Object.keys(payload).length === 0) { toast('Nothing to change'); setSelfBusy(false); return; }
      await updateProfile(payload);
      toast('Your account was updated');
      setSelf((s) => ({ ...s, password: '' }));
      setSelfOpen(false);
    } catch (err) { toast(err.message); } finally { setSelfBusy(false); }
  };

  const load = () => {
    setLoading(true);
    api.getStaff().then(setUsers).catch((e) => toast(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createStaffAccount(form);
      toast('Account created');
      setForm({ name: '', email: '', password: '', role: 'staff' });
      setShowForm(false);
      load();
    } catch (err) { toast(err.message); } finally { setBusy(false); }
  };

  const resetPw = async (u) => {
    const pw = window.prompt(`Set a new password for ${u.name} (min 8 chars):`);
    if (!pw) return;
    try { await api.resetStaffPassword(u._id, pw); toast('Password reset'); }
    catch (err) { toast(err.message); }
  };

  const changeRole = async (u, role) => {
    try { await api.changeStaffRole(u._id, role); toast('Role updated'); load(); }
    catch (err) { toast(err.message); }
  };

  const remove = async (u) => {
    if (!window.confirm(`Remove ${u.name}'s admin access? They become a normal customer.`)) return;
    try { await api.removeStaffAccount(u._id); toast('Access removed'); load(); }
    catch (err) { toast(err.message); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <>
      {/* My Account — super admin's own login credentials */}
      <div className="checkout__panel admin-form" style={{ maxWidth: 520, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>My account</h3>
            <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{user?.email} · Super Admin</span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setSelfOpen((s) => !s)}>
            {selfOpen ? 'Cancel' : 'Change email / password'}
          </button>
        </div>
        {selfOpen && (
          <form onSubmit={saveSelf} style={{ marginTop: 16 }}>
            <div className="field"><label>Login email</label><input type="email" value={self.email} onChange={(e) => setSelf((s) => ({ ...s, email: e.target.value }))} /></div>
            <div className="field"><label>New password (leave blank to keep current)</label><input value={self.password} onChange={(e) => setSelf((s) => ({ ...s, password: e.target.value }))} placeholder="••••••••" /></div>
            <button className="btn btn--primary" disabled={selfBusy}>{selfBusy ? 'Saving…' : 'Save my account'}</button>
          </form>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="shop__count">{users.length} team members</span>
        <button className="btn btn--primary btn--sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New team member'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="checkout__panel admin-form" style={{ maxWidth: 520, marginBottom: 24 }}>
          <h3>Create staff or admin account</h3>
          <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></div>
          <div className="field"><label>Temporary password (min 8)</label><input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} /></div>
          <div className="field">
            <label>Role</label>
            <select className="select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="staff">Staff — orders only</option>
              <option value="admin">Admin — products, orders &amp; site content</option>
            </select>
          </div>
          <button className="btn btn--primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
      )}

      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                {u.role === 'superadmin' ? (
                  <span className="rv-verified">Super Admin</span>
                ) : (
                  <select className="select select--sm" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </td>
              <td className="table__actions">
                {u.role !== 'superadmin' && (
                  <>
                    <button onClick={() => resetPw(u)}>Reset password</button>
                    <button onClick={() => remove(u)}>Remove</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ---------------- Accounts tab (admin + super admin, read-only) ----------------
   Every registered account — customers included, not just staff/admin like
   the Team tab above. This is "who has signed up / logged in", for support
   lookups; it doesn't manage roles or passwords. */
export function AccountsTab() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.getAllAccounts().then(setUsers).catch((e) => toast(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = users.filter((u) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [u.name, u.email, u.phone].some((v) => (v || '').toLowerCase().includes(s));
  });

  const PROVIDER_LABEL = {
    password: 'Email & password',
    google: 'Google',
    yahoo: 'Yahoo',
    outlook: 'Outlook',
    phone: 'Mobile OTP',
    demo: 'Demo',
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <span className="shop__count">{filtered.length} of {users.length} accounts</span>
        <input
          className="select"
          style={{ maxWidth: 260 }}
          placeholder="Search name, email or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Signed up with</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone || '—'}</td>
              <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
              <td>{PROVIDER_LABEL[u.authProvider] || u.authProvider}</td>
              <td>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>No accounts match "{q}"</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}

/* ---------------- Category tiles ("Shop by category" on homepage) ----------------
   Fixed set of 5 — edit label/note/image in place, no add/remove (the keys
   are tied to how products are categorized elsewhere in the app). */
export function CategoryTilesTab() {
  const toast = useToast();
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllCategoryTiles().then(setTiles).catch((e) => toast(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <>
      <p className="admin-form__legend" style={{ marginBottom: 18 }}>
        These 5 tiles are the "Shop by category" section on the homepage.
      </p>
      <div className="category-tiles-grid">
        {tiles.map((t) => (
          <CategoryTileEditor
            key={t._id}
            tile={t}
            onSaved={(updated) => setTiles((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))}
          />
        ))}
      </div>
    </>
  );
}

function CategoryTileEditor({ tile, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ label: tile.label, note: tile.note, image: tile.image, active: tile.active });
  const [busy, setBusy] = useState(false);
  const dirty = form.label !== tile.label || form.note !== tile.note || form.image !== tile.image || form.active !== tile.active;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      const updated = await api.updateCategoryTile(tile._id, form);
      onSaved(updated);
      toast(`${form.label} tile saved`);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="category-tile-editor">
      <MediaUploader images={form.image ? [form.image] : []} video="" onChange={({ images }) => setForm((f) => ({ ...f, image: images[0] || '' }))} target={1.2} />
      <div className="field"><label>Label</label><input value={form.label} onChange={set('label')} /></div>
      <div className="field"><label>Eyebrow text</label><input value={form.note} onChange={set('note')} placeholder="Drape" /></div>
      <label className="filter-opt"><input type="checkbox" checked={form.active} onChange={set('active')} /> Show on homepage</label>
      <button className="btn btn--primary btn--sm" disabled={!dirty || busy} onClick={save}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

/* ---------------- Analytics tab (admin + super admin) ---------------- */
export function AnalyticsTab() {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = (silent) => {
    if (!silent) setLoading(true);
    api.getAnalytics(days).then(setData).catch((e) => toast(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load(false);
    // Light auto-refresh while this tab is open, so numbers stay current
    // without needing a manual reload — not full push/websocket real-time,
    // but close enough for a dashboard someone glances at.
    const t = setInterval(() => load(true), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  if (loading || !data) return <div className="loader"><div className="spinner" /></div>;

  const maxDayRevenue = Math.max(1, ...data.revenueByDay.map((d) => d.total));
  const maxQtySold = Math.max(1, ...data.topProducts.map((p) => p.qtySold));
  const STATUS_LABEL = {
    pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', packed: 'Packed',
    shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <span className="shop__count">Last {data.days} days</span>
        <div className="filter-opt-row">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              className={`btn btn--sm ${days === n ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setDays(n)}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="analytics-kpis">
        <div className="analytics-kpi">
          <span className="analytics-kpi__label">Revenue</span>
          <span className="analytics-kpi__value">{inr(data.revenue)}</span>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi__label">Orders</span>
          <span className="analytics-kpi__value">{data.totalOrders}</span>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi__label">Avg. order value</span>
          <span className="analytics-kpi__value">{inr(data.avgOrderValue)}</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="analytics-status-row">
        {Object.entries(data.statusCounts).map(([status, count]) => (
          <span key={status} className={`analytics-status-pill analytics-status-pill--${status}`}>
            {count} {STATUS_LABEL[status] || status}
          </span>
        ))}
        {Object.keys(data.statusCounts).length === 0 && <span className="admin-empty-note">No orders in this window yet.</span>}
      </div>

      <div className="analytics-grid">
        {/* Revenue by day */}
        <div className="analytics-panel">
          <h3>Revenue by day</h3>
          {data.revenueByDay.length === 0 ? (
            <p className="admin-empty-note">No revenue in this window yet.</p>
          ) : (
            <div className="analytics-bars">
              {data.revenueByDay.map((d) => (
                <div className="analytics-bar" key={d.date} title={`${d.date}: ${inr(d.total)}`}>
                  <div className="analytics-bar__fill" style={{ height: `${Math.max(4, (d.total / maxDayRevenue) * 100)}%` }} />
                  <span className="analytics-bar__label">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top-selling products */}
        <div className="analytics-panel">
          <h3>Top-selling products</h3>
          {data.topProducts.length === 0 ? (
            <p className="admin-empty-note">No sales in this window yet.</p>
          ) : (
            <div className="analytics-top-list">
              {data.topProducts.map((p) => (
                <div className="analytics-top-item" key={p.productId}>
                  {p.image ? <img src={p.image} alt="" /> : <div className="analytics-top-item__noimg" />}
                  <div className="analytics-top-item__body">
                    <div className="analytics-top-item__row">
                      <span className="analytics-top-item__name">{p.name}</span>
                      <span className="analytics-top-item__qty">{p.qtySold} sold</span>
                    </div>
                    <div className="analytics-top-item__bar">
                      <div style={{ width: `${Math.max(4, (p.qtySold / maxQtySold) * 100)}%` }} />
                    </div>
                    {p.currentStock !== null && (
                      <span className={`analytics-top-item__stock ${p.currentStock === 0 ? 'is-out' : p.currentStock <= 5 ? 'is-low' : ''}`}>
                        {p.currentStock === 0 ? 'Out of stock' : `${p.currentStock} in stock`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- Announcement bar tab (admin + super admin) ---------------- */
export function AnnouncementTab() {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getAllAnnouncements()
      .then((list) => {
        const a = list && list[0];
        if (a) { setMessage(a.message || ''); setActive(a.active); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.saveAnnouncement({ message, active });
      toast('Announcement saved');
    } catch (err) { toast(err.message); } finally { setBusy(false); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <form onSubmit={save} className="checkout__panel admin-form" style={{ maxWidth: 640 }}>
      <h3>Announcement bar</h3>
      <p className="admin-form__legend">
        The strip at the very top of every page. Leave the message blank and untick to hide it.
      </p>
      <div className="field">
        <label>Message</label>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Free shipping across India · Ships in 5–7 days"
        />
      </div>
      <div style={{ margin: '4px 0 18px' }}>
        <label className="filter-opt">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Show the announcement bar
        </label>
      </div>
      <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save announcement'}</button>
    </form>
  );
}

/* ---------------- Notifications tab (admin + super admin) ---------------- */
export function NotificationsTab() {
  const toast = useToast();
  const [form, setForm] = useState({ alertEmail1: '', alertEmail2: '', alertEmail3: '', alertWhatsApp: '', emailEnabled: true });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getNotificationSettings()
      .then((s) => setForm({
        alertEmail1: s.alertEmail1 || '',
        alertEmail2: s.alertEmail2 || '',
        alertEmail3: s.alertEmail3 || '',
        alertWhatsApp: s.alertWhatsApp || '',
        emailEnabled: s.emailEnabled,
      }))
      .catch((e) => toast(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.saveNotificationSettings(form);
      toast('Notification settings saved');
    } catch (err) { toast(err.message); } finally { setBusy(false); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <form onSubmit={save} className="checkout__panel admin-form" style={{ maxWidth: 560 }}>
      <h3>Order notifications</h3>
      <p className="admin-form__legend">
        Order alerts are emailed to every address below (up to 3). Customers are emailed automatically at each order stage.
      </p>
      <div className="field">
        <label>Alert email 1</label>
        <input type="email" value={form.alertEmail1} onChange={(e) => setForm((f) => ({ ...f, alertEmail1: e.target.value }))} placeholder="shashwat9252@gmail.com" />
      </div>
      <div className="field">
        <label>Alert email 2 (optional)</label>
        <input type="email" value={form.alertEmail2} onChange={(e) => setForm((f) => ({ ...f, alertEmail2: e.target.value }))} placeholder="—" />
      </div>
      <div className="field">
        <label>Alert email 3 (optional)</label>
        <input type="email" value={form.alertEmail3} onChange={(e) => setForm((f) => ({ ...f, alertEmail3: e.target.value }))} placeholder="—" />
      </div>
      <div className="field">
        <label>Alert WhatsApp number</label>
        <input value={form.alertWhatsApp} onChange={(e) => setForm((f) => ({ ...f, alertWhatsApp: e.target.value }))} placeholder="9569659272" />
        <span className="field__hint">Used for WhatsApp order alerts (activates once the WhatsApp provider is connected).</span>
      </div>
      <div style={{ margin: '4px 0 18px' }}>
        <label className="filter-opt">
          <input type="checkbox" checked={form.emailEnabled} onChange={(e) => setForm((f) => ({ ...f, emailEnabled: e.target.checked }))} /> Send email alerts for new orders
        </label>
      </div>
      <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
    </form>
  );
}
