import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import MediaUploader from './MediaUploader.jsx';

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
  const [form, setForm] = useState(() => initial || { title: '', slug: '', images: [], order: 0, active: true });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.images || form.images.length === 0) { toast('Add at least one image'); return; }
    setBusy(true);
    try {
      const payload = { title: form.title, slug: form.slug, images: form.images, order: Number(form.order) || 0, active: !!form.active };
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
      <MediaUploader images={form.images} video="" onChange={({ images }) => setForm((f) => ({ ...f, images: images.slice(0, 3) }))} />
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
      <MediaUploader images={form.image ? [form.image] : []} video="" onChange={({ images }) => setForm((f) => ({ ...f, image: images[0] || '' }))} />
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
