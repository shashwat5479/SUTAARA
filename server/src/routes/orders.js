import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { getInvoice, getPackingSlip, getShippingLabel, getPrintAll } from '../controllers/documentController.js';
import { protect, admin } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);

router.get('/:id/invoice', protect, getInvoice);
router.get('/:id/packing-slip', protect, admin, getPackingSlip);
router.get('/:id/shipping-label', protect, admin, getShippingLabel);
router.get('/:id/print-all', protect, admin, getPrintAll);

export default router;
