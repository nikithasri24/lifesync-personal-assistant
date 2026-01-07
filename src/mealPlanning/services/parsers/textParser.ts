/**
 * Text Parser Service
 * Parses recipes from plain text, markdown, and pasted content
 */

import type { Recipe } from '../../../types';
import { parseDescriptionToLists } from './youtubeParser';

/**
 * Parse markdown table into structured ingredients
 */
export function parseMarkdownTable(rows: string[]): Array<{ name: string; amount?: string }> {
  const out: Array<{ name: string; amount?: string }> = [];
  let i = 0;
  while (i < rows.length) {
    if (!/^\|/.test(rows[i])) { i++; continue; }
    // collect contiguous table block
    const block: string[] = [];
    while (i < rows.length && /^\|.*\|$/.test(rows[i])) { block.push(rows[i]); i++; }
    if (block.length < 2) continue;
    const cells = (r: string): string[] => r.split('|').slice(1, -1).map(c => c.trim());
    const header = cells(block[0]);
    const sep = block[1];
    if (!/^-/.test(sep.replace(/\|/g, '').trim())) {
      // no separator, treat as simple rows with 2 columns fallback
    }
    const idxName = header.findIndex(h => /ingredient/i.test(h));
    const idxAmt = header.findIndex(h => /amount|notes/i.test(h));
    for (let j = 1; j < block.length; j++) {
      const row = cells(block[j]);
      if (!row.length) continue;
      if (row.every(col => /^-+$/.test(col))) continue; // separator
      const name = (idxName !== -1 ? row[idxName] : row[0] || '').trim();
      const amount = (idxAmt !== -1 ? row[idxAmt] : row[1] || '').trim();
      if (name) out.push({ name, amount: amount || undefined });
    }
  }
  return out;
}

/**
 * Normalize fraction characters to standard format
 */
export function normalizeFractions(text: string): string {
  return text
    .replace(/½/g, ' 1/2')
    .replace(/¼/g, ' 1/4')
    .replace(/¾/g, ' 3/4')
    .replace(/⅓/g, ' 1/3')
    .replace(/⅔/g, ' 2/3')
    .replace(/⅛/g, ' 1/8')
    .replace(/⅜/g, ' 3/8')
    .replace(/⅝/g, ' 5/8')
    .replace(/⅞/g, ' 7/8');
}

/**
 * Parse text into a recipe object
 */
