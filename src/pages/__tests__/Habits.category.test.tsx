import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createHabitMock = vi.fn()
const updateHabitMock = vi.fn()

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h1',
        name: 'Plan day',
        description: '',
        frequency: 'daily',
        target_count: 1,
        category_id: 'work',
        icon: '📋',
        color: '#22c55e',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'h2',
        name: 'Run',
        description: '',
        frequency: 'daily',
        target_count: 1,
        category_id: 'health',
        icon: '🏃',
        color: '#22c55e',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
    error: null,
  }),
  useHabit: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useHabitEntries: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useHabitEntriesForHabit: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useCreateHabit: () => ({
    mutate: createHabitMock,
    isPending: false,
  }),
  useUpdateHabit: () => ({
    mutate: updateHabitMock,
    isPending: false,
  }),
  useDeleteHabit: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCreateHabitEntry: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateHabitEntry: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteHabitEntry: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteHabitEntriesForDate: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteHabitEntriesForDateRange: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteAllHabitEntries: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('../../hooks/useHabitCategories', () => ({
  useHabitCategories: () => ({
    data: [
      { id: 'work', name: 'Work', icon: '💼', color: '#3b82f6' },
      { id: 'health', name: 'Health', icon: '💪', color: '#10b981' },
    ],
    isLoading: false,
    error: null,
  }),
  useCreateHabitCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateHabitCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteHabitCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

describe('Habits categories', () => {
  const renderWithClient = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('shows category labels for each habit card', async () => {
    const { default: Habits } = await import('../Habits')
    renderWithClient(<Habits />)

    // Work habit shows "Work •"
    const workName = screen.getByText('Plan day')
    const workCard = workName.closest('article') as HTMLElement
    expect(within(workCard).getByText(/Work •/)).toBeInTheDocument()

    // Health habit shows "Health •"
    const healthName = screen.getByText('Run')
    const healthCard = healthName.closest('article') as HTMLElement
    expect(within(healthCard).getByText(/Health •/)).toBeInTheDocument()
  })

  it('adds a habit with selected category', async () => {
    const { default: Habits } = await import('../Habits')
    renderWithClient(<Habits />)

    fireEvent.change(screen.getByTestId('habit-add-name'), { target: { value: 'Meditate' } })
    const selects = screen.getAllByLabelText('Category') as HTMLSelectElement[]
    // First select belongs to the Add form
    fireEvent.change(selects[0], { target: { value: 'health' } })
    fireEvent.click(screen.getByTestId('habit-add-submit'))

    expect(createHabitMock).toHaveBeenCalled()
    const args = createHabitMock.mock.calls[createHabitMock.mock.calls.length - 1][0]
    expect(args.category_id).toBe('health')
  })

  it('edits a habit and changes its category', async () => {
    const { default: Habits } = await import('../Habits')
    renderWithClient(<Habits />)

    // Open edit for first card
    const workName = screen.getByText('Plan day')
    const workCard = workName.closest('article') as HTMLElement
    const editBtn = within(workCard).getByRole('button', { name: /^Edit$/ })
    fireEvent.click(editBtn)

    // In edit form, change Category to health
    const editCategory = within(workCard).getAllByLabelText('Category')[0] as HTMLSelectElement
    fireEvent.change(editCategory, { target: { value: 'health' } })

    // Save
    const saveBtn = within(workCard).getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)

    expect(updateHabitMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'h1',
      updates: expect.objectContaining({ category_id: 'health' })
    }))
  })
})
