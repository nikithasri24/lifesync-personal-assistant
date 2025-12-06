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
      projects: [{ id: 'p1', name: 'Unit Project', created_at: now }],
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

describe('Drag to project (unit)', () => {
  beforeEach(() => { resetDragDropMocks(); updateTaskMock.mockClear() })

  it('updates project_id when dropped on project sidebar', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('task-t1', 'sidebar-project-p1')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updates] = updateTaskMock.mock.calls[0]
    expect((updates as any).project_id).toBe('p1')
  })
})

