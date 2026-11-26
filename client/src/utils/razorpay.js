import { api } from '../api/client.js';

// Razorpay's script is only needed at payment time, so it is loaded on demand
// (and warmed up when the checkout page opens) instead of on every page view.
let rzpPromise;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!rzpPromise) {
    rzpPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => resolve(window.Razorpay);
      s.onerror = () => { rzpPromise = null; reject(new Error('Payment gateway did not load — check your connection and try again')); };
      document.head.appendChild(s);
    });
  }
  return rzpPromise;
}
const waitForRazorpay = () => loadRazorpay();

// Creates a Razorpay order for an existing Sutaara order and opens the
// Checkout modal. Used both at initial checkout and for a "retry payment"
// action on an order whose earlier attempt failed — either way it's the
// same order id, just a fresh attempt.
//
// Resolves to { ok: true, order } on a verified success, or
// { ok: false, message, dismissed? } otherwise. Never throws — callers
// don't need a try/catch around the payment part specifically.
export async function payForOrder(sutaaraOrder, { customerEmail } = {}) {
  let rp;
  try {
    rp = await api.createPaymentOrder(sutaaraOrder._id);
  } catch (err) {
    return { ok: false, message: err.message };
  }

  return new Promise(async (resolve) => {
    let Razorpay;
    try {
      Razorpay = await waitForRazorpay();
    } catch (err) {
      resolve({ ok: false, message: err.message });
      return;
    }

    const rzp = new Razorpay({
      key: rp.keyId,
      amount: rp.amount,
      currency: rp.currency,
      name: 'Sutaara',
      description: `Order ${rp.orderNumber}`,
      order_id: rp.razorpayOrderId,
      prefill: { name: rp.name, contact: rp.phone, email: customerEmail },
      theme: { color: '#8a1f26' },
      handler: async (response) => {
        try {
          const verified = await api.verifyPayment({
            orderId: sutaaraOrder._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve({ ok: true, order: verified });
        } catch (err) {
          resolve({ ok: false, message: err.message });
        }
      },
      modal: {
        ondismiss: async () => {
          try {
            await api.recordPaymentFailure({
              orderId: sutaaraOrder._id,
              razorpay_order_id: rp.razorpayOrderId,
              description: 'Checkout closed before completing payment',
            });
          } catch {}
          resolve({ ok: false, dismissed: true });
        },
      },
    });
    rzp.on('payment.failed', async (response) => {
      try {
        await api.recordPaymentFailure({
          orderId: sutaaraOrder._id,
          razorpay_order_id: response.error.metadata?.order_id || rp.razorpayOrderId,
          code: response.error.code,
          description: response.error.description,
        });
      } catch {}
      resolve({ ok: false, message: response.error.description || 'Payment failed' });
    });
    rzp.open();
  });
}
