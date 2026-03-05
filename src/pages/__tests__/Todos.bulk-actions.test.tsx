import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const updateTaskMock = vi.fn()
const deleteTaskMock = vi.fn()

const mockBulkTasks = [
  { id: 'a1', title: 'Task A', created_at: new Date().toISOString(), user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] },
  { id: 'b2', title: 'Task B', created_at: new Date().toISOString(), user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] },
]

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: any) => children,
}))

vi.mock('../../hooks/useTasksQuery', () => {
  return {
    useTasks: () => ({
      data: mockBulkTasks,
      isLoading: false,
      error: null,
    }),
    usePagedTasks: () => ({
    data: { items: mockBulkTasks, totalPages: 1, total: mockBulkTasks.length },
    isLoading: false,
    error: null,
  }),
  useProjects: () => ({ data: [], isLoading: false, error: null }),
    useCreateTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useUpdateTask: () => ({ mutate: updateTaskMock, mutateAsync: vi.fn(), isPending: false }),
    usePermanentlyDeleteTask: () => ({ mutate: deleteTaskMock, mutateAsync: deleteTaskMock, isPending: false }),
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

describe('Todos bulk actions', () => {
  beforeEach(() => {
    updateTaskMock.mockClear()
    deleteTaskMock.mockClear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('enables selection mode and shows Select Tasks button', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Wait for render
    expect(await screen.findByText('Tasks')).toBeInTheDocument()

    // Enable bulk mode via "Select Tasks" button
    const selectTasksBtn = await screen.findByText('Select Tasks')
    fireEvent.click(selectTasksBtn)

    // After clicking, button text changes to "Cancel Selection"
    expect(await screen.findByText('Cancel Selection')).toBeInTheDocument()
  })

  it('deletes selected tasks via bulk action after confirmation', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    const { container } = render(<Wrapper><Todos /></Wrapper>)

    // Wait for render
    expect(await screen.findByText('Tasks')).toBeInTheDocument()

    // Switch to Inbox to see all tasks (today view filters by due date)
    const inboxBtn = await screen.findByRole('button', { name: /Inbox view/i })
    fireEvent.click(inboxBtn)

    // Enable selection mode
    const selectTasksBtn = await screen.findByText('Select Tasks')
    fireEvent.click(selectTasksBtn)

    // Checkboxes should appear - select Task A
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
    fireEvent.click(checkboxes[0])

    // Bulk action bar should appear with Delete Selected button
    const deleteBtn = await screen.findByText('Delete Selected')
    fireEvent.click(deleteBtn)

    // deleteTaskMock (mutateAsync) should have been called
    expect(deleteTaskMock).toHaveBeenCalled()
  })
})
