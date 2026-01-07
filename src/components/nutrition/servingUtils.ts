const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  kg: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

export function parseServingGrams(servingSize?: string): number | null {
  if (!servingSize) return null;
  const match = servingSize.trim().toLowerCase().match(/(\d+(?:\.\d+)?)\s*([a-z]+)/);
  if (!match) return null;
  const amount = Number.parseFloat(match[1]);
  const unit = match[2];
  const grams = UNIT_TO_GRAMS[unit];
  if (!grams || Number.isNaN(amount)) return null;
  return amount * grams;
}

export function convertToGrams(amount?: number | string, unit?: string): number | null {
  if (amount === undefined || amount === null || !unit) return null;
  const numericAmount = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(numericAmount)) return null;
  const normalizedUnit = unit.trim().toLowerCase();
  const grams = UNIT_TO_GRAMS[normalizedUnit];
  if (!grams) return null;
  return numericAmount * grams;
}
