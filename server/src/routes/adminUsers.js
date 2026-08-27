import { Router } from 'express';
import {
  listStaff,
  createStaff,
  changeRole,
  resetPassword,
  deleteStaff,
} from '../controllers/adminUserController.js';
import { protect, superAdminOnly } from '../middleware/auth.js';

const router = Router();

// Every route here is super-admin only — managing staff/admin accounts.
router.get('/', protect, superAdminOnly, listStaff);
router.post('/', protect, superAdminOnly, createStaff);
router.put('/:id/role', protect, superAdminOnly, changeRole);
router.put('/:id/password', protect, superAdminOnly, resetPassword);
router.delete('/:id', protect, superAdminOnly, deleteStaff);

export default router;
