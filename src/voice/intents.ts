import { getFinanceAPI } from '../finance/data'
import apiClient from '../services/apiClient'
import { currentMonth, monthRange } from '../finance/utils/date'
import { formatCurrency } from '../finance/utils/currency'
import { parseTimeWindow } from './time'

export type IntentContext = {
  timeframe?: { fromISO?: string; toISO?: string; label?: string }
  lastCategoryId?: string
  lastCategoryName?: string
  lastTxnSnapshot?: { accountId: string; amount: number; type: 'debit' | 'credit' }
  pendingCategory?: boolean
  pendingDelete?: { id: string; amount: number }
  pendingAssignCategory?: { txnId: string }
  pendingRename?: { txnId: string }
  pendingSetAmount?: { txnId: string }
  pendingMoveAccount?: { txnId: string }
  pendingSetType?: { txnId: string }
  lastRefIndex?: number
  lastRefTxnId?: string
  pendingCategorySuggestions?: string[]
}

export type IntentResult = {
  reply: string
  context?: IntentContext
  navigateView?: string
  toast?: { message: string; type?: 'info' | 'success' | 'error' }
}

function parseAmount(text: string): number | null {
  const m = text.match(/(-?\$?\d+[\d,]*(?:\.\d+)?)/)
  if (!m) return null
  const clean = m[1].replace(/\$/g, '').replace(/,/g, '')
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

function parseCategory(text: string): string | undefined {
  const m = text.match(/on ([a-zA-Z ]+)$/) ?? text.match(/for ([a-zA-Z ]+)$/)
  return m ? m[1].trim().toLowerCase() : undefined
}

function normalize(s: string): string { return s.toLowerCase().trim() }

async function resolveCategoryIdByName(name: string): Promise<{ id?: string; name?: string }> {
  const api = await getFinanceAPI()
  const cats = await api.listCategories()
  const q = normalize(name)
  let best: { id?: string; name?: string; score: number } = { score: 0 }
  for (const c of cats) {
    const n = normalize(c.name)
    if (n === q) return { id: c.id, name: c.name }
    let score = 0
    if (n.startsWith(q)) score = 0.9
    else if (n.includes(q)) score = 0.6
    if (score > best.score) best = { id: c.id, name: c.name, score }
  }
  if (best.score >= 0.6) return { id: best.id, name: best.name }
  return {}
}

async function resolveAccountIdByName(name: string): Promise<{ id?: string; name?: string }> {
  const api = await getFinanceAPI()
  const accts = await api.listAccounts()
  const q = normalize(name)
  let best: { id?: string; name?: string; score: number } = { score: 0 }
  for (const a of accts) {
    const n = normalize(a.name)
    if (n === q) return { id: a.id, name: a.name }
    let score = 0
    if (n.startsWith(q)) score = 0.9
    else if (n.includes(q)) score = 0.6
    if (score > best.score) best = { id: a.id, name: a.name, score }
  }
  if (best.score >= 0.6) return { id: best.id, name: best.name }
  return {}
}

function parseDateFromText(text: string): Date | undefined {
  const t = text.toLowerCase()
  const now = new Date()
  if (/\btoday\b/.test(t)) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (/\byesterday\b/.test(t)) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
  // ISO YYYY-MM-DD
  const iso = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (iso) {
    const y = parseInt(iso[1], 10), m = parseInt(iso[2], 10) - 1, d = parseInt(iso[3], 10)
    return new Date(Date.UTC(y, m, d))
  }
  // MM/DD[/YYYY]
  const md = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (md) {
    const m = parseInt(md[1], 10) - 1, d = parseInt(md[2], 10)
    let y = md[3] ? parseInt(md[3], 10) : now.getUTCFullYear()
    if (y < 100) y += 2000
    return new Date(Date.UTC(y, m, d))
  }
  // Month name day
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','sept','oct','nov','dec']
  const mn = t.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,\s*(\d{4}))?/)
  if (mn) {
    const name = mn[1].slice(0,3)
    let mi = months.indexOf(name)
    if (name === 'sep') mi = 8; if (name === 'sept') mi = 8
    const d = parseInt(mn[2], 10)
    const y = mn[3] ? parseInt(mn[3], 10) : now.getUTCFullYear()
    return new Date(Date.UTC(y, mi, d))
  }
  return undefined
}

