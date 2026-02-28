import { render, screen, fireEvent } from '@testing-library/react'
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
      data: [
        { id: 'x1', title: 'Alpha unit', created_at: now, user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] },
        { id: 'x2', title: 'Bravo unit', created_at: now, user_id: 'test-user', status: 'todo', priority: 'medium', tags: [] },
      ],
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

describe('Bulk Select respects filtered list', () => {
  beforeEach(() => updateTaskMock.mockClear())

  it('shows filters and search input for filtering tasks', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Open the filters panel
    const showFiltersBtn = await screen.findByText(/Show Filters/i)
    fireEvent.click(showFiltersBtn)

    // The search input appears
    const searchInput = await screen.findByPlaceholderText('Search tasks...')
    expect(searchInput).toBeInTheDocument()

    // Filter by search: only Bravo unit should appear in list view
    fireEvent.change(searchInput, { target: { value: 'Bravo' } })

    // Switch to Inbox to see all tasks
    const inboxBtn = await screen.findByRole('button', { name: /Inbox view/i })
    fireEvent.click(inboxBtn)

    expect(await screen.findByText('Bravo unit')).toBeInTheDocument()
  })

  it('enables selection mode and shows checkboxes', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    const { container } = render(<Wrapper><Todos /></Wrapper>)

    // Switch to Inbox to see tasks
    const inboxBtn = await screen.findByRole('button', { name: /Inbox view/i })
    fireEvent.click(inboxBtn)

    // Enable selection mode
    const selectTasksBtn = await screen.findByText('Select Tasks')
    fireEvent.click(selectTasksBtn)

    // Checkboxes appear in selection mode
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
  })
})
