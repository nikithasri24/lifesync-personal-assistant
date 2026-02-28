import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
      data: [{ id: 't1', title: 'Task One', created_at: now, user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] }],
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
      // Simulate what the real hook does: update due_date with hour when dropped on calendar-hour section
      if (sectionKey.startsWith('calendar-hour-')) {
        const parts = sectionKey.replace('calendar-hour-', '').split('-')
        // Format: YYYY-MM-DD-HH
        const year = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1
        const day = parseInt(parts[2])
        const hour = parseInt(parts[3])
        const d = new Date(Date.UTC(year, month, day, hour))
        updateTaskMutation.mutate({ id: 't1', updates: { due_date: d.toISOString() } })
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

describe('Calendar hour drop', () => {
  beforeEach(() => {
    updateTaskMock.mockClear()
    capturedHandleDropOnSection = null
  })

  it('renders the Todos page', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    expect(await screen.findByText('Tasks')).toBeInTheDocument()
  })

  it('sets due_date with hour when dropped on calendar-hour section via drag handler', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    await screen.findByText('Tasks')

    // Invoke the handleDropOnSection directly with a calendar-hour key
    expect(capturedHandleDropOnSection).not.toBeNull()
    capturedHandleDropOnSection!('calendar-hour-2025-01-02-10', {} as React.DragEvent)

    expect(updateTaskMock).toHaveBeenCalled()
    const callArgs = updateTaskMock.mock.calls[0][0]
    const d = new Date(callArgs.updates.due_date)
    expect(d.getUTCFullYear()).toBe(2025)
    expect(d.getUTCMonth()).toBe(0) // Jan
    expect(d.getUTCDate()).toBe(2)
    expect(d.getUTCHours()).toBe(10)
  })
})
