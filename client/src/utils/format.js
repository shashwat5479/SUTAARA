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

export const WHATSAPP_NUMBER = '919876543210'; // TODO: replace with Sutaara's real number
