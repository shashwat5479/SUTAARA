import { Router } from 'express';
import {
  getProductReviews,
  getDiaries,
  canReview,
  createReview,
  getAllReviews,
  setApproval,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/auth.js';

const router = Router();

router.get('/diaries', getDiaries);                       // public — 5-star wall
router.get('/product/:productId', getProductReviews);     // public
router.get('/can-review/:productId', protect, canReview);
router.post('/', protect, createReview);
router.get('/', protect, admin, getAllReviews);
router.put('/:id/approve', protect, admin, setApproval);
router.delete('/:id', protect, admin, deleteReview);

export default router;
