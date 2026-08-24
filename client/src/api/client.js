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
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: { status }, auth: true }),

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
};

export { getToken };
