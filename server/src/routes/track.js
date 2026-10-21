import { Router } from 'express';
import { trackVisit, trackEvent } from '../controllers/trackController.js';
import { limits } from '../middleware/rateLimitDb.js';

const router = Router();
router.post('/visit', limits.trackVisit, trackVisit);
router.post('/event', limits.trackEvent, trackEvent);

export default router;
