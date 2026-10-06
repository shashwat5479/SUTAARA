import { useEffect, useState, Fragment } from 'react';
import { api } from '../api/client.js';
import ExportBar from '../components/ExportBar.jsx';
import AdminOrderModal from '../components/AdminOrderModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { inr } from '../utils/format.js';
import { COLORS, OTHER, OTHER_HEX, colorsOf, fabricsOf, occasionsOf } from '../utils/taxonomy.js';
import MediaUploader from '../components/MediaUploader.jsx';
import { HeroSlidesTab, ExhibitionTab, EditsTab, DiariesTab, TeamTab, AccountsTab, CategoryTilesTab, AnalyticsTab, SubscribersTab, AnnouncementTab, NotificationsTab } from '../components/AdminPanels.jsx';

const EMPTY = {
  name: '',
  category: 'saree',
  fabric: '',
  occasion: '',
  color: '',
  sku: '',
  sareeLength: '',
  blousePiece: '',
  dimensions: '',
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
  codAvailable: false,
};

const CATEGORIES = [
  { value: 'saree', label: 'Saree' },
  { value: 'suit', label: 'Suit Set' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'dupatta', label: 'Dupatta' },
  { value: 'potli', label: 'Potli / Bag' },
];

// What each product type needs. Drives the "+ New …" buttons, the form
// heading, which spec fields are shown, and the placeholders — so adding a
// saree, a suit, a blouse or a bag each has its own focused form.
const CAT_CONFIG = {
  saree: {
    singular: 'Saree', plural: 'Sarees',
    namePh: 'Peacock Teal Banarasi Silk Saree',
    skuPh: 'ABSA154',
    sareeLength: true, blousePiece: true, dimensions: false,
    noteLabel: 'Blouse piece note (shown as "Blouse piece")',
    notePh: 'Comes with an unstitched blouse piece (0.8m).',
  },
  suit: {
    singular: 'Suit Set', plural: 'Suit Sets',
    namePh: 'Burnt Coral Woven Chanderi Suit',
    skuPh: 'ABSU021',
    sareeLength: false, blousePiece: false, dimensions: false,
    noteLabel: 'Set contents (shown as "Set contents")',
    notePh: 'Kurta, bottom and dupatta — unstitched, 2.5 m + 2.5 m + 2.25 m.',
  },
  blouse: {
    singular: 'Blouse', plural: 'Blouses',
    namePh: 'Mustard Raw Silk Blouse',
    skuPh: 'ABBL012',
    sareeLength: false, blousePiece: false, dimensions: true,
    dimensionsLabel: 'Blouse Dimensions',
    dimensionsPh: 'Bust 36 in; Length 15 in; Sleeve 8 in',
    noteLabel: 'Note (shown as "Details")',
    notePh: 'Padded, with back hook closure.',
  },
  dupatta: {
    singular: 'Dupatta', plural: 'Dupattas',
    namePh: 'Ivory Block Print Cotton Dupatta',
    skuPh: 'ABDU008',
    sareeLength: false, blousePiece: false, dimensions: false,
    noteLabel: 'Note (shown as "Details")',
    notePh: 'Length 2.25 m.',
  },
  potli: {
    singular: 'Bag', plural: 'Bags',
    namePh: 'Maroon Zari Potli Bag',
    skuPh: 'ABPO005',
    sareeLength: false, blousePiece: false, dimensions: true,
    dimensionsLabel: 'Bag Dimensions',
    dimensionsPh: '8 in (L) x 6 in (H) x 2 in (W)',
    noteLabel: 'Note (shown as "Details")',
    notePh: 'Drawstring closure with a detachable wrist loop.',
  },
};

// Fabric suggestions per category — a datalist, not a hard restriction, so
// you can still type a fabric that isn't in the list.
const FABRICS = [
  'Banarasi Silk', 'Silk', 'Cotton', 'Mul Cotton', 'Chanderi', 'Linen',
  'Tissue', 'Organza', 'Maheshwari', 'Kota', 'Modal', 'Georgette',
  'Chiffon', 'Net', 'Velvet', 'Brocade', 'Ajrakh Cotton', 'Cotton Silk',
];
const OCCASIONS = ['Wedding', 'Festive', 'Party', 'Everyday', 'Daywear'];

// Shows, as you type, which shop filters this product will appear under.
// Fabric / occasion / colour are filed automatically from the text, so the
// swatch is always the real colour — and if a word isn't recognised it says
// so here instead of silently showing a default colour in the shop.
function FilterPreview({ kind, text }) {
  if (!String(text || '').trim()) return null;
  const found = kind === 'color' ? colorsOf(text) : kind === 'fabric' ? fabricsOf(text) : occasionsOf(text);
  const unknown = found.length === 1 && found[0] === OTHER;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
      <span>Shows under:</span>
      {found.map((f) => {
        const hex = kind === 'color' ? (f === OTHER ? OTHER_HEX : COLORS.find((c) => c.value === f)?.hex) : null;
        return (
          <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {hex && (
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: hex, border: '1px solid var(--line-strong)', display: 'inline-block' }} />
            )}
            <strong style={{ fontWeight: 600, color: unknown ? '#b5762b' : 'var(--ink)' }}>{f}</strong>
          </span>
        );
      })}
      {unknown && <span style={{ color: '#b5762b' }}>— not recognised; try a common name like “Rani Pink” or “Mustard”</span>}
    </div>
  );
}

