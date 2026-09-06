import { Router } from 'express';
import { getNotificationSettings, saveNotificationSettings } from '../controllers/notificationController.js';
import { protect, superAdminOnly } from '../middleware/auth.js';

const router = Router();
router.get('/', protect, superAdminOnly, getNotificationSettings);
router.put('/', protect, superAdminOnly, saveNotificationSettings);
export default router;
