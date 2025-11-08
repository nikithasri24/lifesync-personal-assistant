export function toMonth(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export function currentMonth(): string {
  const d = new Date();
  const m = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return m;
}

export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map((s) => parseInt(s, 10));
  const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  return { from: from.toISOString(), to: to.toISOString() };
}

export function monthsBack(count: number): string[] {
  const res: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    res.push(label);
  }
  return res;
}

