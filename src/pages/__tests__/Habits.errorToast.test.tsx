import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createHabitMock = vi.fn()

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [],
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
    mutate: createHabitMock,
    isPending: false,
    isError: true,
    error: new Error('fail'),
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
    data: [{ id: 'general', name: 'General', icon: '📋', color: '#6b7280' }],
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

describe('Habits error toasts', () => {
  it('shows error toast when add fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    fireEvent.change(screen.getByTestId('habit-add-name'), { target: { value: 'Yoga' } })
    fireEvent.click(screen.getByTestId('habit-add-submit'))

    await waitFor(() => {
      expect(screen.getByText(/Unable to save the habit right now/i)).toBeInTheDocument()
    })
  })
})
