import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { inr, discountPct, WHATSAPP_NUMBER } from '../utils/format.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductReviews from '../components/ProductReviews.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { Heart, Minus, Plus, Whatsapp, Truck } from '../components/Icons.jsx';

function Accordion({ title, children, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="acc__item">
      <button className="acc__head" onClick={() => setOpen((o) => !o)}>
        {title}
        <span>{open ? '−' : '+'}</span>
      </button>
      <div className="acc__body" style={{ maxHeight: open ? 400 : 0 }}>
        <p>{children}</p>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setQty(1);
    api
      .getProduct(slug)
      .then((res) => {
        setProduct(res.product);
        setRelated(res.related);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty" style={{ padding: '120px 20px' }}>
        <h3>Piece not found</h3>
        <p>It may have sold out or moved.</p>
        <Link to="/shop" className="btn btn--primary">Back to collection</Link>
      </div>
    );
  }

  const off = discountPct(product.mrp, product.price);
  const wished = has(product._id);
  const waText = encodeURIComponent(
    `Hello Sutaara, I'm interested in "${product.name}" (${inr(product.price)}). Is it available?`
  );

  return (
    <>
      <section className="section--tight">
        <div className="container">
          <div className="crumbs" style={{ marginBottom: 24 }}>
            <Link to="/">Home</Link> / <Link to={`/shop?category=${product.category}`}>
              {product.category}
            </Link>{' '}
            / <span>{product.name}</span>
          </div>

          <div className="pdp">
            <div className="pdp__gallery">
              <div className="pdp__main" onClick={() => setZoom(true)}>
                {/* Every photo is stacked and cross-faded rather than swapped,
                    so moving between shots of the same piece is a dissolve
                    instead of a flash of empty space while the next loads. */}
                {product.images.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={i === activeImg ? product.name : ''}
                    className={`pdp__slide ${i === activeImg ? 'is-active' : ''}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                ))}

                {product.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="pdp__nav pdp__nav--prev"
                      aria-label="Previous photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImg((n) => (n - 1 + product.images.length) % product.images.length);
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="pdp__nav pdp__nav--next"
                      aria-label="Next photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImg((n) => (n + 1) % product.images.length);
                      }}
                    >
                      ›
                    </button>
                    <div className="pdp__dots">
                      {product.images.map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          className={`pdp__dot ${i === activeImg ? 'is-active' : ''}`}
                          aria-label={`Photo ${i + 1}`}
                          onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                        />
                      ))}
                    </div>
                    <span className="pdp__count">
                      {activeImg + 1} / {product.images.length}
                    </span>
                  </>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="pdp__thumbs">
                  {product.images.map((src, i) => (
                    <button
                      key={src}
                      className={`pdp__thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={src} alt={`${product.name} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {product.video && (
                <div className="pdp__video">
                  <video src={product.video} controls preload="metadata" playsInline />
                </div>
              )}
            </div>

            <div className="pdp__info">
              <span className="eyebrow">{product.fabric}</span>
              <h1>{product.name}</h1>
              <div className="pdp__rating">
                <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
                {product.rating.toFixed(1)} · {product.numReviews} reviews
              </div>

              <div className="pdp__price">
                <span className="price-now">{inr(product.price)}</span>
                {off > 0 && <span className="price-was">{inr(product.mrp)}</span>}
                {off > 0 && <span className="price-off">{off}% off</span>}
              </div>

              <p className="pdp__desc">{product.description}</p>

              <div className="pdp__attrs">
                <div className="attr"><span>Fabric</span><strong>{product.fabric}</strong></div>
                <div className="attr"><span>Occasion</span><strong>{product.occasion}</strong></div>
                <div className="attr"><span>Colour</span><strong>{product.color}</strong></div>
                <div className="attr">
                  <span>Availability</span>
                  <strong>{product.stock > 0 ? `In stock (${product.stock})` : 'Sold out'}</strong>
                </div>
              </div>

              <div className="pdp__buy">
                <div className="stepper">
                  <button aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus width="16" height="16" />
                  </button>
                  <span>{qty}</span>
                  <button aria-label="Increase" onClick={() => setQty((q) => q + 1)}>
                    <Plus width="16" height="16" />
                  </button>
                </div>
                <button
                  className="btn btn--primary"
                  style={{ flex: 1 }}
                  disabled={product.stock === 0}
                  onClick={() => {
                    add(product, qty);
                    toast('Added to bag');
                  }}
                >
                  Add to bag
                </button>
                <button
                  className={`icon-btn ${wished ? '' : ''}`}
                  aria-label="Wishlist"
                  style={{
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--radius)',
                    width: 48,
                    color: wished ? 'var(--sindoor)' : 'var(--ink)',
                  }}
                  onClick={() => {
                    toggle(product);
                    toast(wished ? 'Removed from wishlist' : 'Saved to wishlist');
                  }}
                >
                  <Heart filled={wished} />
                </button>
              </div>

              <p className="pdp__meta">
                <Truck width="16" height="16" style={{ verticalAlign: '-3px', marginRight: 6 }} />
                Free shipping over ₹2,999 · Dispatched in 3–5 days
              </p>

              <a
                className="wa-btn"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                style={{ marginBottom: 24, display: 'inline-flex' }}
              >
                <Whatsapp width="18" height="18" /> Enquire on WhatsApp
              </a>

              <div>
                <Accordion title="Description" open>
                  {product.description}
                </Accordion>
                <Accordion title="Fabric &amp; care">{product.care}</Accordion>
                {product.blouseNote && (
                  <Accordion title="Blouse &amp; stitching">{product.blouseNote}</Accordion>
                )}
                <Accordion title="Shipping &amp; returns">
                  Dispatched in 3–5 working days. Free shipping over ₹2,999, flat ₹99 otherwise.
                  Easy 7-day returns on unworn pieces with tags intact.
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section--tight" style={{ paddingTop: 0 }}>
        <div className="container">
          <ProductReviews productId={product._id} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">You may also like</span>
              <h2>Pairs beautifully with</h2>
              <hr className="zari zari--short" />
            </div>
            <div className="grid">
              {related.map((p) => (
                <ProductCard product={p} key={p._id} />
              ))}
            </div>
          </div>
        </section>
      )}

      {zoom && (
        <Lightbox src={product.images[activeImg]} alt={product.name} onClose={() => setZoom(false)} />
      )}
    </>
  );
}
