import { api } from '../api/client.js';

// Anonymous visitor tracking for the admin Analytics tab. A random id lives in
// localStorage — no name, email or other personal data is sent. Every call is
// fire-and-forget: tracking can never slow down or break the storefront.
const VID_KEY = 'sutaara_vid';

function visitorId() {
  try {
    let id = localStorage.getItem(VID_KEY);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}0000000000000000`.slice(0, 36);
      localStorage.setItem(VID_KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked — skip tracking
  }
}

const seenThisSession = (key) => {
  try {
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, '1');
  } catch { /* ignore */ }
  return false;
};

// Once per browser session. Admin pages don't count as visits.
export function trackVisit() {
  const id = visitorId();
  if (!id || window.location.pathname.startsWith('/admin')) return;
  if (seenThisSession('sutaara_visit')) return;
  api.trackVisit(id).catch(() => {});
}

// type: 'view' | 'wishlist_add' | 'wishlist_remove' | 'cart_add'
// Product views are counted once per product per session.
export function trackProductEvent(productId, type) {
  const id = visitorId();
  if (!id || !productId) return;
  if (type === 'view' && seenThisSession(`sutaara_view_${productId}`)) return;
  api.trackEvent({ productId, type, visitorId: id }).catch(() => {});
}
