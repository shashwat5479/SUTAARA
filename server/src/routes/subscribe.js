import { Router } from 'express';
import { subscribe } from '../controllers/subscriberController.js';
import { limits } from '../middleware/rateLimitDb.js';

const router = Router();

router.post('/', limits.subscribe, subscribe);

export default router;
