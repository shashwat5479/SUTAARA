export const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const discountPct = (mrp, price) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const colorHex = (name = '') => {
  const map = {
    red: '#8c2a2e',
    pink: '#c98a9c',
    lavender: '#b7a7cf',
    maroon: '#5e1f26',
    gold: '#b08a4b',
    turquoise: '#4c9a9a',
    multicolour: 'conic-gradient(#e0b23c,#c98a9c,#e08a3c,#4c9a9a,#e0b23c)',
  };
  const key = name.toLowerCase();
  return map[key] || '#cbb99a';
};

export const WHATSAPP_NUMBER = '919569005501';

// Where a Sutaara Edit should send the shopper. An edit that has its own
// products opens its dedicated page (/edits/:id) showing exactly those
// products; an edit with none falls back to its custom link (e.g. a filtered
// shop view or /story#styling-edit), or /story.
export const editPath = (edit) =>
  edit && edit.products && edit.products.length > 0
    ? `/edits/${edit._id || edit.id}`
    : (edit && edit.link) || '/story';
