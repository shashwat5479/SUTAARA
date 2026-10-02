// Sutaara filter taxonomy
// ---------------------------------------------------------------------------
// Products store fabric / occasion / colour as free text ("Kota Silk",
// "Work events, Office wear, cultural gatherings…", "Lavender, Mustard").
// Listing every distinct string in the shop sidebar meant 500 products could
// produce 500 near-duplicate filter rows, and most colour swatches fell back
// to the same beige because only 7 colour names had a hex value.
//
// This module maps that free text onto a SMALL, FIXED set of families, so:
//   • the sidebar stays short no matter how many products exist
//   • a newly added product is sorted into the right filters automatically
//   • every colour swatch is the real colour (not a default beige)
//
// NOTE: client/src/utils/taxonomy.js is an identical copy (used for the admin
// live preview). If you edit one, copy it to the other.

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// ---------------------------------------------------------------------------
// FABRIC — a product can belong to several (Kota Silk → Kota + Silk)
// `match` entries are regex sources tested on normalised text, anchored so
// "mul" never matches inside "multi".
// ---------------------------------------------------------------------------
export const FABRICS = [
  { value: 'Silk', match: ['silk', 'banarasi', 'benarasi', 'kanjeevaram', 'kanjivaram', 'kanchipuram', 'tussar', 'tussore', 'mashru', 'patola'] },
  { value: 'Cotton', match: ['cotton', 'mulmul', 'mul', 'mal', 'khadi', 'khaadi', 'voile', 'cambric'] },
  { value: 'Chanderi', match: ['chanderi'] },
  { value: 'Kota', match: ['kota', 'kota doria'] },
  { value: 'Maheshwari', match: ['maheshwari'] },
  { value: 'Linen', match: ['linen'] },
  { value: 'Chiffon', match: ['chiffon'] },
  { value: 'Crepe Georgette', aliases: ['Crepe', 'Georgette'], match: ['crepe', 'crape', 'georgette'] },
  { value: 'Organza', match: ['organza'] },
  { value: 'Tissue', match: ['tissue'] },
  { value: 'Modal', match: ['modal'] },
  { value: 'Satin', match: ['satin'] },
  { value: 'Velvet', match: ['velvet'] },
  { value: 'Corduroy', match: ['corduroy'] },
  { value: 'Woollen', aliases: ['Wool', 'Woolen'], match: ['woollen', 'woolen', 'wool', 'pashmina'] },
];

// ---------------------------------------------------------------------------
// OCCASION — long sentences collapse into a handful of occasions.
// ---------------------------------------------------------------------------
export const OCCASIONS = [
  { value: 'Wedding', label: 'Wedding & Receptions', match: ['wedding\\w*', 'reception\\w*', 'sangeet', 'engagement', 'bridal', 'bride\\w*'] },
  { value: 'Festive', label: 'Festive & Pujas', aliases: ['Festival'], match: ['festiv\\w*', 'festival\\w*', 'puja\\w*', 'pooja\\w*', 'diwali', 'navratri', 'karwa chauth', 'teej', 'eid', 'family functions?'] },
  { value: 'Party', label: 'Party & Evening', match: ['party', 'parties', 'cocktail\\w*', 'dinner\\w*', 'evening\\w*', 'night\\w*', 'formal'] },
  { value: 'Work', label: 'Work & Office', aliases: ['Office', 'Workwear'], match: ['work', 'workwear', 'office', 'corporate', 'professional'] },
  { value: 'Cultural', label: 'Cultural & Art', match: ['cultural', 'exhibition\\w*', 'art shows?', 'gallery', 'galleries', 'theatre', 'theater', 'concert\\w*'] },
  { value: 'Day Events', label: 'Day Events & Brunch', match: ['daytime', 'day events?', 'day functions?', 'day celebrations?', 'day festivit\\w*', 'brunch\\w*', 'lunch\\w*'] },
  { value: 'Everyday', label: 'Everyday & Casual', aliases: ['Daywear', 'Casual'], match: ['everyday', 'daily', 'casual', 'daywear', 'relaxed', 'travel\\w*', 'holiday\\w*'] },
];

