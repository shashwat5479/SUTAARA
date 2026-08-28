import { useState, useEffect } from 'react';
import { Close } from './Icons.jsx';
import { api } from '../api/client.js';

const DEFAULT_MSG = 'Free shipping across India · Handcrafted to order, ships in 5–7 days';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Admin-controlled message; falls back to the default if none is set.
    api.getAnnouncement()
      .then((a) => {
        if (a === null) { setShow(true); setMessage(DEFAULT_MSG); return; }
        setShow(a.active);
        setMessage(a.message || DEFAULT_MSG);
      })
      .catch(() => {});
  }, []);

  if (!visible || !show || !message) return null;

  return (
    <div className="announce-bar">
      <div className="container announce-bar__row">
        <span>{message}</span>
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
