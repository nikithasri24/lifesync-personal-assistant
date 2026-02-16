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
        target_count: 2,
        category: 'work',
        color: '#22c55e',
        user_id: 'user1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'm1',
        name: 'Monthly habit',
        description: '',
        frequency: 'monthly',
        target_count: 2,
        category: 'health',
        color: '#22c55e',
        user_id: 'user1',
        created_at: new Date().toISOString(),
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
  useCreateHabit: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateHabit: () => ({
    mutate: vi.fn(),
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

describe('Habits weekly/monthly multi-target labels', () => {
  it('shows Today 1/2 and category • weekly/monthly', async () => {
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
      const wCard = screen.getByText('Weekly habit').closest('article') as HTMLElement
      expect(wCard.textContent).toMatch(/work\s+•\s*weekly/i)
      expect(wCard.textContent).toMatch(/Today\s+1\/2/)

      const mCard = screen.getByText('Monthly habit').closest('article') as HTMLElement
      expect(mCard.textContent).toMatch(/health\s+•\s*monthly/i)
      expect(mCard.textContent).toMatch(/Today\s+1\/2/)
    })
  })
})

