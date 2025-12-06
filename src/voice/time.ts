// Parse simple natural time windows like: today, yesterday, this week, last week,
// this month, last month, last N days
export function parseTimeWindow(text: string): { fromISO?: string; toISO?: string } | undefined {
  const t = text.toLowerCase()
  const now = new Date()
  const end = new Date(now)
  const start = new Date(now)

  const toISO = (d: Date) => d.toISOString()

  const setToStartOfDay = (d: Date) => { d.setUTCHours(0,0,0,0); return d }
  const setToEndOfDay = (d: Date) => { d.setUTCHours(23,59,59,999); return d }

  if (t.includes('today')) {
    return { fromISO: toISO(setToStartOfDay(start)), toISO: toISO(setToEndOfDay(end)) }
  }
  if (t.includes('yesterday')) {
    start.setUTCDate(start.getUTCDate() - 1)
    end.setUTCDate(end.getUTCDate() - 1)
    return { fromISO: toISO(setToStartOfDay(start)), toISO: toISO(setToEndOfDay(end)) }
  }
  if (t.includes('this week')) {
    const day = start.getUTCDay() || 7
    start.setUTCDate(start.getUTCDate() - (day - 1))
    return { fromISO: toISO(setToStartOfDay(start)), toISO: toISO(setToEndOfDay(end)) }
  }
  if (t.includes('last week')) {
    const day = start.getUTCDay() || 7
    start.setUTCDate(start.getUTCDate() - (day - 1) - 7)
    end.setUTCDate(start.getUTCDate() + 6)
    return { fromISO: toISO(setToStartOfDay(start)), toISO: toISO(setToEndOfDay(end)) }
  }
  if (t.includes('this month')) {
    start.setUTCDate(1)
    return { fromISO: toISO(setToStartOfDay(start)), toISO: toISO(setToEndOfDay(end)) }
  }
  if (t.includes('last month')) {
    start.setUTCMonth(start.getUTCMonth() - 1, 1)
    end.setUTCMonth(start.getUTCMonth() + 1, 0)
    return { fromISO: toISO(setToStartOfDay(start)), toISO: toISO(setToEndOfDay(end)) }
  }
  const m = t.match(/last (\d+) days/)
  if (m) {
    const days = parseInt(m[1], 10)
    start.setUTCDate(start.getUTCDate() - days)
    return { fromISO: toISO(setToStartOfDay(start)), toISO: toISO(setToEndOfDay(end)) }
  }
  return undefined
}

