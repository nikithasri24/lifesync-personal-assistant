import { render, screen, fireEvent } from '@testing-library/react'
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

describe('Habits validation and normalization', () => {
  const renderWithClient = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return import('../Habits').then(mod => {
      const Habits = mod.default
      return render(
        <QueryClientProvider client={queryClient}>
          <Habits />
        </QueryClientProvider>
      )
    })
  }

  it('does not submit when name is empty', async () => {
    await renderWithClient()
    // Submit without entering a name
    fireEvent.click(screen.getByTestId('habit-add-submit'))
    expect(createHabitMock).not.toHaveBeenCalled()
  })

  it('normalizes target count to minimum 1', async () => {
    await renderWithClient()
    fireEvent.change(screen.getByTestId('habit-add-name'), { target: { value: 'Stretch' } })

    // Set target to 0
    const targetInput = screen.getByLabelText('Target count') as HTMLInputElement
    fireEvent.change(targetInput, { target: { value: '0' } })

    fireEvent.click(screen.getByTestId('habit-add-submit'))
    expect(createHabitMock).toHaveBeenCalled()
    const args = createHabitMock.mock.calls[createHabitMock.mock.calls.length - 1][0]
    expect(args.target_count).toBe(1)
  })
})