// ---------------------------------------------------------------------------
// COLOUR — real swatch colours. Longer phrases win over shorter ones, so
// "rani pink" is Rani Pink (not Pink) and "mustard yellow" is Mustard.
// ---------------------------------------------------------------------------
export const COLORS = [
  { value: 'Red', hex: '#C1272D', match: ['red', 'sindoor', 'scarlet', 'crimson', 'vermilion', 'cherry', 'tomato'] },
  { value: 'Maroon', hex: '#6D1F2B', match: ['maroon', 'burgundy', 'wine', 'wine red', 'oxblood', 'claret', 'garnet', 'brick red', 'deep red', 'dark red'] },
  { value: 'Rani Pink', hex: '#D81B76', match: ['rani', 'rani pink', 'magenta', 'fuchsia', 'hot pink', 'shocking pink', 'gulabi', 'cerise', 'raspberry'] },
  { value: 'Pink', hex: '#EE9AB4', match: ['pink', 'baby pink', 'blush', 'rose', 'rose pink', 'onion pink', 'dusty rose', 'dusty pink', 'candy pink', 'bubblegum'] },
  { value: 'Peach', hex: '#F6B48F', match: ['peach', 'apricot', 'coral', 'salmon', 'melon', 'tangerine peach'] },
  { value: 'Orange', hex: '#E8721C', match: ['orange', 'saffron', 'kesari', 'rust', 'terracotta', 'burnt orange', 'tangerine', 'amber'] },
  { value: 'Mustard', hex: '#D9A21B', match: ['mustard', 'mustard yellow', 'haldi', 'turmeric', 'ochre', 'honey'] },
  { value: 'Yellow', hex: '#F3D63F', match: ['yellow', 'lemon', 'canary', 'butter', 'sunshine', 'lemon yellow'] },
  { value: 'Gold', hex: '#C9A24B', match: ['gold', 'golden', 'zari', 'antique gold', 'champagne'] },
  { value: 'Green', hex: '#2F8049', match: ['green', 'emerald', 'sage', 'olive', 'mint', 'pista', 'pistachio', 'bottle green', 'moss', 'parrot green', 'parrot', 'lime', 'rama', 'mehendi', 'mehndi', 'forest', 'sea green', 'neelpari green'] },
  { value: 'Turquoise', hex: '#27A3A3', match: ['turquoise', 'teal', 'aqua', 'peacock', 'peacock blue', 'firozi', 'feroza', 'cyan', 'aquamarine', 'sea blue'] },
  { value: 'Blue', hex: '#2F5DA8', match: ['blue', 'navy', 'navy blue', 'indigo', 'royal blue', 'sky blue', 'sky', 'cobalt', 'denim', 'powder blue', 'ice blue', 'midnight blue', 'cerulean', 'azure'] },
  { value: 'Lavender', hex: '#B6A3D4', match: ['lavender', 'lilac', 'wisteria', 'periwinkle', 'orchid'] },
  { value: 'Mauve', hex: '#B284A6', match: ['mauve', 'dusty mauve', 'dusty purple', 'heather'] },
  { value: 'Purple', hex: '#6F3A8C', match: ['purple', 'violet', 'plum', 'aubergine', 'amethyst', 'jamuni', 'grape'] },
  { value: 'Brown', hex: '#7A4B2D', match: ['brown', 'chocolate', 'coffee', 'tan', 'camel', 'taupe', 'mocha', 'copper', 'bronze', 'walnut', 'chestnut', 'cinnamon', 'caramel'] },
  { value: 'Ivory', label: 'Ivory & Cream', hex: '#F1E8D3', match: ['ivory', 'cream', 'off white', 'offwhite', 'ecru', 'beige', 'sand', 'nude', 'khaki', 'oatmeal', 'pearl', 'bone', 'eggshell'] },
  { value: 'White', hex: '#FFFFFF', match: ['white', 'snow white'] },
  { value: 'Grey', hex: '#8A8D91', match: ['grey', 'gray', 'silver', 'charcoal', 'ash', 'slate', 'steel', 'smoke', 'stone'] },
  { value: 'Black', hex: '#1C1C1E', match: ['black', 'jet black', 'ebony'] },
  { value: 'Multicolour', hex: 'conic-gradient(#E0B23C,#D81B76,#E8721C,#27A3A3,#6F3A8C,#E0B23C)', match: ['multi', 'multicolour', 'multicolor', 'multi colour', 'multi color', 'multicoloured', 'multicolored', 'rainbow', 'assorted', 'leheriya multi'] },
];

export const OTHER = 'Other';
export const OTHER_HEX = 'linear-gradient(135deg,#d9d2c3 50%,#bfb6a3 50%)';

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
function compile(families) {
  // Flatten to (family, regex, length) and try the longest phrases first.
  const rules = [];
  for (const fam of families) {
    for (const src of fam.match) {
      // keywords are already written lower-case with single spaces; some are
      // regex fragments (e.g. 'festiv\\w*'), so they are used as-is.
      const normSrc = src.toLowerCase();
      rules.push({
        value: fam.value,
        len: normSrc.length,
        re: new RegExp(`(?<![a-z0-9])(?:${normSrc})(?![a-z0-9])`, 'g'),
      });
    }
  }
  rules.sort((a, b) => b.len - a.len);
  return rules;
}

