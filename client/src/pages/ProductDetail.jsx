import { useEffect, useState, useRef, useCallback } from 'react';
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

/* ── collapsible accordion ── */
function Accordion({ title, children, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="acc__item">
      <button className="acc__head" onClick={() => setOpen((o) => !o)}>
        {title}
        <span>{open ? '−' : '+'}</span>
      </button>
      <div className="acc__body" style={{ maxHeight: open ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease, opacity 0.3s ease', opacity: open ? 1 : 0 }}>
        {children}
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
  const galleryRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, locked: false, horizontal: false });

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setQty(1);
    api
      .getProduct(slug)
      .then((res) => { setProduct(res.product); setRelated(res.related); })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const imgCount = product ? product.images.length : 0;
  const goImg = useCallback((dir) => {
    setActiveImg((n) => (n + dir + imgCount) % imgCount);
  }, [imgCount]);

  /* ── Touch swipe on product gallery — non-passive so preventDefault works ── */
  useEffect(() => {
    const el = galleryRef.current;
    if (!el || imgCount <= 1) return;

    const onStart = (e) => {
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY, locked: false, horizontal: false };
    };
    const onMove = (e) => {
      const ref = touchRef.current;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - ref.startX);
      const dy = Math.abs(t.clientY - ref.startY);
      if (!ref.locked && (dx > 8 || dy > 8)) {
        ref.locked = true;
        ref.horizontal = dx > dy;
      }
      if (ref.horizontal) { e.preventDefault(); e.stopPropagation(); }
    };
    const onEnd = (e) => {
      const ref = touchRef.current;
      const dx = e.changedTouches[0].clientX - ref.startX;
      if (ref.horizontal && Math.abs(dx) > 40) {
        goImg(dx < 0 ? 1 : -1);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [imgCount, goImg]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

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

  /* ── check if product details table has any filled fields ── */
  const hasDetails = product.fabric || product.color || product.sareeLength ||
    product.blousePiece || product.care || product.occasion;

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
            {/* ── Gallery ── */}
            <div className="pdp__gallery">
              <div className="pdp__main" ref={galleryRef} onClick={() => setZoom(true)}>
                {product.images.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={i === activeImg ? product.name : ''}
                    className={`pdp__slide ${i === activeImg ? 'is-active' : ''}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable="false"
                  />
                ))}

                {product.images.length > 1 && (
                  <>
                    <button type="button" className="pdp__nav pdp__nav--prev" aria-label="Previous photo"
                      onClick={(e) => { e.stopPropagation(); goImg(-1); }}>‹</button>
                    <button type="button" className="pdp__nav pdp__nav--next" aria-label="Next photo"
                      onClick={(e) => { e.stopPropagation(); goImg(1); }}>›</button>
                    <div className="pdp__dots">
                      {product.images.map((src, i) => (
                        <button key={src} type="button"
                          className={`pdp__dot ${i === activeImg ? 'is-active' : ''}`}
                          aria-label={`Photo ${i + 1}`}
                          onClick={(e) => { e.stopPropagation(); setActiveImg(i); }} />
                      ))}
                    </div>
                    <span className="pdp__count">{activeImg + 1} / {product.images.length}</span>
                  </>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="pdp__thumbs">
                  {product.images.map((src, i) => (
                    <button key={src} className={`pdp__thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}>
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

            {/* ── Info ── */}
            <div className="pdp__info">
              <span className="eyebrow">{product.fabric}</span>
              <h1>{product.name}</h1>

              <div className="pdp__price-row">
                <span className="price-now">{inr(product.price)}</span>
                {off > 0 && <span className="price-was">{inr(product.mrp)}</span>}
                {off > 0 && <span className="price-off">{off}% off</span>}
              </div>

              {product.sku && (
                <div className="pdp__sku"><span>SKU — {product.sku}</span></div>
              )}

              <div className="pdp__rating">
                <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
                {product.rating.toFixed(1)} · {product.numReviews} reviews
              </div>

              <p className="pdp__meta">
                <Truck width="16" height="16" style={{ verticalAlign: '-3px', marginRight: 6 }} />
                Free shipping over ₹4,999 · Dispatched in 3–4 working days
              </p>

              {/* ── Desktop buy buttons (hidden on mobile — sticky bar instead) ── */}
              <div className="pdp__buy pdp__buy--desktop">
                <div className="stepper">
                  <button aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus width="16" height="16" />
                  </button>
                  <span>{qty}</span>
                  <button aria-label="Increase" onClick={() => setQty((q) => q + 1)}>
                    <Plus width="16" height="16" />
                  </button>
                </div>
                <button className="btn btn--primary" style={{ flex: 1 }} disabled={product.stock === 0}
                  onClick={() => { add(product, qty); toast('Added to bag'); }}>
                  Add to bag
                </button>
                <button className="icon-btn" aria-label="Wishlist"
                  style={{ border: '1px solid var(--line-strong)', borderRadius: 'var(--radius)', width: 48, color: wished ? 'var(--sindoor)' : 'var(--ink)' }}
                  onClick={() => { toggle(product); toast(wished ? 'Removed from wishlist' : 'Saved to wishlist'); }}>
                  <Heart filled={wished} />
                </button>
              </div>

              {/* ── Collapsible sections ── */}
              <div className="pdp__accordions">
                <Accordion title="Description" open>
                  <p>{product.description}</p>
                </Accordion>

                {product.stylingNote && (
                  <Accordion title="Sutaara Styling Note">
                    <div className="pdp__styling-inner"><p>{product.stylingNote}</p></div>
                  </Accordion>
                )}

                {hasDetails && (
                  <Accordion title="Product Details">
                    <table className="pdp__spec-table">
                      <tbody>
                        {product.fabric && <tr><td>Fabric</td><td>{product.fabric}</td></tr>}
                        {product.color && <tr><td>Colour</td><td>{product.color}</td></tr>}
                        {product.sareeLength && <tr><td>Saree Length</td><td>{product.sareeLength}</td></tr>}
                        {product.blousePiece && <tr><td>Blouse Piece</td><td>{product.blousePiece}</td></tr>}
                        {product.care && <tr><td>Care</td><td>{product.care}</td></tr>}
                        {product.occasion && <tr><td>Occasion</td><td>{product.occasion}</td></tr>}
                      </tbody>
                    </table>
                  </Accordion>
                )}

                {product.blouseNote && (
                  <Accordion title="Blouse &amp; Stitching">
                    <p>{product.blouseNote}</p>
                  </Accordion>
                )}

                <Accordion title="Shipping &amp; Returns">
                  <p>Dispatched in 3–4 working days. Free shipping over ₹4,999, flat ₹100 otherwise.
                    Returns accepted within 48 hours if product is damaged, defective or incorrect.</p>
                </Accordion>
              </div>

              <p className="pdp__note-lighting">
                Please note: the colour shades of the product may appear slightly different due to lighting.
              </p>

              <a className="wa-btn" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                target="_blank" rel="noreferrer" style={{ marginBottom: 8, display: 'inline-flex' }}>
                <Whatsapp width="18" height="18" /> Enquire on WhatsApp
              </a>
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
              {related.map((p) => <ProductCard product={p} key={p._id} />)}
            </div>
          </div>
        </section>
      )}

      {zoom && (
        <Lightbox src={product.images[activeImg]} alt={product.name} onClose={() => setZoom(false)} />
      )}

      {/* ── Sticky bottom bar (mobile only) ── */}
      <div className="pdp__sticky-bar">
        <button className="pdp__sticky-wish" onClick={() => { toggle(product); toast(wished ? 'Removed' : 'Saved to wishlist'); }}>
          <Heart filled={wished} width="18" height="18" />
          <span>Wishlist</span>
        </button>
        <button className="pdp__sticky-cart" disabled={product.stock === 0}
          onClick={() => { add(product, qty); toast('Added to bag'); }}>
          Add to bag — {inr(product.price)}
        </button>
      </div>
    </>
  );
}
