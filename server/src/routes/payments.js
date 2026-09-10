import { Router } from 'express';
import {
  getRazorpayKey,
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// The webhook route is intentionally NOT here — it needs the raw request
// body (not JSON-parsed) to verify Razorpay's signature, so it's wired
// directly in app.js, before the global express.json() middleware.

router.get('/razorpay/key', getRazorpayKey);
router.post('/razorpay/orders/:orderId', protect, createPaymentOrder);
router.post('/razorpay/verify', protect, verifyPayment);
router.post('/razorpay/failure', protect, recordPaymentFailure);

export default router;
