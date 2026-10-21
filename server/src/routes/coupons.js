import { Router } from 'express';
import { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon, generateCode } from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimitDb.js';

const router = Router();

router.post('/validate', protect, limits.coupon, validateCoupon);
router.get('/generate', protect, admin, generateCode);
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;
