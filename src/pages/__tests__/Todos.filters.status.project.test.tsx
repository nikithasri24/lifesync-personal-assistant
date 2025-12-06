import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const mk = (id: string, title: string, status: any, projectId?: string) => ({
  id, title, status, priority: 'medium', created_at: new Date().toISOString(), project_id: projectId, tags: []
})

vi.mock('../../hooks/useApiTasks', () => {
  return {
    useApiTasks: () => ({
      tasks: [
        mk('a','Alpha','todo','p1'),
        mk('b','Bravo','waiting','p2'),
        mk('c','Charlie','scheduled','p1'),
      ],
      projects: [ { id:'p1', name:'Project One', created_at: new Date().toISOString() }, { id:'p2', name:'Project Two', created_at: new Date().toISOString() } ],
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

describe('Todos status and project filters', () => {
  it('filters by project via sidebar click', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    // Click Project One in sidebar
    const projEls = await screen.findAllByText(/^Project One$/)
    fireEvent.click(projEls[0])
    // Alpha and Charlie belong to p1; Bravo (p2) should be hidden
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(await screen.findByText('Charlie')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).toBeNull()
  })

  it('filters by status when using Smart Lists', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    // Click Waiting For smart list
    fireEvent.click(await screen.findByText('Waiting For'))
    expect(await screen.findByText('Bravo')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()
  })
})
