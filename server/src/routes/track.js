import { Router } from 'express';
import { trackVisit, trackEvent } from '../controllers/trackController.js';

const router = Router();
router.post('/visit', trackVisit);
router.post('/event', trackEvent);

export default router;
