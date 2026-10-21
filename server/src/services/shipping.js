// Shiprocket integration + manual shipping fallback.
//
// HOW IT WORKS:
//   1. Admin clicks "Ship with Shiprocket" → calls createShipment(order)
//      → gets back AWB, courier name, tracking URL
//   2. Admin clicks "Enter tracking manually" → skips this service entirely,
//      saves awbNumber/courierName/trackingUrl directly (see orderController)
//
// ENV VARS (set in Vercel + local .env):
//   SHIPROCKET_EMAIL    — your Shiprocket login email
//   SHIPROCKET_PASSWORD — your Shiprocket login password
//   SHIPROCKET_CHANNEL_ID — (optional) your Shiprocket channel ID
//   SHIPROCKET_PICKUP_LOCATION — pickup location name from your Shiprocket account (default "Primary")

import { prisma } from '../config/db.js';
import { attachSkus } from '../utils/orderSku.js';

const SR_EMAIL    = process.env.SHIPROCKET_EMAIL    || '';
const SR_PASSWORD = process.env.SHIPROCKET_PASSWORD || '';
const SR_CHANNEL  = process.env.SHIPROCKET_CHANNEL_ID || '';
const SR_PICKUP   = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
const SR_BASE     = 'https://apiv2.shiprocket.in/v1/external';

export const isShiprocketConfigured = () => Boolean(SR_EMAIL && SR_PASSWORD);

// ─── Token management ────────────────────────────────────────────────────────
// Shiprocket tokens last 10 days. We store the token and its expiry in the DB
// (KV model) so serverless functions can share it across cold starts without
// re-authenticating on every request.
async function getToken() {
  try {
    // Try to find a cached, still-valid token
    const stored = await prisma.appKV.findUnique({ where: { key: 'shiprocket_token' } });
    if (stored && stored.expiresAt && stored.expiresAt > new Date()) {
      return stored.value;
    }
  } catch {
    // KV table might not exist yet — fall through to fresh auth
  }

  // Authenticate and get a fresh token
  const res = await fetch(`${SR_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SR_EMAIL, password: SR_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Shiprocket auth failed: ${data.message || res.status}`);
  }

  const expiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000); // 9 days
  try {
    await prisma.appKV.upsert({
      where: { key: 'shiprocket_token' },
      create: { key: 'shiprocket_token', value: data.token, expiresAt },
      update: { value: data.token, expiresAt },
    });
  } catch {
    // Non-fatal — we still have the token for this request
  }
  return data.token;
}

function srHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Pickup location ─────────────────────────────────────────────────────────
// Shiprocket only accepts the exact nickname of a pickup address saved in the
// account. Rather than trusting the env var blindly, ask Shiprocket for the
// real list and use the one matching SHIPROCKET_PICKUP_LOCATION (any case /
// spacing); if none matches, fall back to the account's first pickup address.
async function resolvePickupLocation(token) {
  try {
    const res = await fetch(`${SR_BASE}/settings/company/pickup`, { headers: srHeaders(token) });
    const data = await res.json();
    const list = (data?.data?.shipping_address || [])
      .map((a) => String(a.pickup_location || '').trim())
      .filter(Boolean);
    if (list.length) {
      const want = SR_PICKUP.trim().toLowerCase();
      return list.find((n) => n.toLowerCase() === want) || list[0];
    }
  } catch {
    // fall through to the env value
  }
  return SR_PICKUP.trim();
}

// ─── Create a Shiprocket order + auto-assign the best courier ────────────────
export async function createShipment(order) {
  if (!isShiprocketConfigured()) {
    throw new Error('Shiprocket is not configured — set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in your environment variables');
  }

  const token = await getToken();
  const pickupLocation = await resolvePickupLocation(token);
  await attachSkus(order);

  // Build the Shiprocket order payload from our Order object.
  // NOTE: the address is stored FLAT on the order (fullName, phone, line1,
  // line2, city, state, pincode) — there is no nested shippingAddress.
  const digits = (v) => String(v || '').replace(/\D/g, '');
  const phone = digits(order.phone).slice(-10);            // Shiprocket wants 10 digits, no +91
  const pincode = digits(order.pincode).slice(0, 6);
  const nameParts = String(order.fullName || 'Customer').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ');

  const payload = {
    order_id: order.orderNumber || order.id,
    order_date: new Date(order.createdAt).toISOString().split('T')[0],
    pickup_location: pickupLocation,
    ...(SR_CHANNEL && { channel_id: SR_CHANNEL }),
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: order.line1 || '',
    billing_address_2: order.line2 || '',
    billing_city: order.city || '',
    billing_pincode: pincode,
    billing_state: order.state || '',
    billing_country: 'India',
    billing_email: order.user?.email || '',
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: (order.items || []).map((item) => ({
      name: item.name,
      sku: item.sku || item.slug || item.id,
      units: item.qty,
      selling_price: item.price,
    })),
    payment_method: order.isPaid || order.paymentMethod === 'online' ? 'Prepaid' : 'COD',
    sub_total: order.totalPrice,
    length: 30, // cm — update these to match your actual package sizes
    breadth: 20,
    height: 5,
    weight: 0.5, // kg
  };

  const createRes = await fetch(`${SR_BASE}/orders/create/adhoc`, {
    method: 'POST',
    headers: srHeaders(token),
    body: JSON.stringify(payload),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.shipment_id) {
    throw new Error(`Shiprocket order creation failed: ${createData.message || ""} ${createData.errors ? JSON.stringify(createData.errors) : JSON.stringify(createData)}`);
  }

  const shipmentId = createData.shipment_id;

  // Auto-assign the cheapest available courier
  const assignRes = await fetch(`${SR_BASE}/courier/assign/awb`, {
    method: 'POST',
    headers: srHeaders(token),
    body: JSON.stringify({ shipment_id: String(shipmentId) }),
  });
  const assignData = await assignRes.json();
  const awbNumber  = assignData?.response?.data?.awb_code || assignData?.awb_code;
  const courierName = assignData?.response?.data?.courier_name || assignData?.courier_name || 'Shiprocket';

  if (!awbNumber) {
    throw new Error(`Shiprocket AWB assignment failed: ${JSON.stringify(assignData)}`);
  }

  // Request pickup
  try {
    await fetch(`${SR_BASE}/courier/generate/pickup`, {
      method: 'POST',
      headers: srHeaders(token),
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });
  } catch {
    // Non-fatal — pickup can be re-requested from Shiprocket dashboard
  }

  const trackingUrl = `https://shiprocket.co/tracking/${awbNumber}`;
  const estDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // +5 days estimate

  return { awbNumber, courierName, trackingUrl, estDelivery, shipmentId: String(shipmentId) };
}

// ─── Generate a Shiprocket shipping label PDF ────────────────────────────────
export async function getShiprocketLabel(shipmentId) {
  const token = await getToken();
  const res = await fetch(`${SR_BASE}/courier/generate/label`, {
    method: 'POST',
    headers: srHeaders(token),
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
  const data = await res.json();
  return data?.label_url || null;
}

// ─── Tracking status (for delivery-partner webhook path) ─────────────────────
export async function getTrackingStatus(awbNumber) {
  const token = await getToken();
  const res = await fetch(`${SR_BASE}/courier/track/awb/${awbNumber}`, {
    headers: srHeaders(token),
  });
  const data = await res.json();
  return data?.tracking_data?.shipment_track?.[0] || null;
}
