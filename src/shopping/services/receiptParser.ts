import type { ShoppingItem } from '../types';

export interface ParsedReceiptItem {
  id: string;
  name: string;
  quantity: number;
  selected: boolean;
  category: ShoppingItem['category'];
  threshold: string;
  price?: number;
  size?: string;
}

export interface ReceiptMeta {
  merchant?: string;
  address?: string;
  date?: string;
  time?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  payment?: string;
}

export function parseReceiptToItems(text: string): ParsedReceiptItem[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const skip = /^(subtotal|sub total|item count|balance|tax|total|change|cash|visa|mastercard|amex|debit|credit|thank|thanks|store|merchant|date|time|auth|approval|card|aid|tvr|tac|entry|ref|inv|order|sales tax)\b/i;
  const trailPrice = /(?:\$\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2}))/;
  const priceAtEnd = new RegExp(`${trailPrice.source}$`);
  const qtyPrefix = /^(\d+)\s*[x×]\s+/i;
  const qtySuffix = /\s*[x×]\s*(\d+)$/i;
  const multiFor = /(\d+)\s*(?:for|/|@)\s*\$?\s*(\d+(?:[.,]\d{2})?)/i; // 2 for 5.00, 3/$10, 2@5.00
  const sizeToken = /(\d+(?:[.,]\d+)?\s*(?:oz|fl oz|lb|lbs|g|kg|ml|l|ct|count|pack|pk|ea|btl|bottle|jar|can))\b/i;

  const items: ParsedReceiptItem[] = [];

  for (let raw of lines) {
    if (skip.test(raw)) continue;
    // Remove obvious headers/footers
    if (/^\*{3,}|^-{3,}|_{3,}$/.test(raw)) continue;

    let price: number | undefined;
    let qty = 1;

    // trailing price
    const pe = raw.match(priceAtEnd);
    if (pe) {
      const val = pe[1].replace(/,/g, '.');
      price = Number(val);
      raw = raw.slice(0, pe.index).trim();
    }

    // multi-buy formats
    const mf = raw.match(multiFor);
    if (mf) {
      const count = Number(mf[1]) || 1;
      const total = Number(String(mf[2]).replace(/,/g, '.')) || undefined;
      qty = count;
      if (total && count > 0) price = Number((total / count).toFixed(2));
      raw = raw.replace(multiFor, '').trim();
    }

    // explicit qty x prefix/suffix
    const pre = raw.match(qtyPrefix);
    if (pre) { qty = Math.max(1, Number(pre[1]) || 1); raw = raw.replace(qtyPrefix, ''); }
    const suf = raw.match(qtySuffix);
    if (suf) { qty = Math.max(1, Number(suf[1]) || qty); raw = raw.replace(qtySuffix, ''); }

    // remove leading numeric codes (PLU/SKU)
    raw = raw.replace(/^(?:plu|sku|upc|#)?\s*\d{5,}\s*/i, '').trim();

    // size token
    let size: string | undefined;
    const sm = raw.match(sizeToken);
    if (sm) { size = sm[1].replace(/\s+/g, ' ').toLowerCase(); raw = raw.replace(sizeToken, '').trim(); }

    // clean name
    const name = raw.replace(/\s{2,}/g, ' ').trim();
    if (!name || name.length < 2) continue;
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) continue;

    const category = categorizeName(name);
    items.push({ id: Math.random().toString(36).slice(2, 10), name, quantity: qty, selected: true, category, threshold: '', price, size });
  }

  return items;
}

