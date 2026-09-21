import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect, adminOrAbove } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, adminOrAbove, getAnalytics);

export default router;
