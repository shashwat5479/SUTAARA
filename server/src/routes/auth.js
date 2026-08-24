import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  demoLogin,
  verifyEmail,
  resendCode,
  getMe,
  updateMe,
  getAddresses,
  addAddress,
  deleteAddress,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/demo-login', demoLogin);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

export default router;