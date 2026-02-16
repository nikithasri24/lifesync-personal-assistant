import { render, screen } from '@testing-library/react'
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
        target_count: 2,
        category_id: 'work',
        icon: '📋',
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
    data: [
      {
        id: 'e1',
        habit_id: 'h4',
        completed_date: todayISO,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'e2',
        habit_id: 'h4',
        completed_date: todayISO,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
    error: null,
  }),
  useHabitEntriesForHabit: () => ({
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
    data: [{ id: 'work', name: 'Work', icon: '💼', color: '#3b82f6' }],
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

describe('Habits progress completed', () => {
  it('shows Completed today (2/2) and disables the button', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    const card = screen.getByText('Plan').closest('article') as HTMLElement
    expect(card).toBeTruthy()
    expect(card.textContent).toMatch(/Completed today\s*\(2\/2\)/)
    const completeBtn = screen.getByRole('button', { name: /completed today/i }) as HTMLButtonElement
    expect(completeBtn).toBeDisabled()
  })
})
