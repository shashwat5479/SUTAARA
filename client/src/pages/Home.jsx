import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import ExhibitionCarousel from '../components/ExhibitionCarousel.jsx';
import DiaryBook from '../components/DiaryBook.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Pieces shown in the exhibition coverflow. Each points at a real product
// image; the `to` link opens that piece (falls back to the shop otherwise).
const EXHIBITION_SLIDES = [
  { id: 'e1', img: '/products/mauve-kalamkari-peacock-3.jpg', title: 'Kalamkari Peacock',  subtitle: 'Hand-painted saree', to: '/shop?category=saree' },
  { id: 'e2', img: '/products/maroon-patola-ikat-1.jpg',      title: 'Patola Ikat',         subtitle: 'Festive edit',       to: '/shop?category=saree' },
  { id: 'e3', img: '/products/green-gold-leheriya-1.jpg',     title: 'Green–Gold Leheriya', subtitle: 'Zari &amp; tissue',      to: '/shop?category=saree' },
  { id: 'e4', img: '/products/magenta-emerald-set-1.jpg',     title: 'Magenta Emerald Set', subtitle: 'Suit set',           to: '/shop?category=suit' },
  { id: 'e5', img: '/products/peach-leheriya-organza-3.jpg',  title: 'Peach Organza',       subtitle: 'Everyday drape',     to: '/shop?category=saree' },
  { id: 'e6', img: '/products/red-ajrakh-suit-1.jpg',         title: 'Red Ajrakh',          subtitle: 'Ajrakh cotton',      to: '/shop?category=suit' },
];

// Grouped slideshow — each slide shows 3 shots of the same piece side by
// side, then swaps to the next piece's 3 shots. Matches the lookbook-style
// hero used by hathkargha and similar brands.
const HERO_SLIDES = [
  { slug: 'mauve-kalamkari-peacock', title: 'Kalamkari Peacock', imgs: ['/products/mauve-kalamkari-peacock-1.jpg', '/products/mauve-kalamkari-peacock-3.jpg', '/products/mauve-kalamkari-peacock-5.jpg'] },
  { slug: 'peach-leheriya-organza', title: 'Peach Leheriya Organza', imgs: ['/products/peach-leheriya-organza-1.jpg', '/products/peach-leheriya-organza-3.jpg', '/products/peach-leheriya-organza-5.jpg'] },
  { slug: 'maroon-patola-ikat', title: 'Maroon Patola Ikat', imgs: ['/products/maroon-patola-ikat-1.jpg', '/products/maroon-patola-ikat-2.jpg', '/products/red-ajrakh-suit-1.jpg'] },
  { slug: 'green-gold-leheriya', title: 'Green–Gold Leheriya', imgs: ['/products/green-gold-leheriya-1.jpg', '/products/green-gold-leheriya-3.jpg', '/products/green-gold-leheriya-5.jpg'] },
  { slug: 'peach-madhubani', title: 'Peach Madhubani', imgs: ['/products/peach-madhubani-1.jpg', '/products/peach-madhubani-2.jpg', '/products/peach-madhubani-3.jpg'] },
  { slug: 'magenta-emerald-set', title: 'Magenta Emerald Set', imgs: ['/products/magenta-emerald-set-1.jpg', '/products/magenta-emerald-set-2.jpg', '/products/rose-emerald-suit-1.jpg'] },
];

const CATEGORIES = [
  { key: 'saree',   label: 'Sarees',      note: 'Drape',     img: '/products/mauve-kalamkari-peacock-1.jpg' },
  { key: 'suit',    label: 'Suit Sets',   note: 'Everyday',  img: '/products/rose-emerald-suit-1.jpg' },
  { key: 'blouse',  label: 'Blouses',     note: 'Statement', img: '/products/magenta-emerald-set-2.jpg' },
  { key: 'dupatta', label: 'Dupattas',    note: 'Drape',     img: '/products/peach-leheriya-organza-3.jpg' },
  { key: 'potli',   label: 'Potli Bags',  note: 'Finish',    img: '/products/mustard-turquoise-set-2.jpg' },
];

