import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="brand">
              <span className="brand__name">SUTAARA</span>
              <span className="brand__tag">Handcrafted</span>
            </Link>
            <p>
              Hand-painted and hand-woven ethnicwear, made in small batches in Lucknow and
              Lucknow. Every piece carries the mark of the hand that made it.
            </p>
          </div>

          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop?category=saree">Sarees</Link></li>
              <li><Link to="/shop?category=suit">Suit Sets</Link></li>
              <li><Link to="/shop?category=blouse">Blouses</Link></li>
              <li><Link to="/shop?category=potli">Potli Bags</Link></li>
              <li><Link to="/shop">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h4>Help</h4>
            <ul>
              <li><Link to="/shipping-policy">Shipping &amp; Delivery</Link></li>
              <li><Link to="/returns-policy">Returns &amp; Refunds</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/account">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4>Reach Us</h4>
            <ul>
              <li>Lucknow, Uttar Pradesh</li>
              <li><a href="mailto:sutara.lucknow@gmail.com">sutara.lucknow@gmail.com</a></li>
              <li><a href="https://wa.me/919569659272" target="_blank" rel="noreferrer">WhatsApp · 9569659272</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Sutaara. Made by hand.</span>
          <span className="deva">सुतारा</span>
        </div>
      </div>
    </footer>
  );
}
