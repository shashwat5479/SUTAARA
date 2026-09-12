import { useState } from 'react';
import { Link } from 'react-router-dom';

function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`footer__section ${open ? 'is-open' : ''}`}>
      <button className="footer__section-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h4>{title}</h4>
        <span className="footer__section-toggle">{open ? '−' : '+'}</span>
      </button>
      <div className="footer__section-body">{children}</div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="brand">
              <span className="brand__name">SUTAARA</span>
            </Link>
            <p>
              From handwoven classics to contemporary finds, Sutaara curates Indian textiles, rooted in craft and chosen for modern wardrobes.
            </p>
          </div>

          <AccordionSection title="Help">
            <ul>
              <li><Link to="/shipping-policy">Shipping &amp; Delivery</Link></li>
              <li><Link to="/returns-policy">Returns &amp; Refunds</Link></li>
              <li><Link to="/faq">FAQ's</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
              <li><Link to="/account">Track order</Link></li>
              <li><Link to="/studio">Studio Appointment</Link></li>
            </ul>
          </AccordionSection>

          <AccordionSection title="Terms">
            <ul>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/disclaimer">Disclaimer</Link></li>
            </ul>
          </AccordionSection>

          <AccordionSection title="Reach Us">
            <ul>
              <li>Lucknow, Uttar Pradesh</li>
              <li><a href="mailto:care@sutaara.com">care@sutaara.com</a></li>
              <li><Link to="/contact">Contact us</Link></li>
            </ul>
          </AccordionSection>
        </div>

        <div className="footer__social">
          <a className="social--whatsapp" href="https://wa.me/919569005501 " target="_blank" rel="noreferrer" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z"/></svg>
          </a>
          <a className="social--instagram" href="https://www.instagram.com/sutaara.lko?igsi=MXZtdWljb3hqeDl5Nw%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.44.4.61.24 1.05.52 1.51.98.46.46.74.9.98 1.51.17.47.35 1.27.4 2.44.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.4 2.44-.24.61-.52 1.05-.98 1.51-.46.46-.9.74-1.51.98-.47.17-1.27.35-2.44.4-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.44-.4a4.08 4.08 0 01-1.51-.98 4.08 4.08 0 01-.98-1.51c-.17-.47-.35-1.27-.4-2.44C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.4-2.44.24-.61.52-1.05.98-1.51a4.08 4.08 0 011.51-.98c.47-.17 1.27-.35 2.44-.4C8.82 2.17 9.2 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.76 5.76 0 00-2.09 1.36A5.76 5.76 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.76 5.76 0 001.36 2.09 5.76 5.76 0 002.09 1.36c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.76 5.76 0 002.09-1.36 5.76 5.76 0 001.36-2.09c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.76 5.76 0 00-1.36-2.09A5.76 5.76 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>
          </a>
          <a className="social--facebook" href="https://www.facebook.com/share/1EnVSLxVLU/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z"/></svg>
          </a>
          <a className="social--youtube" href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.56 31.56 0 000 12a31.56 31.56 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.56 31.56 0 0024 12a31.56 31.56 0 00-.5-5.81zM9.75 15.27V8.73L15.5 12l-5.75 3.27z"/></svg>
          </a>
          <a className="social--email" href="mailto:support@sutaara.com" aria-label="Email">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </a>
        </div>

        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} Sutaara. Made by hand.</span>
          <span className="deva">सुतारा</span>
        </div>
      </div>
    </footer>
  );
}
