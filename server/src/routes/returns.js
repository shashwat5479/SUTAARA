import { Router } from 'express';
import {
  submitReturnRequest,
  getReturnRequest,
  listReturnRequests,
  markUnderReview,
  approveReturn,
  rejectReturn,
  initiateRefund,
  markRefundSettled,
  getUploadUrl,
} from '../controllers/returnController.js';
import { protect, staffOrAbove } from '../middleware/auth.js';

const router = Router();

// Upload URL for return photos
router.get('/upload-url', protect, getUploadUrl);

// Admin — list all return requests
router.get('/', protect, staffOrAbove, listReturnRequests);

// Customer — submit a return request for their order
router.post('/:orderId', protect, submitReturnRequest);

// Customer or admin — view the return request for an order
router.get('/:orderId', protect, getReturnRequest);

// Admin only below
router.patch('/:orderId/review', protect, staffOrAbove, markUnderReview);
router.post('/:orderId/approve', protect, staffOrAbove, approveReturn);
router.post('/:orderId/reject', protect, staffOrAbove, rejectReturn);
router.post('/:orderId/refund', protect, staffOrAbove, initiateRefund);
router.post('/:orderId/mark-settled', protect, staffOrAbove, markRefundSettled);

export default router;
