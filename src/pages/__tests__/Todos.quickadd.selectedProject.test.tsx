import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const createTaskMock = vi.fn()

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [],
      projects: [{ id: 'p1', name: 'My Project', created_at: now }],
      loading: false,
      error: null,
      createTask: createTaskMock,
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

describe('Quick Add respects selected project', () => {
  it('defaults project_id to selected project when no #project token', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    // Select project in sidebar
    fireEvent.click(await screen.findByText('My Project'))

    // Open quick add and add a simple task
    const btn = screen.getByRole('button', { name: /Add to My Project/i })
    fireEvent.click(btn)
    const input = screen.getByPlaceholderText(/Add task to My Project/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New Task' } })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }))

    expect(createTaskMock).toHaveBeenCalled()
    const args = createTaskMock.mock.calls[0][0]
    expect(args.project_id).toBe('p1')
  })
})
