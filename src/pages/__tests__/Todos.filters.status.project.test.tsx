import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mk = (id: string, title: string, status: any, projectId?: string) => ({
  id, title, status, priority: 'medium', created_at: new Date().toISOString(), project_id: projectId ?? null, tags: [], user_id: 'test-user', due_date: null,
})

const mockTasks = [
  mk('a', 'Alpha', 'todo', 'p1'),
  mk('b', 'Bravo', 'todo', 'p2'),
  mk('c', 'Charlie', 'done', 'p1'),
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

describe('Todos status and project filters', () => {
  it('filters by project via filter bar project pill', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Switch to List view to see all tasks
    const listBtn = await screen.findByRole('button', { name: /List view/i })
    fireEvent.click(listBtn)

    // Open filters
    const showFiltersBtn = await screen.findByText(/Show Filters/i)
    fireEvent.click(showFiltersBtn)

    // Click Project One filter pill using exact text match
    const allBtns = await screen.findAllByRole('button')
    const projOneBtn = allBtns.find(btn => btn.textContent?.trim() === 'Project One')
    expect(projOneBtn).toBeTruthy()
    fireEvent.click(projOneBtn!)

    // Alpha and Charlie (p1) should be visible; Bravo (p2) should not
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(await screen.findByText('Charlie')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).toBeNull()
  })

  it('filters by Done status via filter bar', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Switch to List view
    const listBtn = await screen.findByRole('button', { name: /List view/i })
    fireEvent.click(listBtn)

    // Open filters
    const showFiltersBtn = await screen.findByText(/Show Filters/i)
    fireEvent.click(showFiltersBtn)

    // Click Done status pill
    const doneBtn = await screen.findByRole('button', { name: /^Done$/i })
    fireEvent.click(doneBtn)

    // Only Charlie (done) should be visible
    expect(await screen.findByText('Charlie')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).toBeNull()
    expect(screen.queryByText('Bravo')).toBeNull()
  })
})