function isSameUTCDate(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
}

function parseOrdinal(text: string): number | undefined {
  const t = text.toLowerCase()
  const m1 = t.match(/(?:last\s+)?(\d+)(?:st|nd|rd|th)?\s+last/) ?? t.match(/last\s+(\d+)(?:st|nd|rd|th)?/)
  if (m1) {
    const n = parseInt(m1[1], 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  const words: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 }
  const m2 = t.match(/(first|second|third|fourth|fifth)\s+last/) ?? t.match(/last\s+(first|second|third|fourth|fifth)/)
  if (m2) return words[m2[1]]
  if (/(previous|prev)\b/.test(t)) return 2
  if (/before that/.test(t)) return 3
  if (/\blast\b/.test(t)) return 1
  return undefined
}

async function resolveTargetTransaction(n: number | undefined, preferVoiceEntry: boolean, lastRefIndex?: number): Promise<{ tx: { id: string; accountId: string; amount: number; categoryId?: string; dateISO: string; description: string; type: 'debit' | 'credit' }; index: number } | undefined> {
  const api = await getFinanceAPI()
  const { items } = await api.listTransactions({ limit: 100 })
  if (!items.length) return undefined
  let index = 0
  if (typeof n === 'number') index = Math.max(1, n) - 1
  else if (typeof lastRefIndex === 'number') index = Math.max(1, lastRefIndex) - 1
  if (preferVoiceEntry && (!n || n === 1)) {
    const voice = items.find(i => /voice entry/i.test(i.description))
    if (voice) return { tx: voice, index: 1 }
  }
  const tx = items[index]
  if (!tx) return undefined
  return { tx, index: index + 1 }
}

export async function handleUtterance(text: string, ctx?: IntentContext): Promise<IntentResult> {
  const t = text.toLowerCase().trim()

  // Pending flows
  if (ctx?.pendingDelete) {
    if (/^(yes|confirm|do it|ok|okay|delete it)$/.test(t)) {
      const api = await getFinanceAPI(); const { id, amount } = ctx.pendingDelete
      try { await api.deleteTransaction(id); return { reply: `Deleted the last voice transaction of ${formatCurrency(amount)}.`, context: { ...ctx, pendingDelete: undefined }, toast: { message: 'Deleted last voice transaction', type: 'success' } } }
      catch { return { reply: 'Sorry, I could not delete it due to a permission issue.', context: { ...ctx, pendingDelete: undefined }, toast: { message: 'Failed to delete transaction', type: 'error' } } }
    }
    if (/^(no|cancel|stop|leave it)$/.test(t)) return { reply: 'Okay, I will not delete it.', context: { ...ctx, pendingDelete: undefined } }
    return { reply: 'Please say confirm or cancel.', context: { ...ctx } }
  }

  if (ctx?.pendingCategory) {
    const api = await getFinanceAPI(); const resolved = await resolveCategoryIdByName(t)
    if (resolved.id) {
      const range = ctx.timeframe ?? (() => { const m = currentMonth(); const r = monthRange(m); return { fromISO: r.from, toISO: r.to } })()
      const { items } = await api.listTransactions({ fromISO: range.fromISO, toISO: range.toISO, limit: 1000 })
      const filtered = items.filter(i => i.type === 'debit' && i.categoryId === resolved.id)
      const total = filtered.reduce((s, i) => s + i.amount, 0)
      return { reply: `You spent ${formatCurrency(total)} on ${resolved.name}${ctx.timeframe ? '' : ' this month'}.`, context: { ...ctx, pendingCategory: false, lastCategoryId: resolved.id, lastCategoryName: resolved.name } }
    }
    return { reply: "I couldn't find that category. Please say the category name again.", context: { ...ctx } }
  }

  if (ctx?.pendingRename) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const found = items.find(i => i.id === ctx.pendingRename?.txnId) ?? items.find(i => /voice entry/i.test(i.description)) ?? items[0]
    if (!found) return { reply: 'I could not find a transaction to rename.', context: { ...ctx, pendingRename: undefined } }
    const newDesc = text.trim()
    await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: found.amount, categoryId: found.categoryId, dateISO: found.dateISO, description: newDesc, type: found.type })
    return { reply: `Renamed the last transaction to "${newDesc}".`, context: { ...ctx, pendingRename: undefined }, toast: { message: 'Transaction renamed', type: 'success' } }
  }

  if (ctx?.pendingAssignCategory) {
    const api = await getFinanceAPI(); const resolved = await resolveCategoryIdByName(text)
    if (!resolved.id) {
      // If we have suggestions, hint them again
      const sug = ctx.pendingCategorySuggestions?.length ? ` Did you mean: ${ctx.pendingCategorySuggestions.join(', ')}?` : ''
      return { reply: `I couldn't find that category.${sug} Please say the category again.`, context: { ...ctx } }
    }
    const { items } = await api.listTransactions({ limit: 50 })
    const found = items.find(i => i.id === ctx.pendingAssignCategory?.txnId) ?? items.find(i => /voice entry/i.test(i.description)) ?? items[0]
    if (!found) return { reply: 'I could not find a transaction to categorize.', context: { ...ctx, pendingAssignCategory: undefined } }
    await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: found.amount, categoryId: resolved.id, dateISO: found.dateISO, description: found.description, type: found.type })
    return { reply: `Categorized the last transaction as ${resolved.name}.`, context: { ...ctx, pendingAssignCategory: undefined, lastCategoryId: resolved.id, lastCategoryName: resolved.name }, toast: { message: 'Transaction categorized', type: 'success' } }
  }

  if (ctx?.pendingSetAmount) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const found = items.find(i => i.id === ctx.pendingSetAmount?.txnId) ?? items.find(i => /voice entry/i.test(i.description)) ?? items[0]
    if (!found) return { reply: 'I could not find a transaction to update.', context: { ...ctx, pendingSetAmount: undefined } }
    const amt = parseAmount(text); if (amt == null) return { reply: 'Please say the amount again.', context: { ...ctx } }
    await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: Math.abs(amt), categoryId: found.categoryId, dateISO: found.dateISO, description: found.description, type: found.type })
    return { reply: `Updated the amount to ${formatCurrency(Math.abs(amt))}.`, context: { ...ctx, pendingSetAmount: undefined }, toast: { message: 'Amount updated', type: 'success' } }
  }

  if (ctx?.pendingMoveAccount) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const found = items.find(i => i.id === ctx.pendingMoveAccount?.txnId) ?? items.find(i => /voice entry/i.test(i.description)) ?? items[0]
    if (!found) return { reply: 'I could not find a transaction to move.', context: { ...ctx, pendingMoveAccount: undefined } }
    const r = await resolveAccountIdByName(text); if (!r.id) return { reply: "I couldn't find that account. Please say the account name again.", context: { ...ctx } }
    await api.upsertTransaction({ id: found.id, accountId: r.id, amount: found.amount, categoryId: found.categoryId, dateISO: found.dateISO, description: found.description, type: found.type })
    return { reply: `Moved the transaction to ${r.name}.`, context: { ...ctx, pendingMoveAccount: undefined }, toast: { message: 'Transaction moved to account', type: 'success' } }
  }

  if (ctx?.pendingSetType) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const found = items.find(i => i.id === ctx.pendingSetType?.txnId) ?? items.find(i => /voice entry/i.test(i.description)) ?? items[0]
    if (!found) return { reply: 'I could not find a transaction to update.', context: { ...ctx, pendingSetType: undefined } }
    const isCredit = /(credit|income|incoming|refund)/.test(t); const isDebit = /(debit|expense|outgoing|charge|purchase)/.test(t)
    if (!isCredit && !isDebit) return { reply: 'Should I set it to debit or credit?', context: { ...ctx } }
    const newType = (isCredit ? 'credit' : 'debit')
    await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: found.amount, categoryId: found.categoryId, dateISO: found.dateISO, description: found.description, type: newType })
    return { reply: `Set the transaction type to ${newType}.`, context: { ...ctx, pendingSetType: undefined }, toast: { message: 'Transaction type updated', type: 'success' } }
  }

  // Conversational greetings (prioritize day-part over hello)
  if (/(good\s+morning|good\s+evening|good\s+afternoon)/.test(t)) {
    const hour = new Date().getHours()
    const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    return { reply: `Good ${part}! What would you like to do today?` }
  }
  if (/^(hi|hello|hey)\b/.test(t)) return { reply: 'Hello! How can I help you today?' }

  // Breakfast menu inquiry
  if (/(breakfast).*(menu|plan|what.*have|what.*had)/.test(t)) {
    try {
      const plans = await apiClient.getMealPlans().catch(() => [])
      const today = new Date()
      const _todayISO = today.toISOString().slice(0,10)
      const todays = JSON.stringify(plans) // quick-and-dirty scan; structure varies by backend
      const mentioned = /breakfast\W+([^\n"]{3,40})/i.exec(todays)
      if (mentioned?.[1]) {
        return { reply: `On your meal plan, breakfast includes ${mentioned[1].replace(/\s{2,}/g,' ')}` }
      }
    } catch {
      // Intentionally empty - fallback to default message
    }
    // fallback
    return { reply: 'I do not see a set breakfast on the plan today. Want me to suggest something based on your pantry?' }
  }

  // Suggest simple recipe based on pantry
  if (/suggest.*(simple|quick).*(breakfast|meal|something).*pantry/.test(t) || /lazy.*cook|without.*prep/.test(t)) {
    try {
      const pantry = await apiClient.getPantryItems().catch(() => []) as Array<{ name?: string | number }>
      const names = new Set<string>((pantry ?? []).map(p => (typeof p.name === 'string' || typeof p.name === 'number' ? String(p.name) : '').toLowerCase()))
      const has = (s: string): boolean => Array.from(names).some(n => n.includes(s))
      const options: string[] = []
      if (has('egg') && has('bread')) options.push('Egg toast')
      if (has('egg')) options.push('Scrambled eggs')
      if (has('oat')) options.push('Overnight oats')
      if (has('yogurt')) options.push('Yogurt with honey and nuts')
      if (has('banana') && has('peanut')) options.push('Banana with peanut butter')
      if (has('bread') && has('cheese')) options.push('Cheese toast')
      if (has('tortilla') && has('cheese')) options.push('Cheese quesadilla')
      if (options.length) {
        return { reply: `Here are some quick options: ${options.slice(0,3).join(', ')}.` }
      }
      // try recipes tagged quick/breakfast
      const recipes = await apiClient.getRecipes().catch(() => []) as Array<{ tags?: unknown; prep_time?: unknown; name?: string | number }>
      const quick = (recipes ?? []).filter(r =>
        (Array.isArray(r.tags) && (r.tags.includes('quick') ?? r.tags.includes('breakfast'))) ??
        (typeof r.prep_time === 'number' && r.prep_time <= 10)
      ).map(r => (typeof r.name === 'string' || typeof r.name === 'number' ? String(r.name) : '')).slice(0,3)
      if (quick.length) return { reply: `Quick ideas: ${quick.join(', ')}.` }
      return { reply: 'How about toast with butter, or yogurt with fruit? Both are quick with minimal prep.' }
    } catch {
      return { reply: 'How about toast with butter, or yogurt with fruit? Both are quick with minimal prep.' }
    }
  }

  // Navigation
  const navMatch = t.match(/^(go to|open|show) ([a-z ]+)$/); if (navMatch) {
    const target = navMatch[2].trim(); const map: Record<string, string> = { dashboard: 'dashboard', home: 'dashboard', calendar: 'calendar', tasks: 'todos', focus: 'focus', habits: 'habits', notes: 'notes', projects: 'projects', journal: 'journal', mood: 'mood', period: 'period', travel: 'travel', finances: 'finances', finance: 'finances', shopping: 'shopping', meals: 'meals', goals: 'goals', shared: 'shared', personal: 'personal' }
    const view = map[target]; if (view) return { reply: `Opening ${target}.`, navigateView: view }
  }

  // Finance summaries
  if (/(what'?s|what is).*(spend|spent|expenses|expense).*month/.test(t) || /how much.*spent/.test(t)) {
    const api = await getFinanceAPI(); const month = currentMonth(); const { from, to } = monthRange(month)
    const { items } = await api.listTransactions({ fromISO: from, toISO: to, limit: 1000 }); const spent = items.filter(i => i.type === 'debit').reduce((s, i) => s + i.amount, 0)
    return { reply: `You have spent ${formatCurrency(spent)} so far this month.` }
  }

  if (/(what'?s|what is).*(income|earnings).*month/.test(t)) {
    const api = await getFinanceAPI(); const month = currentMonth(); const { from, to } = monthRange(month)
    const { items } = await api.listTransactions({ fromISO: from, toISO: to, limit: 1000 }); const income = items.filter(i => i.type === 'credit').reduce((s, i) => s + i.amount, 0)
    return { reply: `Your income this month is ${formatCurrency(income)}.` }
  }

  // Spend by category
  if (/spend(ing)? on /.test(t)) {
    const api = await getFinanceAPI(); const window = parseTimeWindow(t) ?? ctx?.timeframe
    const catName = (t.match(/spend(?:ing)? on ([a-z ]+)/)?.[1] ?? ctx?.lastCategoryName ?? '').trim()
    let catId = ctx?.lastCategoryId; let catResolvedName = ctx?.lastCategoryName
    if (catName) {
      const resolved = await resolveCategoryIdByName(catName)
      if (resolved.id) { catId = resolved.id; catResolvedName = resolved.name }
      else return { reply: 'Which category? Please say the category name.', context: { ...ctx, timeframe: window, pendingCategory: true } }
    }
    const range = window ?? (() => { const m = currentMonth(); const r = monthRange(m); return { fromISO: r.from, toISO: r.to } })()
    const { items } = await api.listTransactions({ fromISO: range.fromISO, toISO: range.toISO, limit: 1000 })
    const filtered = items.filter(i => i.type === 'debit' && (!catId || i.categoryId === catId))
    const total = filtered.reduce((s, i) => s + i.amount, 0)
    const label = catResolvedName ? ` on ${catResolvedName}` : ''; const tlabel = window ? '' : ' this month'
    return { reply: `You spent ${formatCurrency(total)}${label}${tlabel}.`, context: { timeframe: range, lastCategoryId: catId, lastCategoryName: catResolvedName } }
  }

  // Rename last transaction
  if (/^(rename|update|change) (the )?(last )?(transaction|entry)/.test(t) || /^set description to /.test(t)) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const found = items.find(i => /voice entry/i.test(i.description)) ?? items[0]; if (!found) return { reply: 'I could not find a recent transaction to rename.' }
    const m = text.match(/to (.+)$/); if (m?.[1]) { const newDesc = m[1].trim(); await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: found.amount, categoryId: found.categoryId, dateISO: found.dateISO, description: newDesc, type: found.type }); return { reply: `Renamed the last transaction to "${newDesc}".`, toast: { message: 'Transaction renamed', type: 'success' } } }
    return { reply: 'What should I rename it to?', context: { ...ctx, pendingRename: { txnId: found.id } } }
  }

  // Categorize last transaction
  if (/^(categorize|set category|tag) (the )?(last )?(transaction|entry)/.test(t)) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const date = parseDateFromText(t)
    let found = items.find(i => /voice entry/i.test(i.description)) ?? items[0]; if (!found) return { reply: 'I could not find a recent transaction to categorize.' }
    if (date) {
      const same = items.find(i => isSameUTCDate(new Date(i.dateISO), date))
      if (same) found = same
    }
    const m = text.match(/as ([a-zA-Z ]+)$/); if (m?.[1]) { const cname = m[1].trim(); const r = await resolveCategoryIdByName(cname); if (!r.id) {
        // Suggest top 3 categories when not found
        const cats = await (await getFinanceAPI()).listCategories();
        const q = cname.toLowerCase();
        const scored = cats.map(c => ({ name: c.name, score: c.name.toLowerCase().startsWith(q) ? 0.9 : (c.name.toLowerCase().includes(q) ? 0.6 : 0) }))
          .filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0,3).map(x => x.name)
        const suggestionText = scored.length ? ` Did you mean: ${scored.join(', ')}?` : '';
        return { reply: `I couldn't find that category.${suggestionText} Please say the category again.`, context: { ...ctx, pendingAssignCategory: { txnId: found.id }, pendingCategorySuggestions: scored } }
      }; await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: found.amount, categoryId: r.id, dateISO: found.dateISO, description: found.description, type: found.type }); return { reply: `Categorized the last transaction as ${r.name}.`, context: { ...ctx, lastCategoryId: r.id, lastCategoryName: r.name }, toast: { message: 'Transaction categorized', type: 'success' } } }
    return { reply: 'Which category should I set?', context: { ...ctx, pendingAssignCategory: { txnId: found.id } } }
  }

  // Set amount
  if (/^(set|update|change) (the )?(last )?(transaction|entry)? ?amount/.test(t) || /set amount to /.test(t)) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const date = parseDateFromText(t)
    let found = items.find(i => /voice entry/i.test(i.description)) ?? items[0]
    if (date) {
      const same = items.find(i => isSameUTCDate(new Date(i.dateISO), date))
      if (same) found = same
    }
    if (!found) return { reply: 'I could not find a recent transaction to update.' }
    const amt = parseAmount(t); if (amt == null) return { reply: 'What amount should I set?', context: { ...ctx, pendingSetAmount: { txnId: found.id } } }
    await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: Math.abs(amt), categoryId: found.categoryId, dateISO: found.dateISO, description: found.description, type: found.type })
    return { reply: `Updated the amount to ${formatCurrency(Math.abs(amt))}.`, toast: { message: 'Amount updated', type: 'success' } }
  }

  // Move to account
  if (/^(move|transfer) (the )?(last )?(transaction|entry)/.test(t) || /move to account /.test(t)) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const date = parseDateFromText(t)
    let found = items.find(i => /voice entry/i.test(i.description)) ?? items[0]; if (!found) return { reply: 'I could not find a recent transaction to move.' }
    if (date) {
      const same = items.find(i => isSameUTCDate(new Date(i.dateISO), date))
      if (same) found = same
    }
    const m = text.match(/to (account )?(.+)$/); if (m?.[2]) { const r = await resolveAccountIdByName(m[2]); if (!r.id) return { reply: `I couldn't find that account. Please say the account again.`, context: { ...ctx, pendingMoveAccount: { txnId: found.id } } }; await api.upsertTransaction({ id: found.id, accountId: r.id, amount: found.amount, categoryId: found.categoryId, dateISO: found.dateISO, description: found.description, type: found.type }); return { reply: `Moved the transaction to ${r.name}.`, toast: { message: 'Transaction moved to account', type: 'success' } } }
    return { reply: 'Which account should I move it to?', context: { ...ctx, pendingMoveAccount: { txnId: found.id } } }
  }

  // Set type
  if (/^(set|make|change) (the )?(last )?(transaction|entry) (to )?(credit|debit|expense|income|refund|charge|purchase)/.test(t)) {
    const api = await getFinanceAPI(); const { items } = await api.listTransactions({ limit: 50 })
    const date = parseDateFromText(t)
    let found = items.find(i => /voice entry/i.test(i.description)) ?? items[0]; if (!found) return { reply: 'I could not find a recent transaction to update.' }
    if (date) {
      const same = items.find(i => isSameUTCDate(new Date(i.dateISO), date))
      if (same) found = same
    }
    const isCredit = /(credit|income|refund)/.test(t); const isDebit = /(debit|expense|charge|purchase)/.test(t)
    if (!isCredit && !isDebit) return { reply: 'Should I set it to debit or credit?', context: { ...ctx, pendingSetType: { txnId: found.id } } }
    const newType = (isCredit ? 'credit' : 'debit')
    await api.upsertTransaction({ id: found.id, accountId: found.accountId, amount: found.amount, categoryId: found.categoryId, dateISO: found.dateISO, description: found.description, type: newType })
    return { reply: `Set the transaction type to ${newType}.`, toast: { message: 'Transaction type updated', type: 'success' } }
  }

  // Undo last transaction (confirm)
  if (/^(undo|revert|delete) (the )?(last )?(transaction|entry)/.test(t)) {
    const api = await getFinanceAPI(); const snap = ctx?.lastTxnSnapshot
    if (!snap) { const { items } = await api.listTransactions({ limit: 50 }); const found = items.find(i => /voice entry/i.test(i.description)); if (found) return { reply: `Do you want me to delete the last voice transaction of ${formatCurrency(found.amount)}?`, context: { ...ctx, pendingDelete: { id: found.id, amount: found.amount } } } }
    if (!snap) return { reply: 'I could not find a recent voice transaction to undo.' }
    const inverseType = snap.type === 'debit' ? 'credit' : 'debit'
    await api.upsertTransaction({ accountId: snap.accountId, amount: snap.amount, categoryId: undefined, dateISO: new Date().toISOString(), description: 'Voice reversal of last entry', type: inverseType })
    return { reply: `Undid the last entry by recording a ${inverseType} of ${formatCurrency(snap.amount)}.`, context: { ...ctx, lastTxnSnapshot: undefined }, toast: { message: 'Reversed last voice transaction', type: 'success' } }
  }

  // Add transaction
  if (/add (a )?transaction|i (spent|paid) |record (an )?expense/.test(t)) {
    const api = await getFinanceAPI(); const amount = parseAmount(t) ?? 0; let cname = parseCategory(t)
    // Heuristic merchant/category mapping when no explicit category provided
    if (!cname) {
      const hint = t.toLowerCase()
      if (/(starbucks|coffee|cafe|restaurant|dining|pizza|burger|chipotle|sushi|thai|kfc|mcdonald)/.test(hint)) cname = 'dining'
      else if (/(uber|lyft|gas|fuel|transport|bus|train|metro|uber eats)/.test(hint)) cname = 'transport'
      else if (/(grocery|groceries|supermarket|costco|trader joe|trader joe's|whole foods|aldi|kroger|safeway)/.test(hint)) cname = 'groceries'
      else if (/(rent|landlord|lease)/.test(hint)) cname = 'rent'
      else if (/(electric|water|utility|utilities|internet|wifi|cable)/.test(hint)) cname = 'utilities'
      else if (/(invest|brokerage|stock|buy shares)/.test(hint)) cname = 'investing'
    }
    let categoryId: string | undefined; if (cname) { const r = await resolveCategoryIdByName(cname); categoryId = r.id }
    const accounts = await api.listAccounts(); const accountId = accounts[0]?.id || 'manual'
    await api.upsertTransaction({ accountId, amount: Math.abs(amount), categoryId, dateISO: new Date().toISOString(), description: `Voice entry${cname ? ' - ' + cname : ''}`, type: 'debit' })
    return { reply: `Recorded ${formatCurrency(Math.abs(amount))}${cname ? ' for ' + cname : ''}.`, context: { lastCategoryId: categoryId, lastCategoryName: cname, lastTxnSnapshot: { accountId, amount: Math.abs(amount), type: 'debit' }, lastRefIndex: 1 }, toast: { message: 'Transaction recorded', type: 'success' } }
  }

  // Relative follow-ups and Nth edits (amount)
  if (/(make it|set it to|change it to)\s+(-?\$?\d+[\d,]*(?:\.\d+)?)/.test(t)) {
    const api = await getFinanceAPI()
    const n = parseOrdinal(t)
    const target = await resolveTargetTransaction(n, true, ctx?.lastRefIndex)
    const amt = parseAmount(t)
    if (target && amt != null) {
      const f = target.tx
      await api.upsertTransaction({ id: f.id, accountId: f.accountId, amount: Math.abs(amt), categoryId: f.categoryId, dateISO: f.dateISO, description: f.description, type: f.type })
      return { reply: `Okay, updated it to ${formatCurrency(Math.abs(amt))}.`, context: { ...ctx, lastRefIndex: target.index, lastRefTxnId: f.id }, toast: { message: 'Amount updated', type: 'success' } }
    }
  }

  // Small talk
  if (/how are you/.test(t)) return { reply: "I'm doing well! How can I assist you?" }

  return { reply: "I didn't catch that. Try: 'rename last transaction to Starbucks', 'set amount to 12 dollars', 'categorize last as groceries', or 'move last transaction to checking'." }
}
