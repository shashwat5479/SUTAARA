// Pluggable shipping/courier provider.
//
// NEEDS AN API KEY to do anything real: set SHIPPING_PROVIDER + SHIPPING_API_KEY
// in server/.env once you have a Shiprocket / Delhivery / Shadowfax account.
// Until then this falls back to a local mock so the rest of the order
// automation (invoice, packing slip, status flow) can be built and demoed
// without a courier contract in place.
//
// To wire up a real provider, implement createShipment() below to call
// their REST API and return { awbNumber, courierName, trackingUrl, estDelivery }.

const PROVIDER = process.env.SHIPPING_PROVIDER || 'mock';
const API_KEY = process.env.SHIPPING_API_KEY || '';

export function shippingConfigured() {
  return PROVIDER !== 'mock' && Boolean(API_KEY);
}

export async function createShipment(order) {
  if (!shippingConfigured()) {
    // Mock AWB so the label/tracking UI has something to render in dev.
    const awbNumber = `MOCK${Date.now().toString().slice(-10)}`;
    const est = new Date();
    est.setDate(est.getDate() + 5);
    return {
      awbNumber,
      courierName: 'Sutaara Local Courier (mock — no API key configured)',
      trackingUrl: null,
      estDelivery: est,
    };
  }

  // --- Real integration goes here, e.g. for Shiprocket: ---
  // const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ /* map `order` to their payload */ }),
  // });
  // const data = await res.json();
  // return { awbNumber: data.awb_code, courierName: data.courier_name, trackingUrl: data.tracking_url, estDelivery: ... };

  throw new Error(`Shipping provider "${PROVIDER}" is not implemented yet`);
}
