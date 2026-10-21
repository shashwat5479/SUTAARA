// SKU lookup for order lines.
//
// OrderItem rows only store name/slug/price/qty, so the SKU is read from the
// live Product row. Every place that prints order lines (invoice, packing
// slip, shipping label, e-mails, admin screens, courier payload) goes through
// this one helper so the SKU is always present and always looked up the same
// way — one batched query per order, never one per item.
import { prisma } from '../config/db.js';

// Returns the same order object with `sku` set on each item. Items that
// already carry a SKU are left alone; if nothing is missing no query is made.
// Never throws: a lookup failure must not break an invoice, label or e-mail,
// so on error the items simply keep an empty SKU.
export async function attachSkus(order) {
  const items = order && Array.isArray(order.items) ? order.items : null;
  if (!items || !items.length) return order;
  const missing = items.filter((i) => !i.sku && i.productId);
  if (!missing.length) return order;
  try {
    const ids = [...new Set(missing.map((i) => i.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, sku: true } });
    const byId = new Map(products.map((p) => [p.id, p.sku || '']));
    order.items = items.map((i) => (i.sku ? i : { ...i, sku: byId.get(i.productId) || '' }));
  } catch (err) {
    console.error('[sku] lookup failed:', err.message);
  }
  return order;
}

// Same thing for a list of orders, with a single query for all of them.
export async function attachSkusMany(orders) {
  const list = Array.isArray(orders) ? orders : [];
  const ids = [...new Set(list.flatMap((o) => (o.items || []).filter((i) => !i.sku && i.productId).map((i) => i.productId)))];
  if (!ids.length) return orders;
  try {
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, sku: true } });
    const byId = new Map(products.map((p) => [p.id, p.sku || '']));
    list.forEach((o) => {
      o.items = (o.items || []).map((i) => (i.sku ? i : { ...i, sku: byId.get(i.productId) || '' }));
    });
  } catch (err) {
    console.error('[sku] lookup failed:', err.message);
  }
  return orders;
}
