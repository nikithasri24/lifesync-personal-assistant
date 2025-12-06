import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { mockDndKit, simulateCompleteDragDrop, resetDragDropMocks, validateDragSetup } from '../../test/drag-drop-utils'

mockDndKit()

const updateTaskMock = vi.fn()

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [{ id: 't1', title: 'Task', created_at: now }],
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
    })
  }
})

describe('Calendar date drop', () => {
  beforeEach(() => { resetDragDropMocks(); updateTaskMock.mockClear() })

  it('sets due_date when dropped on calendar-date', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('task-t1', 'calendar-date-2025-04-15')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updates] = updateTaskMock.mock.calls[0]
    const d = new Date((updates as any).due_date)
    expect(d.getUTCFullYear()).toBe(2025)
    expect(d.getUTCMonth()).toBe(3)
    expect(d.getUTCDate()).toBe(15)
  })
})
