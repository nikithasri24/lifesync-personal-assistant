import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const updateTaskMock = vi.fn()

const mockStatusStarTasks = [
  { id: 't1', title: 'Toggle Me', created_at: new Date().toISOString(), user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] },
]

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: any) => children,
}))

vi.mock('../../hooks/useTasksQuery', () => {
  return {
    useTasks: () => ({
      data: mockStatusStarTasks,
      isLoading: false,
      error: null,
    }),
    usePagedTasks: () => ({
    data: { items: mockStatusStarTasks, totalPages: 1, total: mockStatusStarTasks.length },
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

vi.mock('../../todos/hooks', () => ({
  useTodosDragDrop: () => ({
    draggedTask: null,
    draggedTaskIds: new Set(),
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDropOnSection: vi.fn(),
    handleDragOver: vi.fn(),
  }),
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

describe('Todos status and star toggles', () => {
  beforeEach(() => {
    updateTaskMock.mockClear()
  })

  it('renders task and toggles status via checkbox click', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Switch to Inbox view to see the task
    const inboxBtn = await screen.findByRole('button', { name: /Inbox view/i })
    fireEvent.click(inboxBtn)

    // Task title should be visible
    expect(await screen.findByText('Toggle Me')).toBeInTheDocument()

    // Toggle status via the checkbox (role="checkbox") - CheckboxV2 is a button with role="checkbox"
    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
    fireEvent.click(checkboxes[0])

    expect(updateTaskMock).toHaveBeenCalled()
    const callArgs = updateTaskMock.mock.calls[0][0]
    expect(callArgs.updates.status).toBeDefined()
  })

  it('renders task title in the task list', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Switch to Inbox view
    const inboxBtn = await screen.findByRole('button', { name: /Inbox view/i })
    fireEvent.click(inboxBtn)

    // Task should be visible
    expect(await screen.findByText('Toggle Me')).toBeInTheDocument()
  })
})