export function parseTextToRecipe(text: string, title?: string): Omit<Recipe, 'id' | 'createdAt'> {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => l.trim()).filter(Boolean);

  // Detect sections
  const idxIng = lines.findIndex(l => /^ingredients?\b/i.test(l));
  const idxEqp = lines.findIndex(l => /^(equipment|tools?)\b/i.test(l));
  const idxTip = lines.findIndex(l => /^tips?\b|^notes?\b/i.test(l));
  const idxDir = lines.findIndex(l => /^(directions?|instructions?|method)\b/i.test(l));

  let ingredients: string[] = [];
  let equipment: string[] = [];
  let tips: string[] = [];
  let instructions: string[] = [];

  const endOf = (...idx: number[]) => {
    const positive = idx.filter(i => i !== -1).sort((a,b)=>a-b);
    return (start: number) => positive.find(i => i > start) ?? lines.length;
  };

  if (idxIng !== -1 || idxDir !== -1 || idxEqp !== -1 || idxTip !== -1) {
    const nextAfter = endOf(idxIng, idxDir, idxEqp, idxTip);
    if (idxIng !== -1) ingredients = lines.slice(idxIng + 1, nextAfter(idxIng));
    if (idxDir !== -1) instructions = lines.slice(idxDir + 1, nextAfter(idxDir));
    if (idxEqp !== -1) equipment = lines.slice(idxEqp + 1, nextAfter(idxEqp));
    if (idxTip !== -1) tips = lines.slice(idxTip + 1, nextAfter(idxTip));
  }

  // Try to pull servings from headings like "Ingredients (for ~2–3 servings)"
  let inferredServings: number | undefined;
  const servingsRe = /for\s*~?\s*(\d+)(?:\s*[–-]\s*|\s*to\s*)(\d+)\s*servings?|for\s*(\d+)\s*servings?/i;
  for (const l of lines.slice(Math.max(0, idxIng - 2), Math.min(lines.length, idxIng + 3))) {
    const m = l.match(servingsRe);
    if (m) {
      if (m[1] && m[2]) {
        const a = parseInt(m[1], 10);
        const b = parseInt(m[2], 10);
        inferredServings = Math.max(a, b);
      } else if (m[3]) {
        inferredServings = parseInt(m[3], 10);
      }
      break;
    }
  }

  // Extract table-based ingredients, if any
  let tableIngs: Array<{ name: string; amount?: string }> = [];
  if (ingredients.length) {
    tableIngs = parseMarkdownTable(ingredients.filter(l => l));
  }

  // Heuristics if headings are missing
  if (ingredients.length === 0 || instructions.length === 0) {
    const joined = lines.join('\n');
    const parsed = parseDescriptionToLists(joined);
    if (ingredients.length === 0) ingredients = parsed.ingredients;
    if (instructions.length === 0) instructions = parsed.instructions;
  }

  // Final normalization + ingredient structuring
  const unitList = ['cup','cups','tsp','tbsp','teaspoon','tablespoon','g','gram','grams','kg','ml','l','liter','liters','ounce','ounces','oz','lb','pound','pounds','clove','cloves','slice','slices','pinch','dash','stick','sticks','can','cans','package','packages','bunch','bunches','head','heads','piece','pieces','quart','pint','sprig','sprigs'];
  const unitRe = new RegExp(`^((?:\\d+(?:[\\s-]\\d/\\d)?|\\d+/\\d+|\\d+(?:\\.\\d+)?)(?:\\s*x)?)?\\s*(?:(${unitList.join('|')}))?\\s*(.*)$`, 'i');
  const cleanBullet = (s: string): string => s.replace(/^[-*•]\s*/, '').trim();

  const lineIngs = ingredients
    .filter(l => !/^\|/.test(l)) // skip table rows, already parsed
    .map(cleanBullet)
    .filter(Boolean)
    .slice(0, 100)
    .map(raw => {
      const m = raw.match(unitRe);
      if (!m) return { name: raw };
      const amount = (m[1] || '').trim();
      const unit = (m[2] || '').trim();
      const name = (m[3] || raw).trim();
      return { name, amount: amount || undefined, unit: unit || undefined };
    });

  const ingOut = [
    ...tableIngs.map(t => ({ name: t.name, amount: t.amount })),
    ...lineIngs,
  ].slice(0, 100);

  const stepsOut = instructions
    .map(s => s.replace(/^\d+\.|^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 50);

  // Basic time estimates
  const prepTime = Math.max(5, Math.min(30, ingOut.length * 2));
  const cookTime = Math.max(10, Math.min(60, stepsOut.length * 3));

  // Equipment tags + tips
  const equipTags = equipment
    .map(cleanBullet)
    .filter(Boolean)
    .slice(0, 30)
    .map(t => `equip:${t.toLowerCase()}`);
  const notes = tips.map(cleanBullet).join('\n');

  // Build description from the first paragraph before any heading or rule
  let description = '';
  {
    const firstParaLines: string[] = [];
    for (const r of rawLines) {
      if (/^\s*#/.test(r) || /^\s*---/.test(r)) break;
      if (r.trim().length === 0 && firstParaLines.length > 0) break;
      if (r.trim().length > 0) firstParaLines.push(r.trim());
    }
    description = firstParaLines.join(' ').trim();
  }

  return {
    name: title ?? (lines[0] ?? 'Pasted Recipe'),
    description,
    ingredients: ingOut,
    instructions: stepsOut,
    prepTime,
    cookTime,
    servings: inferredServings ?? 2,
    difficulty: 'medium',
    tags: ['pasted', ...equipTags],
    rating: undefined,
    notes: notes || undefined,
    image: undefined,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
    flowChart: undefined,
    sourceType: 'manual',
    sourceUrl: undefined,
    videoThumbnail: undefined,
  };
}
