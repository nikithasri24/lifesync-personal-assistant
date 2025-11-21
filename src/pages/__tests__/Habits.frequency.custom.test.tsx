import { render, screen, within, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h5',
        name: 'Custom cadence',
        description: '',
        frequency: 'custom',
        target_count: 1,
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
    data: [],
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

describe('Habits frequency label: custom', () => {
  it('renders category and custom frequency in the header', async () => {
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
      const card = screen.getByText('Custom cadence').closest('article') as HTMLElement
      expect(card).toBeTruthy()
      // Expect: "other • custom" somewhere near the header meta
      expect(within(card).getByText(/other\s+•\s*custom/i)).toBeInTheDocument()
    })
  })
})

