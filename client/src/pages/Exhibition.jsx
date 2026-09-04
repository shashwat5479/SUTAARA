import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ExhibitionCarousel from '../components/ExhibitionCarousel.jsx';

// Fallback slides if the admin hasn't added any yet (mirrors the homepage).
const FALLBACK = [
  { id: 'f1', img: '/products/maroon-patola-ikat-1.jpg', title: 'Patola Ikat', subtitle: 'Festive edit', to: '/shop?category=saree' },
  { id: 'f2', img: '/products/peach-leheriya-organza-1.jpg', title: 'Leheriya Organza', subtitle: 'Everyday drape', to: '/shop?category=saree' },
  { id: 'f3', img: '/products/mauve-kalamkari-peacock-1.jpg', title: 'Kalamkari Peacock', subtitle: 'Hand-painted', to: '/shop?category=saree' },
];

export default function Exhibition() {
  const [slides, setSlides] = useState(null);

  useEffect(() => {
    api.getExhibitionSlides()
      .then((s) => {
        const mapped = Array.isArray(s)
          ? s.map((x) => ({ id: x._id, img: x.image, title: x.title, subtitle: x.subtitle, to: x.link || '/shop' }))
              .filter((x) => x.img)
          : [];
        setSlides(mapped.length ? mapped : FALLBACK);
      })
      .catch(() => setSlides(FALLBACK));
  }, []);

  const list = slides || FALLBACK;

  return (
    <>
      <div className="page-head">
        <h1>The Exhibition</h1>
        <div className="crumbs">
          <Link to="/">Home</Link> / <span>Exhibition</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          <p className="exhibition-intro">
            A curated showcase of Sutaara's handcrafted pieces — brought together for the season.
            Explore each piece below, or visit us at the studio in Lucknow to see them in person.
          </p>

          {/* Same coverflow animation as the homepage */}
          {slides === null ? (
            <div className="loader"><div className="spinner" /></div>
          ) : (
            <ExhibitionCarousel slides={list} />
          )}

          {/* Each exhibition piece as a card with its image + text + link */}
          <div className="exhibition-grid">
            {list.map((s) => (
              <Link key={s.id} to={s.to} className="exhibition-card">
                <div className="exhibition-card__img">
                  <img src={s.img} alt={s.title} loading="lazy" />
                </div>
                <div className="exhibition-card__body">
                  {s.subtitle && <span className="exhibition-card__kicker">{s.subtitle}</span>}
                  <h3>{s.title}</h3>
                  <span className="exhibition-card__cta">View piece →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Visit the studio */}
          <div className="exhibition-visit">
            <h2>See them in person</h2>
            <p>Visit the Sutaara studio in Lucknow to experience the collection first-hand, or book a private appointment.</p>
            <div className="exhibition-visit__actions">
              <Link to="/studio" className="btn btn--primary">Visit the Studio</Link>
              <Link to="/shop" className="btn btn--ghost">Shop the full collection</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
