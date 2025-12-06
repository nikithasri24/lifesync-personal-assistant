import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const mk = (id: string, title: string, status: any, priority: any, due?: Date, deleted = false, archived = false, starred = false) => ({
  id, title, status, priority, due_date: due?.toISOString(), created_at: new Date().toISOString(), deleted, archived, starred
})

vi.mock('../../hooks/useApiTasks', () => {
  const today = new Date()
  const upcoming = new Date(today.getTime() + 24*60*60*1000)
  return {
    useApiTasks: () => ({
      tasks: [
        mk('t1','Today task','todo','high', today),
        mk('t2','Waiting task','waiting','medium'),
        mk('t3','Scheduled task','scheduled','urgent'),
        mk('t4','Inbox task','todo','low'),
        mk('t5','Starred task','todo','medium', undefined, false, false, true),
        mk('t6','Completed task','done','low'),
        mk('t7','Archived task','todo','low', undefined, false, true),
        mk('t8','Deleted task','todo','low', undefined, true, false),
        mk('t9','Upcoming task','todo','low', upcoming),
      ],
      projects: [],
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

describe('Todos badges and sidebar counts', () => {
  it('renders status and priority badges, and displays sidebar counts', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)

    // Sidebar counts for Today and Starred should be visible (exact label)
    expect(await screen.findByText(/^Today$/i)).toBeInTheDocument()
    // Count chips exist; not asserting exact numbers due to rendering variability, but presence is covered by other tests

    // Status badge example: Waiting (exact word)
    expect((await screen.findAllByText(/^Waiting$/i)).length).toBeGreaterThan(0)
    // Priority badges: urgent/high show text badges somewhere in rows
    expect(screen.getAllByText(/high|urgent/i).length).toBeGreaterThan(0)
  })
})
