import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mutable habits variable used by the mock to simulate store updates
let habitsVar = [
  {
    id: 'h1',
    name: 'Plan day',
    description: '',
    frequency: 'daily' as const,
    target_count: 1,
    category_id: 'work',
    icon: '📋',
    color: '#22c55e',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const updateHabitMock = vi.fn(async ({ id, updates }: { id: string; updates: any }) => {
  habitsVar = habitsVar.map((h) => (h.id === id ? { ...h, ...updates } : h))
})

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    get data() {
      return habitsVar
    },
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
    mutate: vi.fn(),
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

describe('Habits category label updates after edit', () => {
  it('updates category label to new category after saving', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    // Open edit for the card
    const card = screen.getByText('Plan day').closest('article') as HTMLElement
    expect(within(card).getByText(/Work \u2022|Work •/)).toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: /^Edit$/ }))

    // Change Category to Health and save
    const editCategory = within(card).getAllByLabelText('Category')[0] as HTMLSelectElement
    fireEvent.change(editCategory, { target: { value: 'health' } })
    fireEvent.click(within(card).getByRole('button', { name: /save changes/i }))

    // After update, component re-renders (local state changes) and reflects new category label
    await waitFor(() => {
      expect(within(card).getByText(/Health \u2022|Health •/)).toBeInTheDocument()
    })
  })
})
