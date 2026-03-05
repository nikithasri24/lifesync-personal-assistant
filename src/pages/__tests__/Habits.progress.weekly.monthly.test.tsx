import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const today = new Date().toISOString().split('T')[0]
const entry = (id: string, habitId: string) => ({
  id,
  habit_id: habitId,
  date: today,
  value: 1,
  notes: null,
  created_at: new Date().toISOString(),
})

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'w1',
        name: 'Weekly habit',
        description: '',
        frequency: 'weekly',
        target_value: 2,
        category: 'Work',
        streak_count: 0,
        best_streak: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'm1',
        name: 'Monthly habit',
        description: '',
        frequency: 'monthly',
        target_value: 2,
        category: 'Health',
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
    data: [entry('cw1', 'w1'), entry('cm1', 'm1')],
    isLoading: false,
    error: null,
  }),
  useMergedHabitsConnectionQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useCreateHabit: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateHabit: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
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
  useMergedConnection: () => ({
    data: null,
    isLoading: false,
  }),
}))

describe('Habits weekly/monthly multi-target labels', () => {
  it('shows 1 / 2 progress and category • frequency for weekly and monthly habits', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Weekly habit')).toBeInTheDocument()
      expect(screen.getByText('Monthly habit')).toBeInTheDocument()
    })

    // Frequency info is shown in the card header
    expect(screen.getByText(/2x per week/i)).toBeInTheDocument()
    expect(screen.getByText(/2x per month/i)).toBeInTheDocument()

    // Progress shows 1 / 2 for both habits
    const progressValues = screen.getAllByText('1 / 2')
    expect(progressValues.length).toBe(2)
  })
})
