import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { format } from 'date-fns'

const today = new Date()
const todayISO = format(today, 'yyyy-MM-dd')

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h4',
        name: 'Plan',
        description: '',
        frequency: 'daily',
        target_value: 2,
        category: 'Productivity',
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
    data: [
      {
        id: 'e1',
        habit_id: 'h4',
        date: todayISO,
        value: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'e2',
        habit_id: 'h4',
        date: todayISO,
        value: 1,
        created_at: new Date().toISOString(),
      },
    ],
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
}))

describe('Habits progress completed', () => {
  it('shows Mark incomplete button when habit is completed (2/2)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    // Wait for habit to render
    await waitFor(() => {
      expect(screen.getByText('Plan')).toBeInTheDocument()
    })

    // Progress section should show 2/2
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    // When habit is complete, button shows "Mark incomplete"
    const completeBtn = screen.getByRole('button', { name: /mark incomplete/i })
    expect(completeBtn).toBeInTheDocument()
  })
})
