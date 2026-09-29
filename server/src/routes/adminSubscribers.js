import { Router } from 'express';
import { getSubscribers, deleteSubscriber } from '../controllers/subscriberController.js';
import { protect, adminOrAbove } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, adminOrAbove, getSubscribers);
router.delete('/:id', protect, adminOrAbove, deleteSubscriber);

export default router;
