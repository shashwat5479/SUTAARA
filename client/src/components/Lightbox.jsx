import { useEffect } from 'react';
import { Close } from './Icons.jsx';

export default function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!src) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="close-btn" aria-label="Close">
        <Close width="28" height="28" />
      </button>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
