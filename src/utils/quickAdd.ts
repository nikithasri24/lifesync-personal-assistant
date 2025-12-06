// Quick Add parsing utilities for tasks and subtasks
// Pure functions so they are easy to test with Vitest

export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export interface ProjectRef { id: string; name: string }

export interface TaskQuickAddResult {
  title: string
  priority: Priority
  dueDate: Date | null
  projectId: string
  tags: string[]
}

export interface SubtaskQuickAddResult {
  title: string
  priority?: Priority
  dueDate: Date | null
  tags: string[]
}

const normalizeWhitespace = (s: string) => s.replace(/\s{2,}/g, ' ').trim()

// Parse main Quick Add text
export function parseQuickAdd(text: string, projects: ProjectRef[]): TaskQuickAddResult {
  let title = text
  let priority: Priority = 'medium'
  let dueDate: Date | null = null
  let projectId = ''
  const tagSet = new Set<string>()

  // Dates first: @today, @tomorrow, @YYYY-MM-DD
  if (/@today\b/i.test(text)) {
    dueDate = new Date()
    title = title.replace(/@today\b/ig, '').trim()
  } else if (/@tomorrow\b/i.test(text)) {
    const d = new Date(); d.setDate(d.getDate() + 1)
    dueDate = d
    title = title.replace(/@tomorrow\b/ig, '').trim()
  } else {
    const dm = text.match(/@(\d{4}-\d{2}-\d{2})/)
    if (dm) {
      const d = new Date(dm[1])
      if (!isNaN(d.getTime())) dueDate = d
      title = title.replace(/@(\d{4}-\d{2}-\d{2})/, '').trim()
    }
  }

  // Priority: !urgent|!high|!medium|!low or !1..4; fallback p1..p4
  const prio = text.match(/!(urgent|high|medium|low|[1-4])/i)
  if (prio) {
    const p = prio[1].toLowerCase()
    if (p === 'urgent' || p === 'high' || p === 'medium' || p === 'low') {
      priority = p as Priority
    } else {
      const n = parseInt(p, 10)
      priority = n === 1 ? 'urgent' : n === 2 ? 'high' : n === 3 ? 'medium' : 'low'
    }
    title = title.replace(/!(urgent|high|medium|low|[1-4])/i, '').trim()
  } else {
    const pm = text.match(/\bp([1-4])\b/i)
    if (pm) {
      const n = parseInt(pm[1], 10)
      priority = n === 1 ? 'urgent' : n === 2 ? 'high' : n === 3 ? 'medium' : 'low'
      title = title.replace(/\bp[1-4]\b/i, '').trim()
    }
  }

  // Explicit project: #project:Name or #project:"Name With Spaces"
  const projectTokenMatch = text.match(/#project:("([^"]+)"|[^\s#@!]+)/i)
  if (projectTokenMatch) {
    const rawName = (projectTokenMatch[2] || projectTokenMatch[1] || '').replace(/^"|"$/g, '')
    const project = projects.find(p => p.name.toLowerCase().includes(rawName.toLowerCase()))
    if (project) projectId = project.id
    title = title.replace(projectTokenMatch[0], '').trim()
  }

  // Remaining #tokens become tags (skip #project:...)
  const hashTokens = title.match(/#([\w-:"']+)/g) || []
  for (const token of hashTokens) {
    if (/^#project:/i.test(token)) {
      title = title.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '').trim()
      continue
    }
    const name = token.slice(1)
    tagSet.add(name)
    title = title.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '').trim()
  }

  // @tags (non-date) also become tags
  const atTokens = title.match(/@([\w-]+)/g) || []
  for (const token of atTokens) {
    const t = token.slice(1)
    if (t.toLowerCase() !== 'today' && t.toLowerCase() !== 'tomorrow') tagSet.add(t)
    title = title.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '').trim()
  }

  title = normalizeWhitespace(title)
  return { title, priority, dueDate, projectId, tags: Array.from(tagSet) }
}

// Parse subtask Quick Add text
export function parseSubtaskQuickAdd(text: string): SubtaskQuickAddResult {
  let title = text
  const tags: string[] = []
  let dueDate: Date | null = null
  let priority: Priority | undefined

  // Tags #word or #word-with-dash
  const tagMatches = text.match(/#([\w-]+)/g)
  if (tagMatches) {
    for (const m of tagMatches) {
      const t = m.slice(1)
      if (t) tags.push(t)
    }
    title = title.replace(/#([\w-]+)/g, '').trim()
  }

  // Dates: @today, @tomorrow, @YYYY-MM-DD
  if (/@today\b/i.test(text)) {
    dueDate = new Date()
    title = title.replace(/@today\b/ig, '').trim()
  } else if (/@tomorrow\b/i.test(text)) {
    const d = new Date(); d.setDate(d.getDate() + 1)
    dueDate = d
    title = title.replace(/@tomorrow\b/ig, '').trim()
  } else {
    const dateMatch = text.match(/@(\d{4}-\d{2}-\d{2})/)
    if (dateMatch) {
      const d = new Date(dateMatch[1])
      if (!isNaN(d.getTime())) dueDate = d
      title = title.replace(/@(\d{4}-\d{2}-\d{2})/, '').trim()
    }
  }

  // Priority: !urgent|!high|!medium|!low or !1..4
  const prioMatch = text.match(/!(urgent|high|medium|low|[1-4])/i)
  if (prioMatch) {
    const p = prioMatch[1].toLowerCase()
    if (p === 'urgent' || p === 'high' || p === 'medium' || p === 'low') {
      priority = p as Priority
    } else {
      const n = parseInt(p, 10)
      priority = n === 1 ? 'urgent' : n === 2 ? 'high' : n === 3 ? 'medium' : 'low'
    }
    title = title.replace(/!(urgent|high|medium|low|[1-4])/i, '').trim()
  } else {
    const pm = text.match(/\bp([1-4])\b/i)
    if (pm) {
      const n = parseInt(pm[1], 10)
      priority = n === 1 ? 'urgent' : n === 2 ? 'high' : n === 3 ? 'medium' : 'low'
      title = title.replace(/\bp[1-4]\b/i, '').trim()
    }
  }

  title = normalizeWhitespace(title)
  return { title, tags, dueDate, priority }
}

