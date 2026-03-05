import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createHabitEntryMock = vi.fn()
const deleteHabitEntriesForDateMock = vi.fn()

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h1',
        name: 'Drink water',
        description: '8 glasses',
        frequency: 'daily',
        target_value: 1,
        category: 'Health',
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
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteHabit: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateHabitEntry: () => ({
    mutate: createHabitEntryMock,
    mutateAsync: createHabitEntryMock,
    isPending: false,
  }),
  useDeleteHabitEntriesForDate: () => ({
    mutate: deleteHabitEntriesForDateMock,
    mutateAsync: deleteHabitEntriesForDateMock,
    isPending: false,
  }),
}))

vi.mock('../../hooks/useOwnerInfo', () => ({
  useCurrentUserId: () => ({
    data: 'test-user-id',
    isLoading: false,
  }),
  useMergedConnection: () => ({
    data: null,
    isLoading: false,
  }),
}))

describe('Habits interactions', () => {
  it('marks a habit complete', async () => {
    createHabitEntryMock.mockImplementation((_args: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.()
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const mod = await import('../Habits')
    const Habits = mod.default

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    // Wait for habit to render
    await waitFor(() => {
      expect(screen.getByText('Drink water')).toBeInTheDocument()
    })

    // Mark complete button
    const completeBtn = screen.getByRole('button', { name: /mark complete/i })
    await act(async () => {
      fireEvent.click(completeBtn)
    })

    expect(createHabitEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        habit_id: 'h1',
      }),
      expect.anything()
    )
  })
})
