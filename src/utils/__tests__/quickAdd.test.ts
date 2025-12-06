import { describe, it, expect } from 'vitest'
import { parseQuickAdd, parseSubtaskQuickAdd } from '../quickAdd'

const projects = [
  { id: 'p1', name: 'Acme Website' },
  { id: 'p2', name: 'Marketing' },
]

describe('parseQuickAdd', () => {
  it('parses tags, date, priority and project (explicit)', () => {
    const r = parseQuickAdd('Email client #project:"Acme Website" #followup @tomorrow !high', projects)
    expect(r.title).toBe('Email client')
    expect(r.projectId).toBe('p1')
    expect(r.tags).toContain('followup')
    expect(r.priority).toBe('high')
    expect(r.dueDate).toBeInstanceOf(Date)
  })

  it('supports numeric priority and ISO date', () => {
    const r = parseQuickAdd('Kickoff deck #project:Marketing @2025-10-01 !1', projects)
    expect(r.priority).toBe('urgent')
    expect(r.projectId).toBe('p2')
    expect(r.dueDate?.toISOString().startsWith('2025-10-01')).toBe(true)
  })

  it('leaves project empty when not matched and collects #tags and @tags', () => {
    const r = parseQuickAdd('Draft agenda #ops @planning !low', projects)
    expect(r.projectId).toBe('')
    expect(r.tags.sort()).toEqual(['ops', 'planning'].sort())
    expect(r.priority).toBe('low')
  })

  it('supports quoted project names with spaces', () => {
    const r = parseQuickAdd('Plan sprint #project:"Acme Website" #pm @2025-01-05 !medium', projects)
    expect(r.projectId).toBe('p1')
    expect(r.tags).toContain('pm')
    expect(r.priority).toBe('medium')
    expect(r.dueDate?.toISOString().startsWith('2025-01-05')).toBe(true)
  })

  it('handles mixed token order and extra whitespace', () => {
    const r = parseQuickAdd('  !low   #ops   Write SOP   @tomorrow  ', projects)
    expect(r.title).toBe('Write SOP')
    expect(r.tags).toEqual(['ops'])
    expect(['low']).toContain(r.priority)
    expect(r.dueDate).toBeInstanceOf(Date)
  })
})

describe('parseSubtaskQuickAdd', () => {
  it('parses tags, date and priority', () => {
    const r = parseSubtaskQuickAdd('Write tests #qa @today !medium')
    expect(r.title).toBe('Write tests')
    expect(r.tags).toEqual(['qa'])
    expect(r.priority).toBe('medium')
    expect(r.dueDate).toBeInstanceOf(Date)
  })

  it('supports numeric priority and ISO date for subtask', () => {
    const r = parseSubtaskQuickAdd('Refactor utils #tech @2026-12-31 !1')
    expect(r.title).toBe('Refactor utils')
    expect(r.priority).toBe('urgent')
    expect(r.tags).toEqual(['tech'])
    expect(r.dueDate?.toISOString().startsWith('2026-12-31')).toBe(true)
  })
})
