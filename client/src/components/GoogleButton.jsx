import { useEffect, useRef } from 'react';

// VITE_GOOGLE_CLIENT_ID must be set (client/.env) for this to render anything —
// it comes from a Google Cloud OAuth client, see README "API keys" section.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google's sign-in script is only needed on the login/register screens, so it
// is injected on first use rather than loaded on every page.
function ensureGsi() {
  if (window.google?.accounts?.id || document.getElementById('gsi-script')) return;
  const s = document.createElement('script');
  s.id = 'gsi-script';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  document.head.appendChild(s);
}

export default function GoogleButton({ onCredential, text = 'continue_with' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return; // not configured — component renders nothing (see fallback below)

    ensureGsi();
    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text, // 'continue_with' | 'signin_with' | 'signup_with'
        shape: 'pill',
        width: 320,
      });
    };

    // The GSI script is loaded async in index.html — poll briefly until it's ready.
    if (window.google?.accounts?.id) {
      render();
    } else {
      const id = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(id);
          render();
        }
      }, 100);
      setTimeout(() => clearInterval(id), 8000);
      return () => clearInterval(id);
    }
    return () => {
      cancelled = true;
    };
  }, [onCredential, text]);

  if (!CLIENT_ID) {
    // Fail quietly in dev rather than showing a broken button — the rest of
    // the auth form (email/password) still works without Google configured.
    return null;
  }

  return <div ref={ref} className="google-btn" />;
}
