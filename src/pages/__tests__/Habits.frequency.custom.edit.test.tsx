import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let habitsVar = [
  {
    id: 'hc1',
    name: 'Customizable',
    description: '',
    frequency: 'daily' as const,
    target_count: 1,
    category_id: 'other',
    icon: '📝',
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
    data: [{ id: 'other', name: 'Other', icon: '📋', color: '#6b7280' }],
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

describe('Habits custom frequency edit', () => {
  it('updates frequency label to custom after editing', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    const card = screen.getByText('Customizable').closest('article') as HTMLElement
    expect(within(card).getByText(/Other\s+•\s*daily/i)).toBeInTheDocument()

    // Edit -> change Frequency to custom, save
    fireEvent.click(within(card).getByRole('button', { name: /^Edit$/ }))
    const freqSelect = within(card).getByLabelText('Frequency') as HTMLSelectElement
    fireEvent.change(freqSelect, { target: { value: 'custom' } })
    fireEvent.click(within(card).getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(within(card).getByText(/Other\s+•\s*custom/i)).toBeInTheDocument()
    })
  })
})
