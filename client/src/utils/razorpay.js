import { api } from '../api/client.js';

// The script tag in index.html loads this async, so a fast click might beat
// it — this waits for window.Razorpay instead of failing silently.
function waitForRazorpay(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const start = Date.now();
    const check = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(check);
        resolve(window.Razorpay);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        reject(new Error('Payment gateway did not load — check your connection and try again'));
      }
    }, 150);
  });
}

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
