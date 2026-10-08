// Order paperwork — invoice, packing slip, and shipping label as PDFs.
// Pure code, no external API key required (uses pdfkit + qrcode locally).

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PDFDocument as PDFLib } from 'pdf-lib';

const STORE = {
  name: 'Sutaara',
  tagline: 'Rooted in craft. Curated for today',
  address: process.env.STORE_ADDRESS || 'Lucknow, Uttar Pradesh, India',
  email: process.env.STORE_EMAIL || 'support@sutaara.com',
  phone: process.env.STORE_PHONE || '+91 95696 59272',
  website: process.env.STORE_WEBSITE || 'www.sutaara.com',
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

// ---------------------------------------------------------------------------
// Shared layout for the customer-facing paperwork (invoice + packing slip).
// Look: cream banner, pink table header, bordered info boxes.
// NOTE: these documents never show a "total pieces/articles" figure — customers
// only see per-line quantities. The article count lives in the admin panel.
// ---------------------------------------------------------------------------
const C = { ink: '#2a2320', soft: '#6f625b', line: '#d8cbc2', cream: '#f7efe9', pink: '#ffb3bf', rose: '#b0305a' };
const L = 40;
const R = 555;
const W = R - L;
const MID = L + W / 2;
const PAGE_BOTTOM = 790;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

const isPaidOrder = (o) => o.isPaid || o.paymentStatus === 'paid';
const payMethodLabel = (o) => (o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online');
const payStatusLabel = (o) => (isPaidOrder(o) ? 'PAID' : o.paymentMethod === 'cod' ? 'PAY ON DELIVERY' : 'PENDING');
const amountDueLabel = (o) => (isPaidOrder(o) ? 'Nil' : inr(o.totalPrice));

function banner(doc, title, subLines = []) {
  const y = 40;
  const h = 88;
  doc.rect(L, y, W, h).fill(C.cream);
  doc.moveTo(MID, y + 12).lineTo(MID, y + h - 12).strokeColor(C.line).lineWidth(0.8).stroke();

  doc.font('Helvetica-Bold').fontSize(24).fillColor(C.rose).text('SUTAARA', L + 14, y + 14, { lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(C.soft);
  doc.text(STORE.tagline, L + 14, y + 46, { lineBreak: false });
  doc.text('Lucknow, UP', L + 14, y + 66, { lineBreak: false });

  doc.font('Helvetica-Bold').fontSize(20).fillColor(C.ink)
    .text(title, MID + 14, y + 16, { width: W / 2 - 28, align: 'right', lineBreak: false });
  doc.font('Helvetica').fontSize(8.5).fillColor(C.soft);
  subLines.forEach((t, i) => doc.text(t, MID + 14, y + 52 + i * 12, { width: W / 2 - 28, align: 'right', lineBreak: false }));
  doc.y = y + h + 20;
  doc.x = L;
}

function heading(doc, text) {
  if (doc.y > PAGE_BOTTOM - 80) doc.addPage();
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.ink).text(text, L, doc.y, { lineBreak: false });
  doc.y += 22;
}

// A line is { label?, value, bold?, size?, color?, gap? }
function lineText(l) {
  return l.label ? `${l.label}  ${l.value}` : String(l.value);
}
function drawLines(doc, lines, x, y, width, dry) {
  let cy = y;
  lines.forEach((l) => {
    const size = l.size || 9.5;
    if (l.gap) cy += l.gap;
    doc.font(l.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size);
    const h = doc.heightOfString(lineText(l), { width }) + 5;
    if (!dry) {
      if (l.label) {
        doc.font('Helvetica-Bold').fontSize(size).fillColor(C.soft).text(`${l.label}  `, x, cy, { width, continued: true });
        doc.font('Helvetica-Bold').fillColor(l.color || C.ink).text(String(l.value), { width });
      } else {
        doc.font(l.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(l.color || C.ink).text(String(l.value), x, cy, { width });
      }
    }
    cy += h;
  });
  return cy;
}

function infoBox(doc, left, right) {
  const y = doc.y;
  const pad = 10;
  const colW = W / 2 - pad * 2;
  const hl = drawLines(doc, left, L + pad, y + pad, colW, true) - y;
  const hr = drawLines(doc, right, MID + pad, y + pad, colW, true) - y;
  const h = Math.max(hl, hr) + pad;
  if (y + h > PAGE_BOTTOM) { doc.addPage(); return infoBox(doc, left, right); }
  doc.rect(L, y, W, h).strokeColor(C.line).lineWidth(0.8).stroke();
  doc.moveTo(MID, y).lineTo(MID, y + h).stroke();
  drawLines(doc, left, L + pad, y + pad, colW, false);
  drawLines(doc, right, MID + pad, y + pad, colW, false);
  doc.y = y + h + 18;
  doc.x = L;
}

function deliveryLines(order, { forInvoice = false } = {}) {
  const lines = [{ value: 'Delivery details', bold: true, size: 9.5, color: C.rose }];
  const known = order.courierName || order.awbNumber || order.shippedAt;
  if (forInvoice && !known) {
    lines.push({ value: 'Courier and tracking details are shared once your order ships.', size: 9, color: C.soft, gap: 4 });
    return lines;
  }
  const blank = '________________';
  lines.push({ label: 'Courier', value: order.courierName || blank, size: 9, gap: 4 });
  lines.push({ label: 'AWB', value: order.awbNumber || blank, size: 9 });
  lines.push({ label: 'Ship date', value: order.shippedAt ? fmtDate(order.shippedAt) : blank, size: 9 });
  return lines;
}

function shipToLines(order) {
  return [
    { value: order.fullName, bold: true, size: 11 },
    { value: [order.line1, order.line2].filter(Boolean).join(', '), gap: 6 },
    { value: `${order.city}, ${order.state} ${order.pincode}` },
    { value: `Phone ${order.phone}` },
  ];
}

// cols: [{ label, w, align }]; rows: arrays of cell values. A cell may be
// { box: true } to draw an empty tick-box (used for the "Packed" column).
function drawTable(doc, cols, rows) {
  const total = cols.reduce((n, c) => n + c.w, 0);
  const scale = W / total;
  const widths = cols.map((c) => c.w * scale);

  const head = () => {
    const y = doc.y;
    doc.rect(L, y, W, 28).fill(C.pink);
    let x = L;
    cols.forEach((c, i) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.ink)
        .text(c.label, x + 6, y + 10, { width: widths[i] - 12, align: c.headAlign || c.align || 'center', lineBreak: false });
      x += widths[i];
    });
    doc.y = y + 28;
  };
  head();

  rows.forEach((row) => {
    let rh = 34;
    cols.forEach((c, i) => {
      if (c.bold) {
        doc.font('Helvetica-Bold').fontSize(9.5);
        rh = Math.max(rh, doc.heightOfString(String(row[i]), { width: widths[i] - 16 }) + 22);
      }
    });
    if (doc.y + rh > PAGE_BOTTOM) { doc.addPage(); head(); }
    const y = doc.y;
    let x = L;
    cols.forEach((c, i) => {
      doc.rect(x, y, widths[i], rh).strokeColor(C.line).lineWidth(0.8).stroke();
      const cell = row[i];
      if (cell && cell.box) {
        doc.rect(x + widths[i] / 2 - 5, y + rh / 2 - 5, 10, 10).strokeColor(C.soft).lineWidth(1).stroke();
      } else {
        const align = c.align || 'center';
        doc.font(c.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(c.bold ? 9.5 : 9).fillColor(C.ink);
        const th = doc.heightOfString(String(cell), { width: widths[i] - 16 });
        doc.text(String(cell), x + 8, y + (rh - th) / 2, { width: widths[i] - 16, align });
      }
      x += widths[i];
    });
    doc.y = y + rh;
  });
  doc.y += 22;
  doc.x = L;
}

function returnsBlock(doc, closing) {
  if (doc.y > PAGE_BOTTOM - 120) doc.addPage();
  heading(doc, 'Returns and support');
  doc.font('Helvetica').fontSize(8.5).fillColor(C.ink).text(
    `Please inspect your order on delivery. If an item is damaged, defective or incorrect, contact ${STORE.email} or WhatsApp us ` +
      `with your order number, video/photographs immediately. Replacements are subject to Sutaara's return policy published on ` +
      `${STORE.website}. Discounted items are not eligible for return or exchange.`,
    L, doc.y, { width: W }
  );
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fillColor(C.rose)
    .text(`For help, write to ${STORE.email} or visit ${STORE.website}.`, L, doc.y, { width: W });
  doc.moveDown(1.2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.rose).text(closing, L, doc.y, { width: W, align: 'center' });
}

export async function buildInvoicePDF(order) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  banner(doc, 'INVOICE', [order.invoiceNumber || '', STORE.gstin ? `GSTIN: ${STORE.gstin}` : ''].filter(Boolean));

  heading(doc, 'Order and invoice details');
  infoBox(
    doc,
    [
      { label: 'Invoice number', value: order.invoiceNumber || '-', bold: true },
      { label: 'Order number', value: order.orderNumber, bold: true },
      { label: 'Invoice date', value: fmtDate(order.invoicedAt || order.createdAt) },
    ],
    [
      { label: 'Payment method', value: payMethodLabel(order) },
      { label: 'Amount due', value: amountDueLabel(order) },
      { label: 'Payment status', value: payStatusLabel(order) },
    ]
  );

  heading(doc, 'Billed and shipped to');
  infoBox(doc, shipToLines(order), deliveryLines(order, { forInvoice: true }));

  heading(doc, 'Items');
  drawTable(
    doc,
    [
      { label: 'No', w: 40 },
      { label: 'Item', w: 235, align: 'left', headAlign: 'left', bold: true },
      { label: 'Qty', w: 50 },
      { label: 'Price', w: 95, align: 'right', headAlign: 'right' },
      { label: 'Amount', w: 95, align: 'right', headAlign: 'right' },
    ],
    order.items.map((it, i) => [i + 1, it.name, it.qty, inr(it.price), inr(it.price * it.qty)])
  );

  // Totals (right-aligned block)
  const rows = [['Subtotal', inr(order.itemsPrice)]];
  if (order.discountPrice) rows.push(['Discount', `- ${inr(order.discountPrice)}`]);
  rows.push(['Shipping', order.shippingPrice ? inr(order.shippingPrice) : 'Free']);
  if (order.taxPrice) rows.push(['Tax (GST)', inr(order.taxPrice)]);
  if (doc.y > PAGE_BOTTOM - 40 - rows.length * 20 - 120) doc.addPage();
  const tx = L + W * 0.55;
  const tw = R - tx;
  rows.forEach(([k, v]) => {
    const y = doc.y;
    doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text(k, tx, y, { width: tw / 2, lineBreak: false });
    doc.fillColor(C.ink).text(v, tx + tw / 2, y, { width: tw / 2 - 8, align: 'right', lineBreak: false });
    doc.y = y + 18;
  });
  const ty = doc.y + 2;
  doc.rect(tx, ty, tw, 28).fill(C.pink);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.ink)
    .text('Total', tx + 8, ty + 9, { width: tw / 2, lineBreak: false })
    .text(inr(order.totalPrice), tx + tw / 2, ty + 9, { width: tw / 2 - 8, align: 'right', lineBreak: false });
  doc.y = ty + 28 + 28;
  doc.x = L;

  returnsBlock(doc, 'Thank you for choosing Sutaara');
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(C.soft)
    .text('This is a system-generated invoice.', L, doc.y + 8, { width: W, align: 'center' });

  return pdfToBuffer(doc);
}

export async function buildPackingSlipPDF(order) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  banner(doc, 'PACKING SLIP', ['Not a tax invoice']);

  heading(doc, 'Order and shipment details');
  infoBox(
    doc,
    [
      { label: 'Order number', value: order.orderNumber, bold: true },
      { label: 'Order date', value: fmtDate(order.createdAt) },
      { label: 'Package', value: '1 of 1' },
    ],
    [
      { label: 'Payment method', value: payMethodLabel(order) },
      { label: 'Amount due', value: amountDueLabel(order) },
      { label: 'Payment status', value: payStatusLabel(order) },
    ]
  );

  heading(doc, 'Ship to');
  infoBox(doc, shipToLines(order), deliveryLines(order));

  heading(doc, 'Items in this package');
  drawTable(
    doc,
    [
      { label: 'No', w: 60 },
      { label: 'Item', w: 180, align: 'left', headAlign: 'left', bold: true },
      { label: 'Qty', w: 90 },
      { label: 'Packed', w: 90 },
    ],
    order.items.map((it, i) => [i + 1, it.name, it.qty, { box: true }])
  );

  returnsBlock(doc, 'Thank you for choosing Sutaara');
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