export default function Home() {
  const [arrivals, setArrivals] = useState([]);
  // One row per category on the homepage, each with its own "view more".
  const [byCategory, setByCategory] = useState({});
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api
      .getProducts({ newArrival: true, limit: 8, sort: 'newest' })
      .then((res) => setArrivals(res.products))
      .catch(() => {})
      .finally(() => setLoading(false));

    // 5-star reviews for the Sutaara Diaries section (fails quietly if none).
    api.getDiaries().then(setDiaries).catch(() => {});

    // Fetch each category's first few pieces in parallel. Individual failures
    // are swallowed so one empty category can't blank the whole homepage.
    Promise.all(
      CATEGORIES.map((c) =>
        api
          .getProducts({ category: c.key, limit: 4, sort: 'featured' })
          .then((res) => [c.key, res.products])
          .catch(() => [c.key, []])
      )
    ).then((pairs) => setByCategory(Object.fromEntries(pairs)));
  }, []);

  return (
    <>
      {/* HERO — swipeable, clickable saree carousel (each opens its product) */}
      <section className="hero">
        <div className="hero__media">
          <HeroCarousel slides={HERO_SLIDES} />
        </div>
        <div className="hero__scrim" />
        <div className="container">
          <div className="hero__inner reveal reveal--1">
            <span className="eyebrow reveal reveal--2">बारिश &amp; धूप · New Season</span>
            <h1 className="reveal reveal--3">
              Woven by hand,<br />
              worn with <em>meaning</em>.
            </h1>
            <p className="reveal reveal--4">
              Hand-painted sarees, chikankari suits and one-of-a-kind blouses — made in small
              batches, never mass-produced.
            </p>
            <div className="hero__cta reveal reveal--5">
              <Link to="/shop" className="btn btn--gold">Shop the collection</Link>
              <Link to="/shop?category=saree" className="btn btn--light">Explore sarees</Link>
            </div>
          </div>
        </div>
      </section>

      {/* STORYBOOK INTRO */}
      <section className="storybook-intro">
        <div className="container">
          <div className="chapter-mark" style={{ justifyContent: 'center' }}>Prologue</div>
          <p>
            Every Sutaara piece begins as a story, not a stock number — a length of cloth, a pair
            of hands, and a season that gave it its name. What follows is a small telling of how
            it comes to you.
          </p>
          <div className="ornament">✦ ✦ ✦</div>
        </div>
      </section>

      {/* TRUST */}
      <section className="trust">
        <div className="container">
          <div className="trust__grid">
            <div className="trust__item"><strong>Hand-painted</strong><span>Artist-made, never printed twice</span></div>
            <div className="trust__item"><strong>Pure fabrics</strong><span>Mul cotton, chiffon, Banarasi silk</span></div>
            <div className="trust__item"><strong>Free shipping</strong><span>On orders above ₹2,999</span></div>
            <div className="trust__item"><strong>Made in India</strong><span>Lucknow atelier</span></div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="chapter-mark">Chapter I — The Wardrobe</div>
            <span className="eyebrow">Find your piece</span>
            <h2>Shop by category</h2>
            <hr className="zari zari--short" />
          </div>
          <div className="cats">
            {CATEGORIES.map((c) => (
              <Link to={`/shop?category=${c.key}`} className="cat" key={c.key}>
                <img src={c.img} alt={c.label} />
                <div className="cat__label">
                  <span>{c.note}</span>
                  <h3>{c.label}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="chapter-mark">Chapter II — Fresh Off the Loom</div>
            <span className="eyebrow">Fresh off the loom</span>
            <h2>New arrivals</h2>
            <hr className="zari zari--short" />
          </div>
          {loading ? (
            <div className="grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton" style={{ aspectRatio: '3/4', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '40%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid">
              {arrivals.slice(0, 8).map((p) => (
                <ProductCard product={p} key={p._id} />
              ))}
            </div>
          )}
          <div className="text-center mt-40">
            <Link to="/shop" className="btn btn--ghost">View all pieces</Link>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY — a row per category, each with its own view-more */}
      {CATEGORIES.map((cat) => {
        const items = byCategory[cat.key];
        const empty = items && items.length === 0;
        return (
          <section className="section cat-row" style={{ paddingTop: 0 }} key={cat.key}>
            <div className="container">
              <div className="section-head">
                <span className="eyebrow">{cat.note}</span>
                <h2>{cat.label}</h2>
                <hr className="zari zari--short" />
              </div>

              {!items ? (
                <div className="grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <div className="skeleton" style={{ aspectRatio: '3/4', marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 14, width: '40%' }} />
                    </div>
                  ))}
                </div>
              ) : empty ? (
                // No products in this category yet — keep the section so people
                // can see the range we're building, but say so plainly rather
                // than dropping the row silently.
                <div className="coming-soon">
                  <span className="coming-soon__label">Coming soon</span>
                  <p>
                    Our first {cat.label.toLowerCase()} pieces are on the way.
                    Join the mailing list at the bottom to hear first.
                  </p>
                </div>
              ) : (
                <div className="grid reveal-group">
                  {items.map((p, i) => (
                    <div className="reveal-item" style={{ '--i': i }} key={p._id}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              )}

              {!empty && (
                <div className="text-center mt-40">
                  <Link to={`/shop?category=${cat.key}`} className="btn btn--ghost">
                    View more {cat.label.toLowerCase()}
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* EDITORIAL BAND */}
      <section id="our-craft" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="editorial reveal-item">
            <div className="editorial__media">
              <img className="sepia" src="/products/maroon-patola-ikat-1.jpg" alt="Maroon Patola ikat saree, styled" />
            </div>
            <div className="editorial__body">
              <div className="chapter-mark">Chapter III — A Saree's Story</div>
              <span className="eyebrow">The story of a saree</span>
              <h2>Barish &amp; <em>Dhoop</em></h2>
              <p className="drop-cap">
                Our signature red mul cotton was born of two seasons at once — light as monsoon
                air, warm as afternoon sun. Woven to move with you, and to last long enough to be
                handed down.
              </p>
              <Link to="/story" className="btn btn--gold">
                Discover the Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* EXHIBITION — coverflow carousel of festive pieces */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="chapter-mark">Chapter III½ — In the Room</div>
            <span className="eyebrow">Lucknow Ladies · Festive Exhibition</span>
            <h2>See the collection in person</h2>
            <hr className="zari zari--short" />
          </div>

          <ExhibitionCarousel slides={EXHIBITION_SLIDES} />

          <div className="text-center mt-40" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn btn--gold">View Exhibition</Link>
            <button
              className="btn btn--ghost"
              onClick={() => toast('We’ll share exhibition dates on WhatsApp soon.')}
            >
              Get exhibition updates
            </button>
          </div>
        </div>
      </section>

      {/* SUTAARA DIARIES — 5-star customer reviews as an open book */}
      <section className="diaries-section">
        <div className="diaries-section__bg" />
        <div className="diaries-section__scrim" />
        <div className="container">
          <div className="section-head section-head--light">
            <div className="chapter-mark">Chapter III½ — In Their Words</div>
            <span className="eyebrow" style={{ color: 'var(--gold-soft)' }}>Sutaara Diaries</span>
            <h2>Stories our customers wrote</h2>
            <hr className="zari zari--short" />
          </div>

          <DiaryBook reviews={diaries} />

          <div className="text-center mt-40">
            <Link to="/diaries" className="btn btn--gold">Open the Diary</Link>
          </div>
        </div>
      </section>

      {/* JOURNAL / CARE */}
      <section id="care" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="chapter-mark">Chapter IV — Keeping the Story</div>
            <span className="eyebrow">From the journal</span>
            <h2>Care &amp; keeping</h2>
            <hr className="zari zari--short" />
          </div>
          <div className="journal">
            <article className="journal__card">
              <img src="/products/lavender-bird-chiffon-2.jpg" alt="Saree care" />
              <div className="journal__body">
                <span className="eyebrow">Fabric care</span>
                <h3>How to keep your saree new</h3>
                <p>Store jewellery and sarees apart, fold along the grain, and let handloom breathe.</p>
                <Link to="/shop" className="link-underline">Read the guide</Link>
              </div>
            </article>
            <article className="journal__card">
              <img src="/products/mustard-elephant-chanderi-1.jpg" alt="Draping a saree" />
              <div className="journal__body">
                <span className="eyebrow">Styling</span>
                <h3>One saree, three ways to drape</h3>
                <p>From the classic Nivi to a modern pant-drape — small changes, whole new looks.</p>
                <Link to="/shop" className="link-underline">Read the guide</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="newsletter">
            <span className="eyebrow" style={{ color: 'var(--gold-soft)' }}>Stay in the loop</span>
            <h2>First look at new pieces</h2>
            <p>Join our list for early access to drops, exhibition dates, and care notes.</p>
            <form
              className="newsletter__form"
              onSubmit={(e) => {
                e.preventDefault();
                e.currentTarget.reset();
                toast('Thank you — you’re on the list.');
              }}
            >
              <input type="email" required placeholder="Your email address" aria-label="Email" />
              <button className="btn btn--gold" type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}