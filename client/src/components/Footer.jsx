import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus } from './Icons.jsx';

const SECTIONS = [
  {
    id: 'shop',
    title: 'Shop',
    links: [
      { label: 'Ladies', to: '/shop' },
      { label: 'Sarees', to: '/shop?category=saree' },
      { label: 'Suits', to: '/shop?category=suit' },
      { label: 'Blouses', to: '/shop?category=blouse' },
      { label: 'Dupattas', to: '/shop?category=dupatta' },
      { label: 'Potlis & Bags', to: '/shop?category=potli' },
      { label: 'New Arrivals', to: '/shop?sort=newest' },
      { label: 'Studio Appointment', to: '/studio' },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    links: [
      { label: 'Shipping & Delivery', to: '/shipping-policy' },
      { label: 'Returns & Refunds', to: '/returns-policy' },
      { label: "FAQ's", to: '/faq' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Track Order', to: '/account' },
    ],
  },
  {
    id: 'corporate',
    title: 'Corporate Info',
    links: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Disclaimer', to: '/disclaimer' },
    ],
  },
  {
    id: 'member',
    title: 'Become a Member',
    links: [
      { label: 'Sign In', to: '/login' },
      { label: 'Create Account', to: '/register' },
      { label: 'My Account', to: '/account' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
];

function FooterSection({ section, open, onToggle }) {
  const panelId = `footer-panel-${section.id}`;
  return (
    <div className={`footer__acc ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="footer__acc-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{section.title}</span>
        {open ? <Minus width="16" height="16" /> : <Plus width="16" height="16" />}
      </button>
      <div id={panelId} className="footer__acc-panel">
        <ul>
          {section.links.map((link) => (
            <li key={link.to + link.label}>
              <Link to={link.to}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Footer() {
  const [openId, setOpenId] = useState('shop');

  const toggle = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <footer className="footer">
      <div className="footer__inner">
        {SECTIONS.map((section) => (
          <FooterSection
            key={section.id}
            section={section}
            open={openId === section.id}
            onToggle={() => toggle(section.id)}
          />
        ))}

        <div className="footer__reach">
          <p>Lucknow, Uttar Pradesh</p>
          <a href="mailto:care@sutaara.com">care@sutaara.com</a>
          <div className="footer__social">
            <a href="https://wa.me/919569659272" target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z"/></svg>
            </a>
            <a href="mailto:care@sutaara.com" aria-label="Email" title="Email">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
          </div>
        </div>

        <div className="footer__mark">SUTAARA</div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Sutaara. Made by hand.</span>
          <span className="deva">सुतारा</span>
        </div>
      </div>
    </footer>
  );
}
