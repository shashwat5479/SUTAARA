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
              Prayagraj. Every piece carries the mark of the hand that made it.
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
              <li><Link to="/shop">Size &amp; Fit</Link></li>
              <li><Link to="/shop">Fabric Care</Link></li>
              <li><Link to="/shop">Shipping &amp; Returns</Link></li>
              <li><Link to="/account">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4>Reach Us</h4>
            <ul>
              <li>Prayagraj, Uttar Pradesh</li>
              <li>hello@sutaara.in</li>
              <li>+91 98765 43210</li>
              <li>Instagram · WhatsApp</li>
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
