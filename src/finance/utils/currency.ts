export function formatCurrency(
  n: number,
  fractionDigits?: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };

  if (fractionDigits !== undefined) {
    options.minimumFractionDigits = fractionDigits;
    options.maximumFractionDigits = fractionDigits;
  }

  return new Intl.NumberFormat(locale, options).format(n);
}

