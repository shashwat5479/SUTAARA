import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

// Dedicated page for one Sutaara Edit (Founder's picks, Statement Pieces…).
// Shows exactly the products the admin attached to that edit — not the whole
// collection. Reached from the Sutaara Edits menu and the /story page.
export default function EditPage() {
  const { id } = useParams();
  const [edit, setEdit] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api.getCuratedEdit(id)
      .then((e) => { if (!cancelled) { setEdit(e); setState('ready'); } })
      .catch(() => { if (!cancelled) setState('missing'); });
    return () => { cancelled = true; };
  }, [id]);

  if (state === 'loading') return <div className="loader"><div className="spinner" /></div>;

  if (state === 'missing' || !edit) {
    return (
      <section className="section--tight">
        <div className="container">
          <div className="empty">
            <h3>This edit isn't available</h3>
            <p>It may have been removed or is not live yet.</p>
            <Link to="/story" className="btn btn--primary">See all Sutaara Edits</Link>
          </div>
        </div>
      </section>
    );
  }

  const products = Array.isArray(edit.products) ? edit.products : [];

  return (
    <>
      <div className="page-head">
        <h1>{edit.title}</h1>
        {edit.description && <p className="edit-page__desc">{edit.description}</p>}
        <div className="crumbs">
          <Link to="/">Home</Link> / <Link to="/story">Sutaara Edits</Link> / <span>{edit.title}</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          {products.length === 0 ? (
            <div className="empty">
              <h3>New pieces are on their way</h3>
              <p>We're still curating this edit — check back soon.</p>
              <Link to="/shop" className="btn btn--primary">Explore the collection</Link>
            </div>
          ) : (
            <>
              <div className="grid">
                {products.map((p) => (
                  <ProductCard product={p} key={p._id || p.id} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
