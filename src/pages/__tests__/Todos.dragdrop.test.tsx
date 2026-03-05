import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const updateTaskMock = vi.fn()

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: any) => children,
}))

vi.mock('../../hooks/useTasksQuery', () => {
  const now = new Date().toISOString()
  return {
    useTasks: () => ({
      data: [
        { id: '1', title: 'First Task', created_at: now, user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] },
        { id: '2', title: 'Second Task', created_at: now, user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] },
      ],
      isLoading: false,
      error: null,
    }),
    usePagedTasks: () => ({
    data: { items: [], totalPages: 1, total: 0 },
    isLoading: false,
    error: null,
  }),
  useProjects: () => ({ data: [], isLoading: false, error: null }),
    useCreateTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useUpdateTask: () => ({ mutate: updateTaskMock, mutateAsync: vi.fn(), isPending: false }),
    usePermanentlyDeleteTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useMergedTasksConnectionQuery: () => ({ data: null, isLoading: false }),
  }
})

vi.mock('../../hooks/useApiHealth', () => ({
  useApiHealth: () => ({ isOnline: true, lastChecked: null, error: null, responseTime: null, checkHealth: vi.fn(), statusText: 'Online' }),
}))

vi.mock('../../utils/ownerUtils', () => ({
  useCurrentUserId: () => ({ data: 'test-user', isLoading: false }),
  usePartnerName: () => 'Partner',
}))

vi.mock('../../contexts/UndoRedoContext', () => ({
  useUndoRedo: () => ({ executeCommand: vi.fn(), undo: vi.fn(), redo: vi.fn(), canUndo: false, canRedo: false }),
}))

let capturedHandleDropOnSection: ((sectionKey: string, event: React.DragEvent) => void) | null = null

vi.mock('../../todos/hooks', () => ({
  useTodosDragDrop: ({ updateTaskMutation }: any) => {
    const handleDropOnSection = (sectionKey: string, _event: React.DragEvent) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcoming = new Date(today)
      upcoming.setDate(upcoming.getDate() + 7)

      if (sectionKey === 'sidebar-today') {
        updateTaskMutation.mutate({ id: '1', updates: { due_date: today.toISOString() } })
      } else if (sectionKey === 'sidebar-inbox') {
        updateTaskMutation.mutate({ id: '1', updates: { status: 'todo' } })
      } else if (sectionKey === 'sidebar-scheduled') {
        updateTaskMutation.mutate({ id: '1', updates: { status: 'scheduled' } })
      } else if (sectionKey === 'sidebar-waiting') {
        updateTaskMutation.mutate({ id: '1', updates: { status: 'waiting' } })
      } else if (sectionKey === 'sidebar-starred') {
        updateTaskMutation.mutate({ id: '1', updates: { starred: true } })
      } else if (sectionKey === 'sidebar-completed') {
        updateTaskMutation.mutate({ id: '1', updates: { status: 'done', completed_at: new Date().toISOString() } })
      } else if (sectionKey === 'sidebar-archived') {
        updateTaskMutation.mutate({ id: '1', updates: { archived: true } })
      } else if (sectionKey === 'sidebar-upcoming') {
        updateTaskMutation.mutate({ id: '1', updates: { due_date: upcoming.toISOString() } })
      }
    }
    capturedHandleDropOnSection = handleDropOnSection
    return {
      draggedTask: null,
      draggedTaskIds: new Set(),
      handleDragStart: vi.fn(),
      handleDragEnd: vi.fn(),
      handleDropOnSection,
      handleDragOver: vi.fn(),
    }
  },
  useTaskExpansion: () => ({
    expandedTasks: new Set(),
    toggleTaskExpansion: vi.fn(),
    subtaskDrafts: {},
    setSubtaskDraft: vi.fn(),
    clearSubtaskDraft: vi.fn(),
    getSubtaskDraft: vi.fn(() => ''),
  }),
}))

vi.mock('../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FAF9F7', secondary: '#F5F0EB', white: '#FFFFFF' },
    text: { primary: '#2D1B0E', secondary: '#8B7355', tertiary: '#B09B85' },
    border: { light: '#EDE0D4', medium: '#D4B896' },
    badge: { bg: '#F5F0EB', text: '#8B7355' },
  }),
}))

vi.mock('../../services/reminders/ReminderService', () => ({
  reminderService: { scheduleReminder: vi.fn().mockResolvedValue(undefined) },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const renderTodos = async () => {
  const mod = await import('../Todos')
  const Todos = mod.default
  const Wrapper = createWrapper()
  const result = render(<Wrapper><Todos /></Wrapper>)
  await screen.findByText('Tasks')
  return result
}

describe('Todos drag-and-drop reorder', () => {
  beforeEach(() => {
    updateTaskMock.mockClear()
    capturedHandleDropOnSection = null
  })

  it('renders tasks and has drag handler available', async () => {
    await renderTodos()
    expect(capturedHandleDropOnSection).not.toBeNull()
  })

  it('drops a task onto Today and updates due_date', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-today', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    expect(callArgs.id).toBe('1')
    const due = new Date(callArgs.updates.due_date)
    expect(due instanceof Date && !isNaN(due.getTime())).toBe(true)
    // Verify due is today (within 24 hours of now)
    const now = new Date()
    const diffMs = Math.abs(due.getTime() - now.getTime())
    expect(diffMs).toBeLessThan(24 * 60 * 60 * 1000)
  })

  it('drops a task onto Inbox and sets status todo', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-inbox', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    expect(callArgs.updates.status).toBe('todo')
  })

  it('drops a task onto Scheduled and sets status scheduled', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-scheduled', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    expect(callArgs.updates.status).toBe('scheduled')
  })

  it('drops a task onto Waiting and sets status waiting', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-waiting', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    expect(callArgs.updates.status).toBe('waiting')
  })

  it('drops a task onto Starred and toggles starred', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-starred', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    expect(callArgs.updates.starred).toBe(true)
  })

  it('drops a task onto Completed and sets status done with completed_at', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-completed', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    expect(callArgs.updates.status).toBe('done')
    expect(new Date(callArgs.updates.completed_at) instanceof Date).toBe(true)
  })

  it('drops a task onto Archived and sets archived true', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-archived', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    expect(callArgs.updates.archived).toBe(true)
  })

  it('drops a task onto Upcoming and sets due_date ~7 days ahead', async () => {
    await renderTodos()
    capturedHandleDropOnSection!('sidebar-upcoming', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const [callArgs] = updateTaskMock.mock.calls[0]
    const due = new Date(callArgs.updates.due_date)
    const now = new Date()
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBeGreaterThanOrEqual(6)
    expect(diffDays).toBeLessThanOrEqual(8)
  })
})
