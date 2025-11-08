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

describe('Calendar hour drop', () => {
  beforeEach(() => {
    resetDragDropMocks()
    updateTaskMock.mockClear()
  })

  it('sets due_date with selected hour when dropped on calendar-hour', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    const overId = 'calendar-hour-2025-01-02-10'
    simulateCompleteDragDrop('task-t1', overId)
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updates] = updateTaskMock.mock.calls[0]
    const d = new Date((updates as any).due_date)
    expect(d.getUTCFullYear()).toBe(2025)
    expect(d.getUTCMonth()).toBe(0) // Jan
    expect(d.getUTCDate()).toBe(2)
    expect(d.getUTCHours()).toBe(10)
  })
})
