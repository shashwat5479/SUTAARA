import { Router } from 'express';
import {
  listStaff,
  listAllAccounts,
  createStaff,
  changeRole,
  resetPassword,
  deleteStaff,
} from '../controllers/adminUserController.js';
import { protect, superAdminOnly, adminOrAbove } from '../middleware/auth.js';

const router = Router();

// Read-only, for any admin — viewing the customer/account list isn't the
// same sensitivity as creating/editing staff accounts below.
router.get('/all-accounts', protect, adminOrAbove, listAllAccounts);

// Every other route here is super-admin only — managing staff/admin accounts.
router.get('/', protect, superAdminOnly, listStaff);
router.post('/', protect, superAdminOnly, createStaff);
router.put('/:id/role', protect, superAdminOnly, changeRole);
router.put('/:id/password', protect, superAdminOnly, resetPassword);
router.delete('/:id', protect, superAdminOnly, deleteStaff);

export default router;
