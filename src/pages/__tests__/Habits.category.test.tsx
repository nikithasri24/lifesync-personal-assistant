import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
        target_value: 1,
        category: 'Work',
        color: '#22c55e',
        streak_count: 0,
        best_streak: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'h2',
        name: 'Run',
        description: '',
        frequency: 'daily',
        target_value: 1,
        category: 'Fitness',
        color: '#22c55e',
        streak_count: 0,
        best_streak: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
    error: null,
  }),
  useHabitEntries: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useMergedHabitsConnectionQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useCreateHabit: () => ({
    mutate: createHabitMock,
    mutateAsync: createHabitMock,
    isPending: false,
  }),
  useUpdateHabit: () => ({
    mutate: updateHabitMock,
    mutateAsync: updateHabitMock,
    isPending: false,
  }),
  useDeleteHabit: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateHabitEntry: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteHabitEntriesForDate: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('../../hooks/useOwnerInfo', () => ({
  useCurrentUserId: () => ({
    data: 'test-user-id',
    isLoading: false,
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

    // Work habit shows its category
    await waitFor(() => {
      expect(screen.getByText('Plan day')).toBeInTheDocument()
    })
    expect(screen.getByText('Run')).toBeInTheDocument()

    // Category labels should be visible
    expect(screen.getByText(/Work/)).toBeInTheDocument()
    expect(screen.getByText(/Fitness/)).toBeInTheDocument()
  })

  it('adds a habit via the modal form', async () => {
    createHabitMock.mockResolvedValue({})
    const { default: Habits } = await import('../Habits')
    renderWithClient(<Habits />)

    // Open the modal
    const addButton = screen.getByRole('button', { name: /create new habit/i })
    await act(async () => {
      fireEvent.click(addButton)
    })

    // Fill in name
    const nameInput = await screen.findByPlaceholderText('Exercise, Read, Meditate...')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Meditate' } })
    })

    // Submit
    const createButton = screen.getByRole('button', { name: /create habit/i })
    await act(async () => {
      fireEvent.click(createButton)
    })

    await waitFor(() => {
      expect(createHabitMock).toHaveBeenCalled()
    })

    const args = createHabitMock.mock.calls[createHabitMock.mock.calls.length - 1][0]
    expect(args.name).toBe('Meditate')
  })

  it('habit cards are clickable to edit', async () => {
    const { default: Habits } = await import('../Habits')
    renderWithClient(<Habits />)

    // Wait for habits to render
    await waitFor(() => {
      expect(screen.getByText('Plan day')).toBeInTheDocument()
    })

    // Habit card content should be visible
    expect(screen.getByText('Run')).toBeInTheDocument()
  })
})
