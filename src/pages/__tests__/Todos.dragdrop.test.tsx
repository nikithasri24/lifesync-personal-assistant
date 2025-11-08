import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { mockDndKit, simulateCompleteDragDrop, resetDragDropMocks, validateDragSetup } from '../../test/drag-drop-utils'

// Mock DnD Kit before importing component
mockDndKit()

// Mock useApiTasks to provide minimal data and no-ops
const updateTaskMock = vi.fn()
vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [
        { id: '1', title: 'First Task', created_at: now },
        { id: '2', title: 'Second Task', created_at: now },
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

// Spy on reorderTasks API
const reorderSpy = vi.fn().mockResolvedValue({ success: true, updated: 2 })
vi.mock('../../services/apiClient', async (orig) => {
  const actual = await (orig as any)()
  return {
    __esModule: true,
    ...actual,
    default: { ...actual.default, reorderTasks: reorderSpy },
    apiClient: { ...actual.apiClient, reorderTasks: reorderSpy },
  }
})

describe('Todos drag-and-drop reorder', () => {
  beforeEach(() => {
    resetDragDropMocks()
    reorderSpy.mockClear()
    updateTaskMock.mockClear()
  })

  it('reorders tasks and calls reorder API with new positions', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)

    // Ensure drag handlers were wired
    validateDragSetup()

    // Simulate dragging task-2 above task-1
    simulateCompleteDragDrop('task-2', 'task-1')

    // Expect API called with new order where task-2 has position 0
    expect(reorderSpy).toHaveBeenCalled()
    const payload = reorderSpy.mock.calls[0][0] as Array<{ id: string; position: number }>
    // Find positions
    const pos2 = payload.find((p) => p.id === '2')?.position
    const pos1 = payload.find((p) => p.id === '1')?.position
    expect(pos2).toBe(0)
    expect(pos1).toBeGreaterThan(0)
  })

  it('drops a task onto Today and updates due_date', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)

    validateDragSetup()

    // Simulate dragging task id '1' over the Today sidebar droppable
    simulateCompleteDragDrop('1', 'sidebar-today')

    expect(updateTaskMock).toHaveBeenCalled()
    const [idArg, updatesArg] = updateTaskMock.mock.calls[0]
    expect(idArg).toBe('1')
    // updatesArg should include a due_date ISO string for today
    const due = new Date((updatesArg as any).due_date)
    const today = new Date()
    expect(due instanceof Date && !isNaN(due.getTime())).toBe(true)
    expect(due.toISOString().slice(0, 10)).toBe(today.toISOString().slice(0, 10))
  })

  it('drops a task onto Inbox and sets status todo', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('1', 'sidebar-inbox')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    expect((updatesArg as any).status).toBe('todo')
  })

  it('drops a task onto Scheduled and sets status scheduled', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('1', 'sidebar-scheduled')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    expect((updatesArg as any).status).toBe('scheduled')
  })

  it('drops a task onto Waiting and sets status waiting', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('1', 'sidebar-waiting')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    expect((updatesArg as any).status).toBe('waiting')
  })

  it('drops a task onto Starred and toggles starred', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('1', 'sidebar-starred')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    expect((updatesArg as any).starred).toBe(true)
  })

  it('drops a task onto Completed and sets status done with completed_at', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('1', 'sidebar-completed')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    expect((updatesArg as any).status).toBe('done')
    expect(new Date((updatesArg as any).completed_at) instanceof Date).toBe(true)
  })

  it('drops a task onto Archived and sets archived true', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('1', 'sidebar-archived')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    expect((updatesArg as any).archived).toBe(true)
  })

  it('drops a task onto Upcoming and sets due_date ~7 days ahead', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)
    validateDragSetup()
    simulateCompleteDragDrop('1', 'sidebar-upcoming')
    expect(updateTaskMock).toHaveBeenCalled()
    const [, updatesArg] = updateTaskMock.mock.calls[0]
    const due = new Date((updatesArg as any).due_date)
    const now = new Date()
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBeGreaterThanOrEqual(6)
    expect(diffDays).toBeLessThanOrEqual(8)
  })
})
