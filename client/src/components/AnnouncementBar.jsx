import { useState } from 'react';
import { Close } from './Icons.jsx';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="announce-bar">
      <div className="container announce-bar__row">
        <span>
          Free shipping across India · Handcrafted to order, ships in 5–7 days
        </span>
        <button
          className="announce-bar__close"
          aria-label="Dismiss"
          onClick={() => setVisible(false)}
        >
          <Close />
        </button>
      </div>
    </div>
  );
}
