import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const updateHabitMock = vi.fn()

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'hc1',
        name: 'Customizable',
        description: '',
        frequency: 'daily' as const,
        target_value: 1,
        category: 'Other',
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

describe('Habits custom frequency edit', () => {
  it('renders habit with daily frequency label and updates after edit', async () => {
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
      expect(screen.getByText('Customizable')).toBeInTheDocument()
    })

    // Initial frequency label
    expect(screen.getByText(/Daily/)).toBeInTheDocument()

    // Click on habit to edit
    await act(async () => {
      fireEvent.click(screen.getByText('Customizable'))
    })

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Edit Habit')).toBeInTheDocument()
    })

    // Change frequency to weekly
    const freqSelect = screen.getByLabelText(/Frequency/i) as HTMLSelectElement
    await act(async () => {
      fireEvent.change(freqSelect, { target: { value: 'weekly' } })
    })

    // Save
    const updateButton = screen.getByRole('button', { name: /update habit/i })
    await act(async () => {
      fireEvent.click(updateButton)
    })

    await waitFor(() => {
      expect(updateHabitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'hc1',
          updates: expect.objectContaining({
            frequency: 'weekly',
          }),
        })
      )
    })
  })
})
