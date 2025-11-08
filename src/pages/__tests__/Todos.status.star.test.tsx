import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const updateTaskMock = vi.fn()

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [
        { id: 't1', title: 'Toggle Me', created_at: now, status: 'todo', priority: 'medium', tags: [] },
      ],
      projects: [],
      loading: false,
      error: null,
      createTask: vi.fn(),
      updateTask: updateTaskMock,
      deleteTask: vi.fn(),
      restoreTask: vi.fn(),
      permanentlyDeleteTask: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshData: vi.fn(),
    }),
  }
})

describe('Todos status and star toggles', () => {
  beforeEach(() => {
    updateTaskMock.mockClear()
  })

  it('toggles star via action button', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    const starBtn = await screen.findByTitle('Star task')
    fireEvent.click(starBtn)
    expect(updateTaskMock).toHaveBeenCalled()
    const [idArg, updatesArg] = updateTaskMock.mock.calls[0]
    expect(idArg).toBe('t1')
    expect((updatesArg as any).starred).toBe(true)
  })

  it('marks complete via status button', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    // Click explicit status toggle by title
    const toggleBtn = await screen.findByTitle(/Mark complete|Mark as not done/i)
    fireEvent.click(toggleBtn)
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    expect((updatesArg as any).status).toBeDefined()
  })
})