const COMPILED = {
  fabric: compile(FABRICS),
  occasion: compile(OCCASIONS),
  color: compile(COLORS),
};

// Returns the family values found in `text`, in order of appearance.
// exclusive=true → once a phrase claims part of the text, shorter keywords
// can't claim the same characters (used for colours).
function classify(text, rules, exclusive) {
  const t = norm(text);
  if (!t) return [];
  const claimed = new Array(t.length).fill(false);
  const found = [];
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(t)) !== null) {
      if (m[0].length === 0) { rule.re.lastIndex++; continue; }
      const start = m.index;
      const end = start + m[0].length;
      if (exclusive) {
        let overlap = false;
        for (let i = start; i < end; i++) if (claimed[i]) { overlap = true; break; }
        if (overlap) continue;
        for (let i = start; i < end; i++) claimed[i] = true;
      }
      found.push({ value: rule.value, pos: start });
    }
  }
  found.sort((a, b) => a.pos - b.pos);
  const out = [];
  for (const f of found) if (!out.includes(f.value)) out.push(f.value);
  return out;
}

export const fabricsOf = (text) => {
  const r = classify(text, COMPILED.fabric, false);
  return r.length ? r : String(text || '').trim() ? [OTHER] : [];
};
export const occasionsOf = (text) => {
  const r = classify(text, COMPILED.occasion, false);
  return r.length ? r : String(text || '').trim() ? [OTHER] : [];
};
export const colorsOf = (text) => {
  const r = classify(text, COMPILED.color, true);
  return r.length ? r : String(text || '').trim() ? [OTHER] : [];
};

// ---------------------------------------------------------------------------
// Field registry + helpers used by the controller
// ---------------------------------------------------------------------------
export const FIELDS = {
  fabric: { families: FABRICS, of: fabricsOf },
  occasion: { families: OCCASIONS, of: occasionsOf },
  color: { families: COLORS, of: colorsOf },
};

const labelOf = (fam) => fam.label || fam.value;

// Resolve what the shopper clicked (a family value, its label, an alias such
// as the header's "Crepe", or "Other") to a canonical family value. Returns
// null when it's not a family at all (a legacy exact value like
// "Ajrakh Cotton" — the controller then falls back to an exact match).
export function resolveFamily(field, param) {
  const q = norm(param);
  if (!q) return null;
  if (q === norm(OTHER)) return OTHER;
  for (const fam of FIELDS[field].families) {
    if (norm(fam.value) === q || norm(labelOf(fam)) === q) return fam.value;
    if ((fam.aliases || []).some((a) => norm(a) === q)) return fam.value;
  }
  return null;
}

// Given distinct raw strings with their product counts, build the clean facet
// list: [{ value, label, count, hex? }] in the taxonomy's own order.
export function buildFacet(field, rows) {
  const { families, of } = FIELDS[field];
  const counts = new Map();
  for (const { value: raw, count } of rows) {
    for (const fam of of(raw)) {
      // count products, not families-per-product: a product that lists two
      // colours counts once in each, which is what a shopper expects.
      counts.set(fam, (counts.get(fam) || 0) + count);
    }
  }
  const out = [];
  for (const fam of families) {
    if (counts.has(fam.value)) {
      out.push({
        value: fam.value,
        label: labelOf(fam),
        count: counts.get(fam.value),
        ...(fam.aliases ? { aliases: fam.aliases } : {}),
        ...(fam.hex ? { hex: fam.hex } : {}),
      });
    }
  }
  if (counts.has(OTHER)) {
    out.push({ value: OTHER, label: OTHER, count: counts.get(OTHER), ...(field === 'color' ? { hex: OTHER_HEX } : {}) });
  }
  return out;
}

// Which raw database strings belong to a family? The controller uses this
// as `where: { field: { in: [...] } }` — exact, indexable, and immune to the
// substring problems of a plain "contains" (e.g. "red" inside "bordered").
export function rawValuesInFamily(field, familyValue, rows) {
  const { of } = FIELDS[field];
  return rows.map((r) => r.value).filter((raw) => of(raw).includes(familyValue));
}

// Hex for any free-text colour (first colour mentioned). Used for previews.
export function hexForColor(text) {
  const [first] = colorsOf(text);
  if (!first) return null;
  if (first === OTHER) return OTHER_HEX;
  return COLORS.find((c) => c.value === first)?.hex || OTHER_HEX;
}
