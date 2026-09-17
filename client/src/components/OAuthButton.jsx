import { api } from '../api/client.js';

const ICONS = {
  yahoo: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#6001d2" />
      <path
        fill="#fff"
        d="M11.1 14.35 7.2 6.8h2.55l2.42 5.15L14.6 6.8h2.47l-4.03 7.68v3.6h-2.28v-3.6l.34-.13z"
      />
    </svg>
  ),
  outlook: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="1" y="4" width="14" height="16" rx="1.5" fill="#0364b8" />
      <path fill="#fff" d="M8 9.2a3 3 0 100 6 3 3 0 000-6zm0 4.6a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2z" />
      <path fill="#28a8ea" d="M17 6h5.2a.8.8 0 01.8.8v10.4a.8.8 0 01-.8.8H17V6z" />
      <path fill="#0078d4" d="M17 6l6 3.4v9.2z" opacity=".4" />
    </svg>
  ),
};

const LABELS = {
  yahoo: 'Continue with Yahoo',
  outlook: 'Continue with Outlook',
};

// Yahoo/Outlook have no client-side JS SDK like Google's — signing in means
// a full-page redirect to the provider's own consent screen, so this is a
// plain navigation, not a fetch call. The server's callback route sends the
// browser back to /login/callback once the provider exchange is done.
export default function OAuthButton({ provider }) {
  return (
    <button
      type="button"
      className="oauth-btn"
      onClick={() => { window.location.href = api.oauthRedirectUrl(provider); }}
    >
      {ICONS[provider]}
      <span>{LABELS[provider]}</span>
    </button>
  );
}
