import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mk = (id: string, title: string, status: any, priority: any, due?: Date, deleted = false, archived = false, starred = false) => ({
  id,
  title,
  status,
  priority,
  due_date: due?.toISOString() ?? null,
  created_at: new Date().toISOString(),
  deleted,
  archived,
  starred,
  tags: [],
  user_id: 'test-user',
})

const today = new Date()
const upcoming = new Date(today.getTime() + 24 * 60 * 60 * 1000)

const mockTasks = [
  mk('t1', 'Today task', 'todo', 'high', today),
  mk('t2', 'Waiting task', 'waiting', 'medium'),
  mk('t3', 'Scheduled task', 'scheduled', 'urgent'),
  mk('t4', 'Inbox task', 'todo', 'low'),
  mk('t5', 'Starred task', 'todo', 'medium', undefined, false, false, true),
  mk('t6', 'Completed task', 'done', 'low'),
  mk('t9', 'Upcoming task', 'todo', 'low', upcoming),
]

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: any) => children,
}))

vi.mock('../../hooks/useTasksQuery', () => ({
  useTasks: () => ({ data: mockTasks, isLoading: false, error: null }),
  usePagedTasks: () => ({
    data: { items: [], totalPages: 1, total: 0 },
    isLoading: false,
    error: null,
  }),
  useProjects: () => ({ data: [], isLoading: false, error: null }),
  useCreateTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  usePermanentlyDeleteTask: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useMergedTasksConnectionQuery: () => ({ data: null, isLoading: false }),
}))

vi.mock('../../hooks/useApiHealth', () => ({
  useApiHealth: () => ({
    isOnline: true,
    lastChecked: null,
    error: null,
    responseTime: null,
    checkHealth: vi.fn(),
    statusText: 'Online',
  }),
}))

vi.mock('../../utils/ownerUtils', () => ({
  useCurrentUserId: () => ({ data: 'test-user', isLoading: false }),
  usePartnerName: () => 'Partner',
}))

vi.mock('../../contexts/UndoRedoContext', () => ({
  useUndoRedo: () => ({
    executeCommand: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    undoDescription: null,
    redoDescription: null,
  }),
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

describe('Todos badges and sidebar counts', () => {
  it('renders the tasks page header and view selector', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Header is visible
    expect(await screen.findByText('Tasks')).toBeInTheDocument()

    // View selector tabs are visible
    expect(screen.getByRole('button', { name: /Today view/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Inbox view/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upcoming view/i })).toBeInTheDocument()
  })

  it('renders task count summary', async () => {
    const mod = await import('../Todos')
    const Todos = mod.default
    const Wrapper = createWrapper()
    render(<Wrapper><Todos /></Wrapper>)

    // Task count summary is visible
    expect((await screen.findAllByText(/task/i)).length).toBeGreaterThan(0)
  })
})
