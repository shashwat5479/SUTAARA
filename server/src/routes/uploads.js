import { Router } from 'express';
import { signUpload } from '../controllers/uploadController.js';
import { protect, staffOrAbove } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimitDb.js';

const router = Router();
router.post('/sign', protect, staffOrAbove, limits.upload, signUpload);

export default router;
