import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrderById, getAllOrders,
  updateOrderStatus, setReturnEligibility, requestReturn,
  getShiprocketStatus, shipWithShiprocket, shipManually, getShippingLabelUrl,
} from '../controllers/orderController.js';
import { getInvoice, getPackingSlip, getShippingLabel, getPrintAll } from '../controllers/documentController.js';
import { protect, admin, staffOrAbove } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/shiprocket/status', protect, staffOrAbove, getShiprocketStatus);
router.get('/', protect, staffOrAbove, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, staffOrAbove, updateOrderStatus);
router.patch('/:id/return-eligibility', protect, staffOrAbove, setReturnEligibility);
router.post('/:id/request-return', protect, requestReturn);
router.post('/:id/ship/shiprocket', protect, staffOrAbove, shipWithShiprocket);
router.post('/:id/ship/manual', protect, staffOrAbove, shipManually);
router.post('/:id/ship/label', protect, staffOrAbove, getShippingLabelUrl);

router.get('/:id/invoice', protect, getInvoice);
router.get('/:id/packing-slip', protect, staffOrAbove, getPackingSlip);
router.get('/:id/shipping-label', protect, staffOrAbove, getShippingLabel);
router.get('/:id/print-all', protect, staffOrAbove, getPrintAll);

export default router;
