// Order paperwork — invoice, packing slip, and shipping label as PDFs.
// Pure code, no external API key required (uses pdfkit + qrcode locally).

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PDFDocument as PDFLib } from 'pdf-lib';

const STORE = {
  name: 'Sutaara',
  tagline: 'Handcrafted Indian Ethnicwear',
  address: process.env.STORE_ADDRESS || 'Lucknow, Uttar Pradesh, India',
  email: process.env.STORE_EMAIL || 'hello@sutaara.in',
  // GST is optional — leave STORE_GSTIN unset until the business is registered.
  gstin: process.env.STORE_GSTIN || '',
};

const inr = (paise) => `Rs. ${Number(paise || 0).toLocaleString('en-IN')}`;

function pdfToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

function header(doc, title) {
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#7a1f2b').text(STORE.name, { continued: true });
  doc.font('Helvetica').fontSize(9).fillColor('#555').text(`   ${STORE.tagline}`, { align: 'left' });
  doc.moveDown(0.2);
  doc.fontSize(9).fillColor('#555').text(STORE.address);
  if (STORE.gstin) doc.text(`GSTIN: ${STORE.gstin}`);
  doc.moveDown(0.6);
  doc.strokeColor('#d9b45c').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#222').text(title);
  doc.moveDown(0.4);
}

export async function buildInvoicePDF(order) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  header(doc, `Invoice ${order.invoiceNumber || ''}`);

  doc.font('Helvetica').fontSize(10).fillColor('#333');
  doc.text(`Order: ${order.orderNumber}`);
  doc.text(`Date: ${new Date(order.invoicedAt || order.createdAt).toLocaleDateString('en-IN')}`);
  doc.text(`Payment method: ${order.paymentMethod.toUpperCase()}${order.isPaid ? ' (paid)' : ' (unpaid)'}`);
  doc.moveDown(0.6);

  doc.font('Helvetica-Bold').text('Billed & shipped to');
  doc.font('Helvetica').text(order.fullName);
  doc.text(order.phone);
  doc.text([order.line1, order.line2].filter(Boolean).join(', '));
  doc.text(`${order.city}, ${order.state} - ${order.pincode}`);
  doc.moveDown(0.8);

  // Table header
  const startY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Item', 50, startY, { width: 230 });
  doc.text('Qty', 285, startY, { width: 40, align: 'right' });
  doc.text('Price', 330, startY, { width: 90, align: 'right' });
  doc.text('Amount', 425, startY, { width: 90, align: 'right' });
  doc.moveDown(0.3);
  doc.strokeColor('#ccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(9);
  order.items.forEach((item) => {
    const y = doc.y;
    doc.text(item.name, 50, y, { width: 230 });
    doc.text(String(item.qty), 285, y, { width: 40, align: 'right' });
    doc.text(inr(item.price), 330, y, { width: 90, align: 'right' });
    doc.text(inr(item.price * item.qty), 425, y, { width: 90, align: 'right' });
    doc.moveDown(0.5);
  });

  doc.moveDown(0.3);
  doc.strokeColor('#ccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.4);

  const totalsX = 330;
  const row = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5);
    doc.text(label, totalsX, doc.y, { width: 90, align: 'right' });
    doc.text(value, 425, doc.y - doc.currentLineHeight(), { width: 90, align: 'right' });
    doc.moveDown(0.35);
  };
  row('Subtotal', inr(order.itemsPrice));
  if (order.discountPrice) row('Discount', `- ${inr(order.discountPrice)}`);
  row('Shipping', order.shippingPrice ? inr(order.shippingPrice) : 'Free');
  if (order.taxPrice) row('Tax (GST)', inr(order.taxPrice));
  row('Total payable', inr(order.totalPrice), true);

  doc.moveDown(1.2);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#777')
    .text('This is a system-generated invoice. For queries write to ' + STORE.email, { align: 'center' });

  return pdfToBuffer(doc);
}

