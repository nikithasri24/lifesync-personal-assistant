import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mk = (id: string, title: string, priority: 'low' | 'medium' | 'high' | 'urgent', status: string, due?: Date, created?: Date) => ({
  id, title, priority, status, due_date: due?.toISOString() ?? null, created_at: (created || new Date()).toISOString(), user_id: 'test-user', tags: [],
})

const now = new Date()
const mockTasks = [
  mk('a', 'Alpha', 'medium', 'todo', new Date(now.getTime() + 86400000)),
  mk('b', 'Bravo', 'high', 'todo', new Date(now.getTime() + 2 * 86400000)),
  mk('c', 'Charlie', 'low', 'done', new Date(now.getTime() + 3 * 86400000)),
]

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: any) => children,
}))

vi.mock('../../hooks/useTasksQuery', () => ({
  useTasks: () => ({ data: mockTasks, isLoading: false, error: null }),
  usePagedTasks: (filters?: { search?: string; status?: string; priority?: string }) => {
    let items = mockTasks
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      items = items.filter(t => t.title.toLowerCase().includes(q))
    }
    if (filters?.status) {
      items = items.filter(t => t.status === filters.status)
    }
    if (filters?.priority) {
      items = items.filter(t => t.priority === filters.priority)
    }
    return { data: { items, totalPages: 1, total: items.length }, isLoading: false, error: null }
  },
  useProjects: () => ({
    data: [{ id: 'p1', name: 'Project One', created_at: new Date().toISOString(), user_id: 'test-user' }],
    isLoading: false,
    error: null,
  }),
  useCreateTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  usePermanentlyDeleteTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useMergedTasksConnectionQuery: () => ({ data: null, isLoading: false }),
}))

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

describe('Todos filters and sort', () => {
  it('filters by search query', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Open filters to get the search input
    const showFiltersBtn = await screen.findByText(/Show Filters/i)
    fireEvent.click(showFiltersBtn)

    const search = await screen.findByPlaceholderText('Search tasks...')
    fireEvent.change(search, { target: { value: 'Bravo' } })

    // Switch to List view to see all tasks
    const listBtn = await screen.findByRole('button', { name: /List view/i })
    fireEvent.click(listBtn)

    expect(await screen.findByText('Bravo')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()
  })

  it('renders all tasks in List view without filters', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Switch to List view to see all tasks
    const listBtn = await screen.findByRole('button', { name: /List view/i })
    fireEvent.click(listBtn)

    // All three tasks should be visible in List view
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })
})
