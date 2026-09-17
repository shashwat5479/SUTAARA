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
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.087.274.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
              <path d="M20.463 3.488C18.217 1.24 15.231.001 12.05 0 5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413zm-8.413 18.297h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.826 9.826 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885z" />
            </svg>
          </a>
          <a className="social--instagram" href="https://www.instagram.com/sutaara.lko?igsi=MXZtdWljb3hqeDl5Nw%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.44.4.61.24 1.05.52 1.51.98.46.46.74.9.98 1.51.17.47.35 1.27.4 2.44.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.4 2.44-.24.61-.52 1.05-.98 1.51-.46.46-.9.74-1.51.98-.47.17-1.27.35-2.44.4-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.44-.4a4.08 4.08 0 01-1.51-.98 4.08 4.08 0 01-.98-1.51c-.17-.47-.35-1.27-.4-2.44C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.4-2.44.24-.61.52-1.05.98-1.51a4.08 4.08 0 011.51-.98c.47-.17 1.27-.35 2.44-.4C8.82 2.17 9.2 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.76 5.76 0 00-2.09 1.36A5.76 5.76 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.76 5.76 0 001.36 2.09 5.76 5.76 0 002.09 1.36c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.76 5.76 0 002.09-1.36 5.76 5.76 0 001.36-2.09c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.76 5.76 0 00-1.36-2.09A5.76 5.76 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>
          </a>
          <a className="social--facebook" href="https://www.facebook.com/share/1EnVSLxVLU/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z"/></svg>
          </a>
          <a className="social--email" href="mailto:support@sutaara.com" aria-label="Email">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </a>
        </div>

        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} Sutaara </span>
          <span className="deva">सुतारा</span>
        </div>
      </div>
    </footer>
  );
}
