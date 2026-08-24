import { Router } from 'express';
import {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';
import { protect, admin } from '../middleware/auth.js';

const router = Router();

// Optionally attach the signed-in user without requiring login — booking the
// studio should work for guests too.
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization?.startsWith('Bearer ')) return protect(req, res, next);
  next();
};

router.post('/', optionalAuth, createAppointment);
router.get('/mine', protect, getMyAppointments);
router.get('/', protect, admin, getAllAppointments);
router.put('/:id/status', protect, admin, updateAppointmentStatus);

export default router;