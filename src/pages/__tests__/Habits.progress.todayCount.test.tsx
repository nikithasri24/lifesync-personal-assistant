import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Build entries with today's date
const today = new Date().toISOString().split('T')[0]
const entry = (id: string) => ({
  id,
  habit_id: 'h3',
  date: today,
  value: 1,
  notes: null,
  created_at: new Date().toISOString(),
})

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h3',
        name: 'Hydrate',
        description: '',
        frequency: 'daily',
        target_value: 3,
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
    data: [entry('e1'), entry('e2')],
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

describe('Habits progress (multi-target)', () => {
  it('shows 2 / 3 progress when two of three completed', async () => {
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
      expect(screen.getByText('Hydrate')).toBeInTheDocument()
    })

    // Progress should show 2 / 3
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })
})