const STATUSES = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'return_requested', 'return_approved', 'refund_initiated', 'refunded',
];
const APPOINTMENT_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled'];

function ProductForm({ initial, newCategory, onDone, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY, category: newCategory || EMPTY.category };
    return {
      ...EMPTY,
      ...initial,
      images: Array.isArray(initial.images) ? initial.images : [],
      video: initial.video || '',
    };
  });
  const [busy, setBusy] = useState(false);

  // Sutaara Edits this product should appear in (Founder's picks, Statement
  // Pieces…). Loaded once; membership is stored on each edit, so for an
  // existing product we tick the edits that already list it.
  const [allEdits, setAllEdits] = useState([]);
  const [editIds, setEditIds] = useState([]);
  const [editsLoaded, setEditsLoaded] = useState(false);
  useEffect(() => {
    let off = false;
    api.getAllCuratedEdits()
      .then((list) => {
        if (off) return;
        const arr = Array.isArray(list) ? list : [];
        setAllEdits(arr);
        if (initial) {
          setEditIds(arr.filter((e) => (e.productIds || []).includes(initial._id)).map((e) => e._id));
        }
        setEditsLoaded(true);
      })
      .catch(() => {});
    return () => { off = true; };
  }, []);
  const toggleEdit = (id) =>
    setEditIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  // A product created from a specific "+ New …" button has its type fixed.
  const lockCategory = !initial && !!newCategory;
  const cfg = CAT_CONFIG[form.category] || CAT_CONFIG.saree;

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
        dimensions: (form.dimensions || '').trim(),
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
        codAvailable: !!form.codAvailable,
      };
      let productId = initial ? initial._id : null;
      if (initial) {
        await api.updateProduct(initial._id, payload);
      } else {
        const created = await api.createProduct(payload);
        productId = created && (created._id || created.id);
      }
      // Only sync edits if they loaded — otherwise we'd wipe memberships.
      if (editsLoaded && productId) {
        try {
          await api.setProductEdits(productId, editIds);
        } catch (err) {
          toast(`Product saved, but Sutaara Edits weren't updated: ${err.message}`);
          onDone();
          return;
        }
      }
      toast(initial ? 'Product updated' : 'Product created');
      onDone();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="checkout__panel admin-form">
      <h3>{initial ? `Edit ${cfg.singular.toLowerCase()}` : `New ${cfg.singular.toLowerCase()}`}</h3>

      <div className="field">
        <label>Name</label>
        <input value={form.name} onChange={set('name')} required placeholder={cfg.namePh} />
      </div>

      <p className="admin-form__legend">Specifications</p>
      <div className="field__row">
        <div className="field">
          <label>Category</label>
          <select value={form.category} onChange={set('category')} disabled={lockCategory}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Fabric</label>
          <input list="fabric-list" value={form.fabric} onChange={set('fabric')} placeholder="Banarasi Silk" />
          <FilterPreview kind="fabric" text={form.fabric} />
          <datalist id="fabric-list">
            {FABRICS.map((f) => <option key={f} value={f} />)}
          </datalist>
        </div>
      </div>

      <div className="field__row">
        <div className="field">
          <label>Occasion</label>
          <input list="occasion-list" value={form.occasion} onChange={set('occasion')} placeholder="Wedding" />
          <FilterPreview kind="occasion" text={form.occasion} />
          <datalist id="occasion-list">
            {OCCASIONS.map((o) => <option key={o} value={o} />)}
          </datalist>
        </div>
        <div className="field">
          <label>Colour</label>
          <input value={form.color} onChange={set('color')} placeholder="Mustard Yellow" />
          <FilterPreview kind="color" text={form.color} />
        </div>
      </div>

      <div className="field__row">
        <div className="field">
          <label>SKU</label>
          <input value={form.sku} onChange={set('sku')} placeholder={cfg.skuPh} />
        </div>
        {cfg.sareeLength && (
          <div className="field">
            <label>Saree Length</label>
            <input value={form.sareeLength} onChange={set('sareeLength')} placeholder="5.5 m" />
          </div>
        )}
        {cfg.dimensions && (
          <div className="field">
            <label>{cfg.dimensionsLabel} <span className="field__opt">(shown under Product Details)</span></label>
            <input value={form.dimensions || ''} onChange={set('dimensions')} placeholder={cfg.dimensionsPh} />
          </div>
        )}
      </div>

      <div className="field__row">
        {cfg.blousePiece && (
          <div className="field">
            <label>Blouse Piece</label>
            <input value={form.blousePiece} onChange={set('blousePiece')} placeholder="Yes; 1 m" />
          </div>
        )}
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
        <label>{cfg.noteLabel}</label>
        <input value={form.blouseNote} onChange={set('blouseNote')} placeholder={cfg.notePh} />
      </div>

      {allEdits.length > 0 && (
        <>
          <p className="admin-form__legend">
            Show in Sutaara Edits <span>— tick every edit this product belongs to. It will appear on that edit's page.</span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', margin: '0 0 18px' }}>
            {allEdits.map((e) => (
              <label key={e._id} className="filter-opt">
                <input type="checkbox" checked={editIds.includes(e._id)} onChange={() => toggleEdit(e._id)} /> {e.title}
              </label>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 20, margin: '4px 0 18px' }}>
        <label className="filter-opt">
          <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured
        </label>
        <label className="filter-opt">
          <input type="checkbox" checked={form.isNewArrival} onChange={set('isNewArrival')} /> New arrival
        </label>
        <label className="filter-opt" title="Off by default. When off, customers must pay online for this product.">
          <input type="checkbox" checked={!!form.codAvailable} onChange={set('codAvailable')} /> Allow cash on delivery
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

// Inline-editable stock count for the products table — lets an admin update
// how many units are in stock without opening the full edit form, and shows
// at a glance which products are low/out of stock.
function StockCell({ product, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(product.stock);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue(product.stock), [product.stock]);

  const commit = async () => {
    const n = Math.max(0, Number(value) || 0);
    setValue(n);
    if (n === product.stock) return;
    setSaving(true);
    try {
      const updated = await api.updateProduct(product._id, { stock: n });
      onSaved(updated);
    } catch (err) {
      toast(err.message);
      setValue(product.stock); // revert on failure
    } finally {
      setSaving(false);
    }
  };

  const status =
    product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : 'ok';

  return (
    <div className={`stock-cell stock-cell--${status}`}>
      <input
        type="number"
        min="0"
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
      {status === 'out' && <span className="stock-cell__badge">Out of stock</span>}
      {status === 'low' && <span className="stock-cell__badge">Low stock</span>}
    </div>
  );
}

function ProductsTab() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // product | { newCategory } | null
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | category value
  const [search, setSearch] = useState('');

  // Loads EVERY product from the uncached admin endpoint (the public list is
  // capped at 60 per page, which hid products beyond the 60th).
  const load = () => {
    setLoading(true);
    api
      .getAdminProducts()
      .then((res) => setProducts(res.products))
      .catch((err) => toast(err.message || 'Could not load products'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (p) => {
    if (
      !window.confirm(
        `Delete “${p.name}”?\n\nIf it has past orders it can't be erased (order history needs it), so it will be archived — hidden from the shop and bags — instead. You can restore it later.`
      )
    )
      return;
    try {
      const res = await api.deleteProduct(p._id);
      toast(res?.message || 'Product deleted');
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  // Quick switch in the list: turn cash on delivery on/off for one product.
  const toggleCod = async (p) => {
    const next = !p.codAvailable;
    const apply = (value) =>
      setProducts((cur) => cur.map((x) => (x._id === p._id ? { ...x, codAvailable: value } : x)));
    apply(next);
    try {
      await api.updateProduct(p._id, { codAvailable: next });
      toast(next ? 'Cash on delivery turned ON for this product' : 'Cash on delivery turned OFF for this product');
    } catch (err) {
      apply(!next);
      toast(err.message);
    }
  };

  const restore = async (p) => {
    try {
      await api.updateProduct(p._id, { archived: false });
      toast('Product restored to the shop');
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  if (editing) {
    const isNew = !!editing.newCategory;
    return (
      <ProductForm
        initial={isNew ? null : editing}
        newCategory={isNew ? editing.newCategory : undefined}
        onCancel={() => setEditing(null)}
        onDone={() => {
          // Jump to the type just saved so the product is visible straight away.
          if (isNew) setFilter(editing.newCategory);
          setEditing(null);
          load();
        }}
      />
    );
  }

  // Archived products (deleted but kept because they have past orders) are
  // tucked into their own tab so they don't clutter the live catalogue.
  const live = products.filter((p) => !p.archived);
  const archivedCount = products.length - live.length;
  const countOf = (c) => live.filter((p) => p.category === c).length;
  const term = search.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (filter === 'archived'
        ? p.archived
        : !p.archived && (filter === 'all' || (filter === 'cod' ? p.codAvailable : p.category === filter))) &&
      (!term ||
        [p.name, p.sku, p.fabric, p.color].some((v) => String(v || '').toLowerCase().includes(term)))
  );
  const outOfStock = visible.filter((p) => p.stock === 0).length;

  return (
    <>
      <ExportBar path="/products/admin/export" filePrefix="sutaara-products" label="Download products (Excel)" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginRight: 4 }}>Add new:</span>
        {Object.entries(CAT_CONFIG).map(([value, c]) => (
          <button
            key={value}
            className="btn btn--primary btn--sm"
            onClick={() => setEditing({ newCategory: value })}
          >
            + {c.singular}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <button
          className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setFilter('all')}
        >
          All ({live.length})
        </button>
        {Object.entries(CAT_CONFIG).map(([value, c]) => (
          <button
            key={value}
            className={`btn btn--sm ${filter === value ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setFilter(value)}
          >
            {c.plural} ({countOf(value)})
          </button>
        ))}
        <button
          className={`btn btn--sm ${filter === 'cod' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setFilter('cod')}
        >
          COD on ({live.filter((p) => p.codAvailable).length})
        </button>
        {archivedCount > 0 && (
          <button
            className={`btn btn--sm ${filter === 'archived' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setFilter('archived')}
          >
            Archived ({archivedCount})
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <span className="shop__count">
          {visible.length} {visible.length === 1 ? 'product' : 'products'}
          {outOfStock > 0 && (
            <span style={{ color: 'var(--sindoor)', fontWeight: 600, marginLeft: 10 }}>
              · {outOfStock} out of stock
            </span>
          )}
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, SKU, fabric, colour…"
          style={{ minWidth: 240, padding: '8px 12px', border: '1px solid var(--line-strong)', background: 'transparent' }}
        />
      </div>
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : visible.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No products here yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th title="Cash on delivery">COD</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p._id}>
                <td><img src={p.images?.[0]} alt="" /></td>
                <td>
                  {p.name}
                  {p.archived && <span className="badge-archived">Archived</span>}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku || '—'}</td>
                <td>{CAT_CONFIG[p.category]?.singular || p.category}</td>
                <td>{inr(p.price)}</td>
                <td>
                  <StockCell
                    product={p}
                    onSaved={(updated) =>
                      setProducts((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
                    }
                  />
                </td>
                <td>
                  <label className="cod-switch" title="Allow cash on delivery for this product">
                    <input type="checkbox" checked={!!p.codAvailable} onChange={() => toggleCod(p)} />
                    <span>{p.codAvailable ? 'On' : 'Off'}</span>
                  </label>
                </td>
                <td className="table__actions">
                  <button onClick={() => setEditing(p)}>Edit</button>
                  {p.archived ? (
                    <button onClick={() => restore(p)}>Restore</button>
                  ) : (
                    <button className="is-danger" onClick={() => del(p)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function PaymentBadge({ order }) {
  if (order.paymentMethod === 'cod') {
    return <span className="pay-badge pay-badge--na">COD</span>;
  }
  if (order.isPaid || order.paymentStatus === 'paid') {
    return <span className="pay-badge pay-badge--paid">Paid</span>;
  }
  if (order.paymentStatus === 'failed') {
    return <span className="pay-badge pay-badge--failed">Failed</span>;
  }
  return <span className="pay-badge pay-badge--pending">Pending</span>;
}

function ManualShipForm({ onCancel, onSubmit, busy }) {
  const [form, setForm] = useState({ awbNumber: '', courierName: '', trackingUrl: '', estDelivery: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
      <input
        className="input"
        placeholder="AWB number"
        value={form.awbNumber}
        onChange={set('awbNumber')}
        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
      />
      <input
        className="input"
        placeholder="Courier name"
        value={form.courierName}
        onChange={set('courierName')}
        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
      />
      <input
        className="input"
        placeholder="Tracking URL (optional)"
        value={form.trackingUrl}
        onChange={set('trackingUrl')}
        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
      />
      <input
        className="input"
        type="date"
        value={form.estDelivery}
        onChange={set('estDelivery')}
        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          className="btn btn--gold"
          style={{ padding: '4px 10px', fontSize: '0.7rem', flex: 1 }}
          onClick={() => onSubmit(form)}
          disabled={busy || !form.awbNumber || !form.courierName}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          className="btn btn--ghost"
          style={{ padding: '4px 10px', fontSize: '0.7rem' }}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function OrdersTab() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [shiprocketReady, setShiprocketReady] = useState(false);
  const [manualShipFor, setManualShipFor] = useState(null); // order id currently in the manual-ship form
  const [viewing, setViewing] = useState(null); // order whose items/details are open

  const load = () => {
    setLoading(true);
    api.getAllOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    api.getShiprocketStatus().then((r) => setShiprocketReady(r.configured)).catch(() => {});
  }, []);

  const changeStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      setOrders((cur) => cur.map((o) => (o._id === id ? { ...o, status } : o)));
      toast('Order updated');
    } catch (err) {
      toast(err.message);
    }
  };

  const toggleReturn = async (o) => {
    const next = !o.returnEligible;
    try {
      await api.setReturnEligibility(o._id, next);
      setOrders((cur) => cur.map((x) => (x._id === o._id ? { ...x, returnEligible: next } : x)));
      toast(next ? 'Return/refund enabled for this order' : 'Return/refund disabled for this order');
    } catch (err) {
      toast(err.message);
    }
  };

  const shipWithShiprocket = async (o) => {
    setBusyId(o._id + 'ship');
    try {
      const updated = await api.shipWithShiprocket(o._id);
      setOrders((cur) => cur.map((x) => (x._id === o._id ? updated : x)));
      toast(`Shipped — AWB ${updated.awbNumber} (${updated.courierName})`);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const submitManualShip = async (o, form) => {
    setBusyId(o._id + 'ship');
    try {
      const updated = await api.shipManually(o._id, form);
      setOrders((cur) => cur.map((x) => (x._id === o._id ? updated : x)));
      setManualShipFor(null);
      toast('Order marked shipped');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const printLabel = async (o) => {
    setBusyId(o._id + 'label');
    try {
      const { labelUrl } = await api.getShippingLabelUrl(o._id);
      window.open(labelUrl, '_blank');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const download = async (o, which) => {
    setBusyId(o._id + which);
    try {
      const fn = { invoice: api.downloadInvoice, packing: api.downloadPackingSlip, label: api.downloadShippingLabel, all: api.downloadPrintAll }[which];
      await fn(o._id, o.orderNumber);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (orders.length === 0) return <div className="empty"><h3>No orders yet</h3></div>;

  const visibleOrders = orders.filter((o) => {
    if (paymentFilter === 'all') return true;
    if (paymentFilter === 'paid') return o.isPaid || o.paymentStatus === 'paid';
    if (paymentFilter === 'failed') return o.paymentMethod === 'online' && o.paymentStatus === 'failed';
    if (paymentFilter === 'pending') return o.paymentMethod === 'online' && o.paymentStatus === 'pending' && !o.isPaid;
    return true;
  });

  const paidCount = orders.filter((o) => o.isPaid || o.paymentStatus === 'paid').length;
  const failedCount = orders.filter((o) => o.paymentMethod === 'online' && o.paymentStatus === 'failed').length;
  const pendingCount = orders.filter((o) => o.paymentMethod === 'online' && o.paymentStatus === 'pending' && !o.isPaid).length;

  return (
    <div>
      {viewing && <AdminOrderModal order={viewing} onClose={() => setViewing(null)} />}
      <ExportBar
        path="/orders/export"
        filePrefix="sutaara-orders"
        dateLabel="Order date"
        statuses={STATUSES}
        label="Download orders (Excel)"
      />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['all', `All (${orders.length})`],
          ['paid', `Paid (${paidCount})`],
          ['pending', `Pending (${pendingCount})`],
          ['failed', `Failed (${failedCount})`],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`btn ${paymentFilter === key ? 'btn--primary' : 'btn--ghost'}`}
            style={{ padding: '7px 16px', fontSize: '0.8rem' }}
            onClick={() => setPaymentFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items ordered</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Shipping</th>
            <th>Return/Refund</th>
            <th>Documents</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.map((o) => {
            const isExpanded = expanded === o._id;
            return (
              <Fragment key={o._id}>
                <tr>
                  <td style={{ fontFamily: 'monospace' }}>{o.orderNumber || `#${o._id.slice(-8)}`}</td>
                  <td>{o.user?.name || '—'}<br /><span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{o.user?.email}</span></td>
                  <td>
                    <div className="adm-items">
                      <div className="adm-items__thumbs">
                        {o.items.slice(0, 3).map((i) => (
                          <div className="adm-items__thumb" key={i.id || i.slug + i.name} title={`${i.name} × ${i.qty}`}>
                            {i.image && <img src={i.image} alt="" />}
                            {i.qty > 1 && <span>×{i.qty}</span>}
                          </div>
                        ))}
                      </div>
                      <div className="adm-items__text">
                        <span className="adm-items__name">{o.items[0]?.name}</span>
                        {o.items.length > 1 && <span className="adm-items__more">+ {o.items.length - 1} more</span>}
                      </div>
                      <button type="button" className="adm-items__view" onClick={() => setViewing(o)}>
                        View order ({o.items.reduce((n, i) => n + i.qty, 0)})
                      </button>
                    </div>
                  </td>
                  <td>{inr(o.totalPrice)}</td>
                  <td>
                    <PaymentBadge order={o} />
                    {o.paymentMethod === 'online' && (o.paymentAttempts?.length > 0) && (
                      <button
                        className="link-underline"
                        style={{ display: 'block', fontSize: '0.72rem', marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => setExpanded(isExpanded ? null : o._id)}
                      >
                        {isExpanded ? 'Hide' : 'View'} attempts ({o.paymentAttempts.length})
                      </button>
                    )}
                  </td>
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
                    {(o.status === 'return_requested' || o.status === 'return_approved') && (
                      <div style={{ fontSize: '0.7rem', color: '#b5762b', marginTop: 4 }}>Needs action</div>
                    )}
                  </td>
                  <td>
                    {o.awbNumber ? (
                      <div style={{ fontSize: '0.78rem' }}>
                        <div style={{ fontFamily: 'monospace' }}>{o.awbNumber}</div>
                        <div style={{ color: 'var(--ink-soft)' }}>{o.courierName}</div>
                        {o.trackingUrl && (
                          <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="link-underline" style={{ fontSize: '0.72rem' }}>
                            Track
                          </a>
                        )}
                        {o.shiprocketShipmentId && (
                          <button
                            className="link-underline"
                            style={{ display: 'block', fontSize: '0.72rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
                            onClick={() => printLabel(o)}
                            disabled={busyId === o._id + 'label'}
                          >
                            {busyId === o._id + 'label' ? 'Opening…' : 'Print label'}
                          </button>
                        )}
                      </div>
                    ) : manualShipFor === o._id ? (
                      <ManualShipForm
                        onCancel={() => setManualShipFor(null)}
                        onSubmit={(form) => submitManualShip(o, form)}
                        busy={busyId === o._id + 'ship'}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {shiprocketReady && (
                          <button
                            className="btn btn--gold"
                            style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                            onClick={() => shipWithShiprocket(o)}
                            disabled={busyId === o._id + 'ship'}
                          >
                            {busyId === o._id + 'ship' ? 'Shipping…' : 'Ship with Shiprocket'}
                          </button>
                        )}
                        <button
                          className="btn btn--ghost"
                          style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                          onClick={() => setManualShipFor(o._id)}
                        >
                          Ship manually
                        </button>
                        {!shiprocketReady && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--ink-soft)' }}>
                            Shiprocket not configured
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(o.returnEligible)}
                        onChange={() => toggleReturn(o)}
                      />
                      {o.returnEligible ? 'Enabled' : 'Off'}
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn--ghost"
                        style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                        onClick={() => download(o, 'invoice')}
                        disabled={!o.invoiceNumber || busyId === o._id + 'invoice'}
                        title={o.invoiceNumber ? 'Download invoice PDF' : 'Invoice not generated yet — confirm or pay the order first'}
                      >
                        Invoice
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                        onClick={() => download(o, 'packing')}
                        disabled={busyId === o._id + 'packing'}
                      >
                        Packing slip
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                        onClick={() => download(o, 'label')}
                        disabled={busyId === o._id + 'label'}
                      >
                        Label
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                        onClick={() => download(o, 'all')}
                        disabled={busyId === o._id + 'all'}
                      >
                        Print all
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={o._id + '-attempts'}>
                    <td colSpan={9} style={{ background: 'var(--paper-2)', padding: '12px 16px' }}>
                      <table className="table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>When</th>
                            <th>Razorpay order</th>
                            <th>Payment ID</th>
                            <th>Method</th>
                            <th>Result</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.paymentAttempts.map((a) => (
                            <tr key={a.id}>
                              <td style={{ fontSize: '0.78rem' }}>
                                {new Date(a.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{a.razorpayOrderId}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{a.razorpayPaymentId || '—'}</td>
                              <td style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>{a.method || '—'}</td>
                              <td>
                                <span className={`pay-badge pay-badge--${a.status === 'captured' ? 'paid' : a.status === 'failed' ? 'failed' : 'pending'}`}>
                                  {a.status}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{a.errorDescription || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
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

  const exportBar = (
    <ExportBar
      path="/appointments/export"
      filePrefix="sutaara-appointments"
      dateLabel="Appointment date"
      statuses={APPOINTMENT_STATUSES}
      label="Download appointments (Excel)"
    />
  );

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (appointments.length === 0) return <div className="empty"><h3>No studio appointments yet</h3></div>;

  return (
    <>
    {exportBar}
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
    </>
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

const RETURN_STATUS_LABELS = {
  submitted: { label: 'Submitted', color: '#b5762b' },
  under_review: { label: 'Under Review', color: '#2563eb' },
  approved: { label: 'Approved', color: '#2f7a45' },
  rejected: { label: 'Rejected', color: '#b22e2e' },
  refund_initiated: { label: 'Refund Sent', color: '#7c3aed' },
  refund_settled: { label: 'Refunded ✓', color: '#15803d' },
};

const RETURN_CATEGORY_LABELS = {
  wrong_item: 'Wrong item',
  damaged: 'Damaged',
  quality_issue: 'Quality issue',
  size_issue: 'Size / fit',
  not_as_described: 'Not as described',
  other: 'Other',
};

function ReturnsTab() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(null);
  const [rejectForm, setRejectForm] = useState(null); // orderId being rejected
  const [rejectReason, setRejectReason] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [refundOverride, setRefundOverride] = useState(''); // partial refund amount

  const load = () => {
    setLoading(true);
    api.listReturnRequests(filter === 'all' ? undefined : filter)
      .then(setRequests).catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const act = async (fn, successMsg) => {
    try {
      const updated = await fn();
      setRequests((cur) => cur.map((r) => (r.orderId === updated.orderId ? updated : r)));
      toast(successMsg);
      setExpanded(null);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(null);
    }
  };

  const markReview = (orderId) => { setBusy(orderId); act(() => api.markReturnUnderReview(orderId), 'Marked as under review'); };
  const approve = (orderId) => { setBusy(orderId); act(() => api.approveReturn(orderId, { adminNote: approveNote || undefined, refundAmount: refundOverride ? Number(refundOverride) : undefined }), 'Return approved — refund initiated if paid online'); };
  const reject = (orderId) => { setBusy(orderId); act(() => api.rejectReturn(orderId, { rejectedReason: rejectReason, adminNote: rejectReason }), 'Return rejected'); };
  const refund = (orderId) => { setBusy(orderId); act(() => api.initiateRefund(orderId, { refundAmount: refundOverride ? Number(refundOverride) : undefined }), 'Refund initiated'); };
  const settle = (orderId) => { setBusy(orderId); act(() => api.markRefundSettled(orderId, { adminNote: 'Manually settled' }), 'Marked as refund settled'); };

  const filters = ['all', 'submitted', 'under_review', 'approved', 'refund_initiated', 'rejected', 'refund_settled'];

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {filters.map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn--primary' : 'btn--ghost'}`}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : RETURN_STATUS_LABELS[f]?.label || f}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="empty"><h3>No return requests {filter !== 'all' ? `with status "${filter}"` : ''}</h3></div>
      ) : requests.map((rr) => {
        const statusInfo = RETURN_STATUS_LABELS[rr.status] || {};
        const isOpen = expanded === rr.orderId;
        const order = rr.order;
        return (
          <div key={rr.id} className="rr-admin-card">
            {/* Header row */}
            <div className="rr-admin-card__head" onClick={() => setExpanded(isOpen ? null : rr.orderId)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <span
                  className="pay-badge"
                  style={{ background: statusInfo.color + '22', color: statusInfo.color }}
                >
                  {statusInfo.label}
                </span>
                <div>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{order?.orderNumber || rr.orderId.slice(-8)}</strong>
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', marginLeft: 10 }}>
                    {order?.user?.name} · {order?.user?.email}
                  </span>
                </div>
                <span
                  className="pay-badge pay-badge--na"
                  style={{ marginLeft: 'auto', fontSize: '0.7rem' }}
                >
                  {RETURN_CATEGORY_LABELS[rr.category] || rr.category}
                </span>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>
                  {new Date(rr.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <span style={{ color: 'var(--gold)', fontSize: '0.9rem', marginLeft: 12 }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div className="rr-admin-card__body">
                <div style={{ marginBottom: 16 }}>
                  <strong>Customer's reason:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)' }}>{rr.reason}</p>
                  {rr.description && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{rr.description}</p>}
                </div>

                {/* Photos */}
                {rr.photos?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>Photos ({rr.photos.length})</strong>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {rr.photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt={`Return photo ${i + 1}`}
                            style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order items */}
                {order?.items && (
                  <div style={{ marginBottom: 16, background: 'var(--ivory-2)', padding: '12px', borderRadius: 6 }}>
                    <strong style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem' }}>Order items</strong>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
                        <span>{item.name} × {item.qty}</span>
                        <span>₹{(item.price / 100).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Refund info if applicable */}
                {rr.refundId && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(124,58,237,0.06)', borderRadius: 6, border: '1px solid rgba(124,58,237,0.2)' }}>
                    <strong style={{ fontSize: '0.82rem' }}>Refund details</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 4 }}>
                      ID: {rr.refundId} · Status: {rr.refundStatus}
                      {rr.refundAmount && ` · Amount: ₹${(rr.refundAmount / 100).toLocaleString('en-IN')}`}
                    </div>
                  </div>
                )}

                {/* Admin note if set */}
                {rr.adminNote && (
                  <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                    <strong>Admin note:</strong> {rr.adminNote}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  {rr.status === 'submitted' && (
                    <button className="btn btn--ghost" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={() => markReview(rr.orderId)} disabled={busy === rr.orderId}>Mark under review</button>
                  )}
                  {['submitted', 'under_review'].includes(rr.status) && (
                    <>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                        <input
                          className="input"
                          placeholder="Refund amount override (₹, blank = full)"
                          value={refundOverride}
                          onChange={(e) => setRefundOverride(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.78rem', maxWidth: 240 }}
                        />
                        <input
                          className="input"
                          placeholder="Admin note to customer (optional)"
                          value={approveNote}
                          onChange={(e) => setApproveNote(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.78rem', maxWidth: 280 }}
                        />
                      </div>
                      <button className="btn btn--gold" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={() => approve(rr.orderId)} disabled={busy === rr.orderId}>
                        {busy === rr.orderId ? 'Processing…' : 'Approve & refund'}
                      </button>
                      {rejectForm === rr.orderId ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 6 }}>
                          <input
                            className="input"
                            placeholder="Reason for rejection (shown to customer)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '0.78rem', flex: 1 }}
                          />
                          <button className="btn btn--ghost" style={{ fontSize: '0.78rem', padding: '6px 12px', color: '#b22e2e', borderColor: '#b22e2e' }} onClick={() => reject(rr.orderId)} disabled={!rejectReason || busy === rr.orderId}>Confirm reject</button>
                          <button className="btn btn--ghost" style={{ fontSize: '0.78rem', padding: '6px 10px' }} onClick={() => setRejectForm(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn--ghost" style={{ fontSize: '0.8rem', padding: '7px 14px', color: '#b22e2e', borderColor: '#b22e2e' }} onClick={() => setRejectForm(rr.orderId)}>Reject</button>
                      )}
                    </>
                  )}
                  {rr.status === 'approved' && order?.razorpayPaymentId && (
                    <button className="btn btn--primary" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={() => refund(rr.orderId)} disabled={busy === rr.orderId}>
                      {busy === rr.orderId ? 'Processing…' : 'Initiate Razorpay refund'}
                    </button>
                  )}
                  {['approved', 'refund_initiated'].includes(rr.status) && (
                    <button className="btn btn--ghost" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={() => settle(rr.orderId)} disabled={busy === rr.orderId}>
                      Mark manually settled (COD / UPI transfer)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Admin() {
  const { isContentAdmin, isSuperAdmin, role } = useAuth();
  // Staff see only Orders (+ read-only products). Admins & super-admins get the
  // content/UI tabs. Super-admins additionally get the Team tab.
  const [tab, setTab] = useState(isContentAdmin ? 'analytics' : 'orders');

  const roleLabel = role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Staff';

  // The site header is sticky and its height changes with screen size. The
  // admin sidebar sticks just below it, so publish the live height as a CSS
  // variable — otherwise the sidebar slid underneath the header and its
  // lower items (Notifications, Team) could not be reached.
  useEffect(() => {
    const header = document.querySelector('.header');
    if (!header) return undefined;
    const apply = () =>
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    apply();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    if (ro) ro.observe(header);
    window.addEventListener('resize', apply);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', apply);
      document.documentElement.style.removeProperty('--header-h');
    };
  }, []);

  return (
    <>
      <div className="page-head">
        <h1>Admin Dashboard</h1>
        <div className="crumbs">Signed in as {roleLabel}</div>
      </div>
      <section className="section--tight">
        <div className="container">
          <div className="admin-layout">
            <nav className="admin-tabs">
              {isContentAdmin && (
                <>
                  <span className="admin-tabs__label">Overview</span>
                  <button className={tab === 'analytics' ? 'active' : ''} onClick={() => setTab('analytics')}>
                    Analytics
                  </button>
                  <span className="admin-tabs__label">Catalog</span>
                  <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
                    Products
                  </button>
                </>
              )}
              <span className="admin-tabs__label">Sales</span>
              <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
                Orders
              </button>
              <button className={tab === 'returns' ? 'active' : ''} onClick={() => setTab('returns')}>
                Returns
              </button>
              <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>
                Studio Appointments
              </button>
              {isContentAdmin && (
                <button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}>
                  Accounts
                </button>
              )}
              {isContentAdmin && (
                <button className={tab === 'subscribers' ? 'active' : ''} onClick={() => setTab('subscribers')}>
                  Subscribers
                </button>
              )}
              {isContentAdmin && (
                <>
                  <span className="admin-tabs__label">Site content</span>
                  <button className={tab === 'event' ? 'active' : ''} onClick={() => setTab('event')}>
                    Studio Event
                  </button>
                  <button className={tab === 'hero' ? 'active' : ''} onClick={() => setTab('hero')}>
                    Hero Panel
                  </button>
                  <button className={tab === 'exhibition' ? 'active' : ''} onClick={() => setTab('exhibition')}>
                    Exhibition
                  </button>
                  <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>
                    Category Images
                  </button>
                  <button className={tab === 'edits' ? 'active' : ''} onClick={() => setTab('edits')}>
                    Sutaara Edits
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
                <>
                  <span className="admin-tabs__label">Team</span>
                  <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
                    Team
                  </button>
                </>
              )}
            </nav>
            <div className="admin-content">
              {tab === 'analytics' && isContentAdmin ? <AnalyticsTab />
                : tab === 'products' && isContentAdmin ? <ProductsTab />
                : tab === 'orders' ? <OrdersTab />
                : tab === 'returns' ? <ReturnsTab />
                : tab === 'appointments' ? <AppointmentsTab />
                : tab === 'accounts' && isContentAdmin ? <AccountsTab />
                : tab === 'subscribers' && isContentAdmin ? <SubscribersTab />
                : tab === 'event' && isContentAdmin ? <StudioEventTab />
                : tab === 'hero' && isContentAdmin ? <HeroSlidesTab />
                : tab === 'exhibition' && isContentAdmin ? <ExhibitionTab />
                : tab === 'categories' && isContentAdmin ? <CategoryTilesTab />
                : tab === 'edits' && isContentAdmin ? <EditsTab />
                : tab === 'diaries' && isContentAdmin ? <DiariesTab />
                : tab === 'announce' && isContentAdmin ? <AnnouncementTab />
                : tab === 'notify' && isContentAdmin ? <NotificationsTab />
                : tab === 'team' && isSuperAdmin ? <TeamTab />
                : <OrdersTab />}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}