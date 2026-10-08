import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

const CATEGORY_LABEL = {
  saree: 'Sarees',
  suit: 'Suit Sets',
  blouse: 'Blouses',
  dupatta: 'Dupattas',
  potli: 'Potli Bags',
};
// Facet options come from the server already grouped into a short, fixed set
// of families ({ value, label, count, hex? }). This guards against an older
// API response that only has plain string arrays.
const EMPTY_FACETS = {
  fabricOptions: [],
  occasionOptions: [],
  colorOptions: [],
};
const asOptions = (opts, plain) => {
  if (Array.isArray(opts)) return opts;
  return (Array.isArray(plain) ? plain : []).map((v) => ({ value: v, label: v }));
};
const SORTS = [
  ['featured', 'Featured'],
  ['newest', 'Newest'],
  ['priceLow', 'Price: Low to High'],
  ['priceHigh', 'Price: High to Low'],
  ['rating', 'Top Rated'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [facets, setFacets] = useState(EMPTY_FACETS);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openFilters, setOpenFilters] = useState(false);

  const category = params.get('category') || '';
  const fabric = params.get('fabric') || '';
  const occasion = params.get('occasion') || '';
  const color = params.get('color') || '';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'featured';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  useEffect(() => {
    // Re-fetch whenever the category changes, and scope the query to it —
    // this was fetching once on mount with no params, so every category
    // (Saree, Suit, Blouse, Potli...) showed the exact same catalog-wide
    // fabric list instead of only the fabrics that actually exist in that
    // category (matching what Shop All shows for "no category selected").
    api
      .getFacets({ category })
      .then((f) =>
        setFacets({
          fabricOptions: asOptions(f?.fabricOptions, f?.fabrics),
          occasionOptions: asOptions(f?.occasionOptions, f?.occasions),
          colorOptions: asOptions(f?.colorOptions, f?.colors),
        })
      )
      .catch(() => {});
  }, [category]);

  useEffect(() => {
    setLoading(true);
    api
      .getProducts({ category, fabric, occasion, color, search, sort, minPrice, maxPrice, limit: 48 })
      .then((res) => {
        // Guard against a malformed/failed payload so the grid never tries to
        // .map() something that isn't an array.
        setProducts(Array.isArray(res?.products) ? res.products : []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => {
        // On any failure (including the API being down), clear the list so the
        // page shows the Coming Soon / empty state rather than stale results
        // or a crash.
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [category, fabric, occasion, color, search, sort, minPrice, maxPrice]);

  const update = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params);
      if (!value || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const clearAll = () => setParams(search ? { search } : {}, { replace: true });

  const title = search
    ? `Results for “${search}”`
    : CATEGORY_LABEL[category] || 'The Collection';

  // Show the friendly family label on the chip (e.g. "Wedding & Receptions"
  // rather than the raw "Wedding") — falls back to the raw value for old links.
  const labelFor = (options, value) =>
    options.find(
      (o) =>
        o.value.toLowerCase() === String(value).toLowerCase() ||
        (o.aliases || []).some((a) => a.toLowerCase() === String(value).toLowerCase())
    )?.label || value;

  const activeChips = [
    fabric && ['fabric', fabric, labelFor(facets.fabricOptions, fabric)],
    occasion && ['occasion', occasion, labelFor(facets.occasionOptions, occasion)],
    color && ['color', color, labelFor(facets.colorOptions, color)],
  ].filter(Boolean);

  // A selected value is "on" if it matches an option's value or label,
  // ignoring case, so deep links like ?occasion=wedding still tick the box.
  const isOn = (selected, o) =>
    !!selected &&
    (selected.toLowerCase() === o.value.toLowerCase() ||
      selected.toLowerCase() === (o.label || '').toLowerCase() ||
      (o.aliases || []).some((a) => a.toLowerCase() === selected.toLowerCase()));
  const FilterPanel = (
    <aside className={`filters ${openFilters ? 'filters--open' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Filters</h4>
        <button
          className="close-btn filter-toggle"
          aria-label="Close filters"
          onClick={() => setOpenFilters(false)}
        >
          ×
        </button>
      </div>

      <div className="filter-group">
        <h4>Category</h4>
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
          <label className="filter-opt" key={key}>
            <input
              type="radio"
              name="category"
              checked={category === key}
              onChange={() => update('category', key)}
            />
            {label}
          </label>
        ))}
      </div>

      {facets.fabricOptions.length > 0 && (
        <div className="filter-group">
          <h4>Fabric</h4>
          {facets.fabricOptions.map((f) => (
            <label className="filter-opt" key={f.value}>
              <input
                type="radio"
                name="fabric"
                checked={isOn(fabric, f)}
                onChange={() => update('fabric', f.value)}
              />
              {f.label}
            </label>
          ))}
        </div>
      )}

      {facets.occasionOptions.length > 0 && (
        <div className="filter-group">
          <h4>Occasion</h4>
          {facets.occasionOptions.map((o) => (
            <label className="filter-opt" key={o.value}>
              <input
                type="radio"
                name="occasion"
                checked={isOn(occasion, o)}
                onChange={() => update('occasion', o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}

      {facets.colorOptions.length > 0 && (
        <div className="filter-group">
          <h4>Colour</h4>
          <div className="swatches">
            {facets.colorOptions.map((c) => (
              <button
                key={c.value}
                className={`swatch ${isOn(color, c) ? 'active' : ''}`}
                title={c.label}
                aria-label={c.label}
                aria-pressed={isOn(color, c)}
                style={{ background: c.hex || '#cbb99a' }}
                onClick={() => update('color', c.value)}
              />
            ))}
          </div>
          {color && (
            <p className="swatch-selected">{labelFor(facets.colorOptions, color)}</p>
          )}
        </div>
      )}

      <button className="btn btn--ghost btn--block btn--sm" style={{ marginTop: 20 }} onClick={clearAll}>
        Clear all
      </button>
    </aside>
  );

  return (
    <>
      <div className="page-head">
        <h1>{title}</h1>
        <div className="crumbs">
          <Link to="/">Home</Link> / <span>{title}</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          <div className="shop">
            {FilterPanel}

            <div>
              <div className="shop__bar">
                <button
                  className="btn btn--ghost btn--sm filter-toggle"
                  onClick={() => setOpenFilters(true)}
                >
                  Filters
                </button>
                <span className="shop__count">
                  {loading ? 'Loading…' : ''}
                </span>
                <select
                  className="select"
                  value={sort}
                  onChange={(e) => update('sort', e.target.value)}
                  aria-label="Sort"
                >
                  {SORTS.map(([v, l]) => (
                    <option value={v} key={v}>{l}</option>
                  ))}
                </select>
              </div>

              {(activeChips.length > 0 || category) && (
                <div className="chips">
                  {category && (
                    <span className="chip">
                      {CATEGORY_LABEL[category]}
                      <button onClick={() => update('category', category)} aria-label="Remove">×</button>
                    </span>
                  )}
                  {activeChips.map(([key, val, text]) => (
                    <span className="chip" key={key}>
                      {text}
                      <button onClick={() => update(key, val)} aria-label="Remove">×</button>
                    </span>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="grid grid--3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <div className="skeleton" style={{ aspectRatio: '3/4', marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 14, width: '40%' }} />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                // If the only filter is a category we don't stock yet, say
                // "coming soon" instead of the generic empty state — much
                // clearer for someone who just clicked "Dupattas" from the menu.
                (() => {
                  const onlyCat = category && !fabric && !occasion && !search;
                  const label = onlyCat ? (CATEGORY_LABEL[category] || 'These pieces') : '';
                  if (onlyCat) {
                    return (
                      <div className="empty coming-soon coming-soon--large">
                        <span className="coming-soon__label">Coming soon</span>
                        <h3>{label} are on the way</h3>
                        <p>
                          We're finishing the first {label.toLowerCase()} now.
                          Meanwhile, browse everything we have ready today.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button className="btn btn--ghost" onClick={() => navigate(-1)}>← Go back</button>
                          <button className="btn btn--primary" onClick={clearAll}>Browse the full collection</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="empty">
                      <h3>Nothing here yet</h3>
                      <p>Try removing a filter or browsing the full collection.</p>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn--ghost" onClick={() => navigate(-1)}>← Go back</button>
                        <button className="btn btn--primary" onClick={clearAll}>Clear filters</button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid--3">
                  {products.map((p) => (
                    <ProductCard product={p} key={p._id} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
