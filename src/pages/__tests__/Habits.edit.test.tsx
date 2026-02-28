import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const updateHabitMock = vi.fn()

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h1',
        name: 'Read',
        description: '15 minutes',
        frequency: 'daily',
        target_value: 1,
        category: 'Learning',
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

describe('Habits edit', () => {
  it('opens edit modal when habit card is clicked', async () => {
    updateHabitMock.mockResolvedValue({})

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
      expect(screen.getByText('Read')).toBeInTheDocument()
    })

    // Click on the habit name to open edit modal
    await act(async () => {
      fireEvent.click(screen.getByText('Read'))
    })

    // Edit modal should open with "Edit Habit" title
    await waitFor(() => {
      expect(screen.getByText('Edit Habit')).toBeInTheDocument()
    })

    // Change the name
    const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Read books' } })
    })

    // Save changes
    const updateButton = screen.getByRole('button', { name: /update habit/i })
    await act(async () => {
      fireEvent.click(updateButton)
    })

    await waitFor(() => {
      expect(updateHabitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'h1',
          updates: expect.objectContaining({ name: 'Read books' }),
        })
      )
    })
  })
})
