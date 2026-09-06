import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import { colorHex } from '../utils/format.js';

const CATEGORY_LABEL = {
  saree: 'Sarees',
  suit: 'Suit Sets',
  blouse: 'Blouses',
  dupatta: 'Dupattas',
  potli: 'Potli Bags',
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
  const [facets, setFacets] = useState({ fabrics: [], occasions: [], colors: [] });
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

  useEffect(() => {
    api.getFacets().then(setFacets).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getProducts({ category, fabric, occasion, color, search, sort, limit: 48 })
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
  }, [category, fabric, occasion, color, search, sort]);

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

  const activeChips = [
    fabric && ['fabric', fabric],
    occasion && ['occasion', occasion],
    color && ['color', color],
  ].filter(Boolean);

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

      {facets.fabrics.length > 0 && (
        <div className="filter-group">
          <h4>Fabric</h4>
          {facets.fabrics.map((f) => (
            <label className="filter-opt" key={f}>
              <input type="radio" name="fabric" checked={fabric === f} onChange={() => update('fabric', f)} />
              {f}
            </label>
          ))}
        </div>
      )}

      {facets.occasions.length > 0 && (
        <div className="filter-group">
          <h4>Occasion</h4>
          {facets.occasions.map((o) => (
            <label className="filter-opt" key={o}>
              <input type="radio" name="occasion" checked={occasion === o} onChange={() => update('occasion', o)} />
              {o}
            </label>
          ))}
        </div>
      )}

      {facets.colors.length > 0 && (
        <div className="filter-group">
          <h4>Colour</h4>
          <div className="swatches">
            {facets.colors.map((c) => (
              <button
                key={c}
                className={`swatch ${color === c ? 'active' : ''}`}
                title={c}
                aria-label={c}
                style={{ background: colorHex(c) }}
                onClick={() => update('color', c)}
              />
            ))}
          </div>
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
                  {loading ? 'Loading…' : `${total} piece${total === 1 ? '' : 's'}`}
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
                  {activeChips.map(([key, val]) => (
                    <span className="chip" key={key}>
                      {val}
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