export function parseReceiptMeta(text: string): ReceiptMeta {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const meta: ReceiptMeta = {};

  // Merchant: first non-empty alpha line
  const merchantLine = lines.find(l => /[A-Za-z]/.test(l) && !/(receipt|invoice|order|store|merchant|thank)/i.test(l));
  if (merchantLine) meta.merchant = merchantLine;

  // Address: line with street or city, state zip
  const addressLine = lines.find(l => /(\d+\s+\w+\s+(st|ave|rd|blvd|dr|ct)\b|,\s*[A-Z]{2}\s*\d{5})/i.test(l));
  if (addressLine) meta.address = addressLine;

  // Date and time
  const dateMatch = text.match(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
  const timeMatch = text.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\b/i);
  if (dateMatch) meta.date = dateMatch[1];
  if (timeMatch) meta.time = timeMatch[1];

  // Totals
  const money = (s: string) => {
    const m = s.match(/(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})|\d+(?:[\.,]\d{2}))/);
    if (!m) return undefined;
    return Number(m[1].replace(/,/g, '.'));
  };

  const subLine = lines.find(l => /sub\s*total/i.test(l)) || lines.find(l => /^subtotal/i.test(l));
  const taxLine = lines.find(l => /tax/i.test(l));
  // Prefer a line that starts with total
  const totalLine = lines.find(l => /^total\b/i.test(l)) || lines.reverse().find(l => /total/i.test(l));

  if (subLine) meta.subtotal = money(subLine);
  if (taxLine) meta.tax = money(taxLine);
  if (totalLine) meta.total = money(totalLine);

  // Payment
  const payLine = lines.find(l => /(visa|mastercard|amex|debit|credit|cash)/i.test(l));
  if (payLine) meta.payment = payLine;

  return meta;
}

export function categorizeName(name: string): ShoppingItem['category'] {
  const n = name.toLowerCase();
  const any = (arr: string[]) => arr.some(k => n.includes(k));

  if (any(['banana', 'apple', 'onion', 'tomato', 'lettuce', 'spinach', 'greens', 'carrot', 'cucumber', 'pepper', 'avocado', 'broccoli', 'cauliflower', 'corn', 'scallion', 'garlic', 'ginger', 'herb'])) return 'produce';
  if (any(['milk', 'yogurt', 'butter', 'cheese', 'cream', 'half and half'])) return 'dairy';
  if (any(['chicken', 'beef', 'pork', 'turkey', 'steak', 'ground beef', 'sausage', 'bacon', 'ham', 'fish', 'salmon', 'shrimp', 'tuna'])) return 'meat';
  if (any(['bread', 'bagel', 'bun', 'tortilla', 'roll', 'croissant', 'baguette'])) return 'bakery';
  if (any(['frozen', 'ice cream', 'frozen pizza', 'frozen peas', 'frozen corn'])) return 'frozen';
  if (any(['deli', 'salami', 'prosciutto', 'sliced', 'cold cut'])) return 'deli';
  if (any(['soap', 'detergent', 'paper towel', 'toilet paper', 'cleaner', 'bleach', 'foil', 'wrap', 'ziplock', 'bag'])) return 'household';
  if (any(['shampoo', 'toothpaste', 'toothbrush', 'deodorant', 'razor', 'lotion'])) return 'personal';
  if (any(['battery', 'charger', 'usb', 'cable'])) return 'electronics';
  if (any(['rice', 'pasta', 'noodle', 'flour', 'sugar', 'salt', 'oil', 'olive', 'vinegar', 'sauce', 'ketchup', 'mustard', 'mayo', 'beans', 'lentil', 'cereal', 'granola', 'oats', 'oatmeal', 'spice', 'seasoning', 'broth', 'stock', 'can'])) return 'pantry';

  return 'other';
}

export function calculateReceiptCategorySummary(items: ParsedReceiptItem[]): {
  summary: Record<string, { count: number; qty: number; est: number }>,
  estSubtotal: number
} {
  const summary: Record<string, { count: number; qty: number; est: number }> = {};
  let estSubtotal = 0;

  for (const it of items) {
    const key = it.category;
    summary[key] ??= { count: 0, qty: 0, est: 0 };
    summary[key].count += 1;
    summary[key].qty += it.quantity;
    if (typeof it.price === 'number') {
      const line = it.price * it.quantity;
      summary[key].est += line;
      estSubtotal += line;
    }
  }

  return { summary, estSubtotal };
}
