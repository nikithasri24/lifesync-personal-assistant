import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'

const mk = (id: string, title: string, priority: 'low'|'medium'|'high'|'urgent', status: string, due?: Date, created?: Date, projectId?: string, tags: string[] = []) => ({
  id, title, priority, status, due_date: due?.toISOString(), created_at: (created||new Date()).toISOString(), project_id: projectId, tags
})

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date()
  return {
    useApiTasks: () => ({
      tasks: [
        mk('a','Alpha','medium','todo', new Date(now.getTime()+86400000)),
        mk('b','Bravo','high','waiting', new Date(now.getTime()+2*86400000)),
        mk('c','Charlie','low','todo', new Date(now.getTime()+3*86400000)),
      ],
      projects: [ { id: 'p1', name: 'Project One', created_at: now.toISOString() } ],
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

describe('Todos filters and sort', () => {
  it('filters by search query', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)

    const search = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(search, { target: { value: 'Bravo' } })
    expect(await screen.findByText('Bravo')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()
  })

  it('sorts by title A-Z', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    const { container } = render(<Todos />)

    // Change sort to title-asc
    const sortSelect = container.querySelector('select') as HTMLSelectElement
    fireEvent.change(sortSelect, { target: { value: 'title-asc' } })

    // Get rows by occurrence order and verify order of titles
    const rows = container.querySelectorAll('div.group')
    const titles = Array.from(rows).map(r => (r.textContent || ''))
    const idx = (name: string) => titles.findIndex(t => t.includes(name))
    expect(idx('Alpha')).toBeLessThan(idx('Bravo'))
    expect(idx('Bravo')).toBeLessThan(idx('Charlie'))
  })
})

