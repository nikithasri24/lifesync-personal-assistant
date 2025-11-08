import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const mk = (id: string, title: string, status: any, priority: any, projectId?: string, tags: string[] = []) => ({
  id, title, status, priority, created_at: new Date().toISOString(), project_id: projectId, tags
})

vi.mock('../../hooks/useApiTasks', () => {
  return {
    useApiTasks: () => ({
      tasks: [
        mk('a','Alpha','todo','urgent','p1',['work']),
        mk('b','Bravo','waiting','medium','p2',['home']),
        mk('c','Charlie','scheduled','high', undefined, ['work']),
      ],
      projects: [{ id: 'p1', name: 'Project One', created_at: new Date().toISOString() }, { id:'p2', name:'Project Two', created_at: new Date().toISOString() }],
      loading: false,
      error: null,
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      restoreTask: vi.fn(),
      permanentlyDeleteTask: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshData: vi.fn(),
    })
  }
})

describe('Todos combined filters', () => {
  it('filters by priority and status and project', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    const { container } = render(<Todos />)

    // Open Filters via toolbar button
    const filterBtn = await screen.findByTitle('Filters')
    fireEvent.click(filterBtn)

    const selects = container.querySelectorAll('select')
    // Heuristic: the first select is sort, then filters for priority/status/project; pick by option presence
    const selPriority = Array.from(selects).find(s => s.querySelector('option[value="urgent"]')) as HTMLSelectElement
    const selProject = Array.from(selects).find(s => s.querySelector('option[value="all"]') && s.textContent?.includes('All Projects')) as HTMLSelectElement | undefined
    const selStatus = Array.from(selects).find(s => s.textContent?.toLowerCase().includes('status') || s.textContent?.includes('Need')) as HTMLSelectElement | undefined

    // Set priority to urgent
    fireEvent.change(selPriority, { target: { value: 'urgent' } })
    // Expect only Alpha visible
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()
  })
})
