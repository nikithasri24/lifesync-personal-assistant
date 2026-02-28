import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
    mutateAsync: createHabitMock,
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

describe('Habits error toasts', () => {
  it('shows error toast when add fails', async () => {
    // Suppress unhandled rejection from re-throw in Habits.tsx (line 218: throw error)
    // The component catches the error, shows toast, then re-throws so FormModalV2 can reset.
    // This re-throw becomes an unhandled rejection in the test environment.
    const rejectionHandler = (reason: Error) => {
      if (reason?.message === 'fail') return; // suppress
    };
    process.on('unhandledRejection', rejectionHandler);

    // Make createHabit throw an error
    createHabitMock.mockRejectedValue(new Error('fail'))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: {
          // Suppress mutation error propagation in tests
          // (the component re-throws after showing toast, which causes unhandled rejections)
          onError: () => {},
        },
      },
    })

    const { default: Habits } = await import('../Habits')

    render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )

    // Open modal
    const addButton = screen.getByRole('button', { name: /create new habit/i })
    await act(async () => {
      fireEvent.click(addButton)
    })

    // Fill in name
    const nameInput = await screen.findByPlaceholderText('Exercise, Read, Meditate...')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Yoga' } })
    })

    // Submit
    const createButton = screen.getByRole('button', { name: /create habit/i })
    await act(async () => {
      fireEvent.click(createButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/Unable to save the habit right now/i)).toBeInTheDocument()
    })

    process.off('unhandledRejection', rejectionHandler);
  })
})