export async function buildPackingSlipPDF(order) {
  const doc = new PDFDocument({ size: 'A5', margin: 36 });
  header(doc, 'Packing Slip');

  doc.font('Helvetica').fontSize(9.5).fillColor('#333');
  doc.text(`Order: ${order.orderNumber}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
  doc.text(`Payment: ${order.paymentMethod === 'cod' ? `COD - ${inr(order.totalPrice)} due` : 'Prepaid'}`);
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').text('Ship to');
  doc.font('Helvetica').text(order.fullName);
  doc.text([order.line1, order.line2].filter(Boolean).join(', '));
  doc.text(`${order.city}, ${order.state} - ${order.pincode}`);
  doc.moveDown(0.6);

  doc.font('Helvetica-Bold').fontSize(9.5).text('Items');
  doc.font('Helvetica').fontSize(9);
  order.items.forEach((item) => {
    doc.text(`- ${item.name}  x${item.qty}`);
  });

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(9.5).text('Return instructions');
  doc.font('Helvetica').fontSize(8.5)
    .text('Unworn items with tags intact can be returned within 7 days of delivery. Start a return from your Sutaara account or write to ' + STORE.email + '.');

  doc.moveDown(1);
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#7a1f2b')
    .text('Thank you for choosing Sutaara — handcrafted with care.', { align: 'center' });

  return pdfToBuffer(doc);
}

export async function buildShippingLabelPDF(order) {
  const doc = new PDFDocument({ size: [288, 432], margin: 14 }); // 4in x 6in label

  doc.font('Helvetica-Bold').fontSize(13).text('SUTAARA', { align: 'left' });
  doc.font('Helvetica').fontSize(7.5).text(STORE.address);
  doc.moveDown(0.4);
  doc.strokeColor('#000').lineWidth(1).moveTo(14, doc.y).lineTo(274, doc.y).stroke();
  doc.moveDown(0.4);

  doc.font('Helvetica-Bold').fontSize(9).text('DELIVER TO');
  doc.font('Helvetica-Bold').fontSize(11).text(order.fullName);
  doc.font('Helvetica').fontSize(9).text(order.phone);
  doc.text([order.line1, order.line2].filter(Boolean).join(', '), { width: 260 });
  doc.font('Helvetica-Bold').fontSize(10).text(`${order.city}, ${order.state} - ${order.pincode}`);
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(8).text(`Order: ${order.orderNumber}`);
  doc.text(`AWB: ${order.awbNumber || 'pending — courier not yet configured'}`);
  doc.text(`Courier: ${order.courierName || '-'}`);
  if (order.paymentMethod === 'cod') {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#7a1f2b').text(`COD: ${inr(order.totalPrice)}`);
    doc.fillColor('#000');
  } else {
    doc.font('Helvetica-Bold').text('PREPAID');
  }
  doc.moveDown(0.6);

  // QR code encodes the order number + AWB so a handheld scanner can look it up
  const qrData = `SUTAARA|${order.orderNumber}|${order.awbNumber || ''}`;
  const qrPng = await QRCode.toBuffer(qrData, { margin: 0, width: 110 });
  doc.image(qrPng, 14, doc.y, { width: 90 });
  doc.font('Helvetica').fontSize(7).text('Return address: ' + STORE.address, 110, doc.y, { width: 160 });

  return pdfToBuffer(doc);
}

// Merge invoice + label + packing slip into one PDF for the admin "Print All" button.
export async function buildPrintAllPDF(order) {
  const [invoiceBuf, labelBuf, slipBuf] = await Promise.all([
    buildInvoicePDF(order),
    buildShippingLabelPDF(order),
    buildPackingSlipPDF(order),
  ]);
  const merged = await PDFLib.create();
  for (const buf of [invoiceBuf, labelBuf, slipBuf]) {
    const src = await PDFLib.load(buf);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return Buffer.from(await merged.save());
}
