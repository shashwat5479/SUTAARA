import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  yahooAuthUrl,
  yahooCallback,
  outlookAuthUrl,
  outlookCallback,
  demoLogin,
  verifyEmail,
  resendCode,
  getMe,
  updateMe,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimitDb.js';

const router = Router();

router.post('/register', limits.register, register);
router.post('/login', ...limits.login, login);
router.post('/google', googleLogin);
router.get('/yahoo', yahooAuthUrl);
router.get('/yahoo/callback', yahooCallback);
router.get('/outlook', outlookAuthUrl);
router.get('/outlook/callback', outlookCallback);
router.post('/demo-login', limits.demo, demoLogin);
router.post('/verify-email', limits.verifyCode, verifyEmail);
router.post('/resend-code', ...limits.sendCode, resendCode);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

export default router;