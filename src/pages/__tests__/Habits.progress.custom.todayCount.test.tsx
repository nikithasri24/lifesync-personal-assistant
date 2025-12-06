import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const today = new Date().toISOString().split('T')[0]
const entry = (id: string) => ({
  id,
  habit_id: 'hc2',
  completed_at: today,
  notes: null,
  created_at: new Date().toISOString(),
})

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'hc2',
        name: 'Custom hydrate',
        description: '',
        frequency: 'custom',
        target_count: 2,
        category: 'other',
        color: '#22c55e',
        user_id: 'user1',
        created_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
    error: null,
  }),
  useHabitEntries: () => ({
    data: [entry('e1')],
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
  useDeleteAllHabitEntries: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

describe('Habits custom frequency multi-target progress', () => {
  it('shows Today 1/2 for custom target 2 with one completion', async () => {
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
      const card = screen.getByText('Custom hydrate').closest('article') as HTMLElement
      expect(card).toBeTruthy()
      expect(card.textContent).toMatch(/Today\s+1\/2/)
      expect(card.textContent).toMatch(/other\s+•\s*custom/i)
    })
  })
})

