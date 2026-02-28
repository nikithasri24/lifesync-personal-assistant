import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const updateHabitMock = vi.fn()

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h1',
        name: 'Plan day',
        description: '',
        frequency: 'daily' as const,
        target_value: 1,
        category: 'Work',
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
    data: [],
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
    mutate: updateHabitMock,
    mutateAsync: updateHabitMock,
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

describe('Habits category label updates after edit', () => {
  it('opens edit modal and saves updated category', async () => {
    updateHabitMock.mockResolvedValue({})

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    // Wait for habit to render
    await waitFor(() => {
      expect(screen.getByText('Plan day')).toBeInTheDocument()
    })

    // Initial category should be visible
    expect(screen.getByText(/Work/)).toBeInTheDocument()

    // Click on habit to open edit modal
    await act(async () => {
      fireEvent.click(screen.getByText('Plan day'))
    })

    // Edit modal should open
    await waitFor(() => {
      expect(screen.getByText('Edit Habit')).toBeInTheDocument()
    })

    // Change the category field - find the category input and update it
    const categorySelect = screen.getByLabelText(/Category/i)
    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'Fitness' } })
    })

    // Save
    const updateButton = screen.getByRole('button', { name: /update habit/i })
    await act(async () => {
      fireEvent.click(updateButton)
    })

    await waitFor(() => {
      expect(updateHabitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'h1',
          updates: expect.objectContaining({
            category: 'Fitness',
          }),
        })
      )
    })
  })
})
