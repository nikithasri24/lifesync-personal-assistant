import { format } from 'date-fns';

export const toKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const ensureDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

export function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((s) => Number(s));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}
