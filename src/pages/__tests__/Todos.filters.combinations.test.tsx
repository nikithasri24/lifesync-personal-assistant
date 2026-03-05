import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mk = (id: string, title: string, status: any, priority: any, projectId?: string, tags: string[] = []) => ({
  id, title, status, priority, created_at: new Date().toISOString(), project_id: projectId ?? null, tags, user_id: 'test-user', due_date: null,
})

const mockTasks = [
  mk('a', 'Alpha', 'todo', 'urgent', 'p1', ['work']),
  mk('b', 'Bravo', 'done', 'medium', 'p2', ['home']),
  mk('c', 'Charlie', 'todo', 'high', undefined, ['work']),
]

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: any) => children,
}))

vi.mock('../../hooks/useTasksQuery', () => ({
  useTasks: () => ({ data: mockTasks, isLoading: false, error: null }),
  usePagedTasks: (filters?: { search?: string; status?: string; priority?: string; projectId?: string }) => {
    let items = mockTasks
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      items = items.filter(t => t.title.toLowerCase().includes(q))
    }
    if (filters?.status) items = items.filter(t => t.status === filters.status)
    if (filters?.priority) items = items.filter(t => t.priority === filters.priority)
    if (filters?.projectId) items = items.filter(t => t.project_id === filters.projectId)
    return { data: { items, totalPages: 1, total: items.length }, isLoading: false, error: null }
  },
  useProjects: () => ({
    data: [
      { id: 'p1', name: 'Project One', created_at: new Date().toISOString(), user_id: 'test-user' },
      { id: 'p2', name: 'Project Two', created_at: new Date().toISOString(), user_id: 'test-user' },
    ],
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

describe('Todos combined filters', () => {
  it('filters by priority pill button to show only urgent tasks', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Switch to List view to see all tasks
    const listBtn = await screen.findByRole('button', { name: /List view/i })
    fireEvent.click(listBtn)

    // Open the filters panel
    const showFiltersBtn = await screen.findByText(/Show Filters/i)
    fireEvent.click(showFiltersBtn)

    // All tasks visible initially
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()

    // Find and click the Urgent priority pill
    const urgentBtn = await screen.findByRole('button', { name: /🔥 Urgent/i })
    fireEvent.click(urgentBtn)

    // Only Alpha (urgent priority) should be visible in List view
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()
  })

  it('filters by status done to show only completed tasks', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Switch to List view to see all tasks
    const listBtn = await screen.findByRole('button', { name: /List view/i })
    fireEvent.click(listBtn)

    // Open the filters panel
    const showFiltersBtn = await screen.findByText(/Show Filters/i)
    fireEvent.click(showFiltersBtn)

    // Click the Done status pill
    const doneBtn = await screen.findByRole('button', { name: /^Done$/i })
    fireEvent.click(doneBtn)

    // Only Bravo (done status) should be visible
    expect(await screen.findByText('Bravo')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()
  })
})
