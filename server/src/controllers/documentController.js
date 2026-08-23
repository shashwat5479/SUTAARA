import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { buildInvoicePDF, buildPackingSlipPDF, buildShippingLabelPDF, buildPrintAllPDF } from '../services/documents.js';

async function loadOrder(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const owns = order.userId === req.user.id;
  if (!owns && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not your order');
  }
  return order;
}

const send = (res, buffer, filename) => {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
  });
  res.send(buffer);
};

// GET /api/orders/:id/invoice
export const getInvoice = asyncHandler(async (req, res) => {
  const order = await loadOrder(req, res);
  if (!order.invoiceNumber) {
    res.status(409);
    throw new Error('Invoice has not been generated yet — order must be confirmed first');
  }
  send(res, await buildInvoicePDF(order), `${order.orderNumber}-invoice.pdf`);
});

// GET /api/orders/:id/packing-slip (admin)
export const getPackingSlip = asyncHandler(async (req, res) => {
  const order = await loadOrder(req, res);
  send(res, await buildPackingSlipPDF(order), `${order.orderNumber}-packing-slip.pdf`);
});

// GET /api/orders/:id/shipping-label (admin)
export const getShippingLabel = asyncHandler(async (req, res) => {
  const order = await loadOrder(req, res);
  send(res, await buildShippingLabelPDF(order), `${order.orderNumber}-label.pdf`);
});

// GET /api/orders/:id/print-all (admin) — invoice + label + packing slip combined
export const getPrintAll = asyncHandler(async (req, res) => {
  const order = await loadOrder(req, res);
  send(res, await buildPrintAllPDF(order), `${order.orderNumber}-print-all.pdf`);
});
