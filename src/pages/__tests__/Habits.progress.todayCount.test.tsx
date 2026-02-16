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
        target_count: 3,
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
    data: [entry('e1'), entry('e2')],
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

describe('Habits progress (multi-target)', () => {
  it('shows Today 2/3 when two of three completed', async () => {
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
      const card = screen.getByText('Hydrate').closest('article') as HTMLElement
      expect(card).toBeTruthy()
      expect(card.textContent).toMatch(/Today\s+2\/3/)
    })
  })
})

