import { useLocation } from 'react-router-dom';
import { Whatsapp } from './Icons.jsx';
import { WHATSAPP_NUMBER } from '../utils/format.js';

// Floating WhatsApp button shown on every storefront page (mounted once in
// Layout). Icon only — no label, no chat widget; it simply opens WhatsApp.
// Hidden inside the admin panel, where it would sit on top of the controls.
export default function WhatsAppFloat() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  const text = encodeURIComponent('Hi Sutaara, I’d like to know more about your collection.');
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp Sutaara"
      title="WhatsApp"
    >
      <Whatsapp width="30" height="30" />
    </a>
  );
}
