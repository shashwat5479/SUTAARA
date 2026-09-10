// Thin fetch wrapper. In dev, Vite proxies "/api" to the Express server.
// Override with VITE_API_URL if you host the API elsewhere.
const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('sutaara_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    // Keep the parsed body and status on the error. Some responses carry
    // meaning beyond the message — a 403 from /auth/login includes
    // needsVerification, which the login page needs in order to show the
    // code-entry step instead of just printing an error.
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function qs(params = {}) {
  const clean = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  return clean.length ? `?${new URLSearchParams(clean)}` : '';
}

export const api = {
  // products
  getProducts: (params) => request(`/products${qs(params)}`),
  getFacets: () => request('/products/facets'),
  getProduct: (slug) => request(`/products/${slug}`),
  createProduct: (body) => request('/products', { method: 'POST', body, auth: true }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body, auth: true }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),

  // auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  googleLogin: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  verifyEmail: (email, code) => request('/auth/verify-email', { method: 'POST', body: { email, code } }),
  resendCode: (email) => request('/auth/resend-code', { method: 'POST', body: { email } }),
  getMe: () => request('/auth/me', { auth: true }),
  updateMe: (body) => request('/auth/me', { method: 'PUT', body, auth: true }),

  // orders
  createOrder: (body) => request('/orders', { method: 'POST', body, auth: true }),
  getMyOrders: () => request('/orders/mine', { auth: true }),
  getAllOrders: () => request('/orders', { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: { status }, auth: true }),
  setReturnEligibility: (id, eligible) =>
    request(`/orders/${id}/return-eligibility`, { method: 'PATCH', body: { eligible }, auth: true }),
  requestReturn: (id, reason) =>
    request(`/orders/${id}/request-return`, { method: 'POST', body: { reason }, auth: true }),

  // Razorpay payments
  getRazorpayKey: () => request('/payments/razorpay/key'),
  createPaymentOrder: (orderId) =>
    request(`/payments/razorpay/orders/${orderId}`, { method: 'POST', auth: true }),
  verifyPayment: (body) => request('/payments/razorpay/verify', { method: 'POST', body, auth: true }),
  recordPaymentFailure: (body) => request('/payments/razorpay/failure', { method: 'POST', body, auth: true }),

  // Invoice / documents — these return a PDF, not JSON, so they bypass the
  // request() helper and hand back a blob for the browser to open/download.
  downloadDocument: async (path, filename) => {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let message = `Could not fetch ${filename} (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {}
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },
  downloadInvoice: (orderId, orderNumber) =>
    api.downloadDocument(`/orders/${orderId}/invoice`, `${orderNumber || orderId}-invoice.pdf`),
  downloadPackingSlip: (orderId, orderNumber) =>
    api.downloadDocument(`/orders/${orderId}/packing-slip`, `${orderNumber || orderId}-packing-slip.pdf`),
  downloadShippingLabel: (orderId, orderNumber) =>
    api.downloadDocument(`/orders/${orderId}/shipping-label`, `${orderNumber || orderId}-label.pdf`),
  downloadPrintAll: (orderId, orderNumber) =>
    api.downloadDocument(`/orders/${orderId}/print-all`, `${orderNumber || orderId}-print-all.pdf`),

  // studio appointments
  createAppointment: (body) => request('/appointments', { method: 'POST', body, auth: !!getToken() }),
  getMyAppointments: () => request('/appointments/mine', { auth: true }),
  getAllAppointments: () => request('/appointments', { auth: true }),
  updateAppointmentStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PUT', body: { status }, auth: true }),

  // studio event / exhibition info (admin-controlled)
  getStudioEvent: () => request('/studio-event'),
  getAllStudioEvents: () => request('/studio-event/all', { auth: true }),
  createStudioEvent: (body) => request('/studio-event', { method: 'POST', body, auth: true }),
  updateStudioEvent: (id, body) => request(`/studio-event/${id}`, { method: 'PUT', body, auth: true }),
  deleteStudioEvent: (id) => request(`/studio-event/${id}`, { method: 'DELETE', auth: true }),

  // reviews / Sutaara Diaries
  getDiaries: () => request('/reviews/diaries'),
  getProductReviews: (productId) => request(`/reviews/product/${productId}`),
  canReview: (productId) => request(`/reviews/can-review/${productId}`, { auth: true }),
  createReview: (body) => request('/reviews', { method: 'POST', body, auth: true }),
  getAllReviews: () => request('/reviews', { auth: true }),
  setReviewApproval: (id, approved) => request(`/reviews/${id}/approve`, { method: 'PUT', body: { approved }, auth: true }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE', auth: true }),

  // hero slides (admin-controlled homepage hero)
  getHeroSlides: () => request('/hero'),
  getAllHeroSlides: () => request('/hero/all', { auth: true }),
  createHeroSlide: (body) => request('/hero', { method: 'POST', body, auth: true }),
  updateHeroSlide: (id, body) => request(`/hero/${id}`, { method: 'PUT', body, auth: true }),
  deleteHeroSlide: (id) => request(`/hero/${id}`, { method: 'DELETE', auth: true }),

  // exhibition slides (admin-controlled)
  getExhibitionSlides: () => request('/exhibition'),
  getAllExhibitionSlides: () => request('/exhibition/all', { auth: true }),
  createExhibitionSlide: (body) => request('/exhibition', { method: 'POST', body, auth: true }),
  updateExhibitionSlide: (id, body) => request(`/exhibition/${id}`, { method: 'PUT', body, auth: true }),
  deleteExhibitionSlide: (id) => request(`/exhibition/${id}`, { method: 'DELETE', auth: true }),

  // announcement bar (admin + super admin)
  getAnnouncement: () => request('/announcement'),
  getAllAnnouncements: () => request('/announcement/all', { auth: true }),
  saveAnnouncement: (body) => request('/announcement', { method: 'PUT', body, auth: true }),

  // notification settings (super admin)
  getNotificationSettings: () => request('/notification-settings', { auth: true }),
  saveNotificationSettings: (body) => request('/notification-settings', { method: 'PUT', body, auth: true }),

  // team / staff accounts (super admin only)
  getStaff: () => request('/admin/users', { auth: true }),
  createStaffAccount: (body) => request('/admin/users', { method: 'POST', body, auth: true }),
  changeStaffRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: { role }, auth: true }),
  resetStaffPassword: (id, password) => request(`/admin/users/${id}/password`, { method: 'PUT', body: { password }, auth: true }),
  removeStaffAccount: (id) => request(`/admin/users/${id}`, { method: 'DELETE', auth: true }),
};

export { getToken };
