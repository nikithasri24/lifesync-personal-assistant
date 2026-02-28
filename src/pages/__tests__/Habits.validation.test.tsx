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

describe('Habits validation and normalization', () => {
  const renderWithClient = async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const mod = await import('../Habits')
    const Habits = mod.default
    return render(
      <QueryClientProvider client={queryClient}>
        <Habits />
      </QueryClientProvider>
    )
  }

  it('does not submit when name is empty', async () => {
    createHabitMock.mockResolvedValue({})
    await renderWithClient()

    // Open modal
    const addButton = screen.getByRole('button', { name: /create new habit/i })
    await act(async () => {
      fireEvent.click(addButton)
    })

    // Try to submit without a name
    const createButton = await screen.findByRole('button', { name: /create habit/i })
    await act(async () => {
      fireEvent.click(createButton)
    })

    // Should show validation message, not call create
    expect(createHabitMock).not.toHaveBeenCalled()
  })

  it('normalizes target count to minimum 1 when submitted', async () => {
    createHabitMock.mockClear()
    createHabitMock.mockResolvedValue({})
    await renderWithClient()

    // Open modal
    const addButton = screen.getByRole('button', { name: /create new habit/i })
    await act(async () => {
      fireEvent.click(addButton)
    })

    // Wait for modal to open
    const nameInput = await screen.findByPlaceholderText('Exercise, Read, Meditate...')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Stretch' } })
    })

    // Submit with default target value (1)
    const createButton = screen.getByRole('button', { name: /create habit/i })
    await act(async () => {
      fireEvent.click(createButton)
    })

    await waitFor(() => {
      expect(createHabitMock).toHaveBeenCalled()
    })

    // The default target value should be 1
    const args = createHabitMock.mock.calls[0][0]
    expect(args.name).toBe('Stretch')
    // target_value should default to 1 and be normalized to at least 1
    expect(Number(args.target_value)).toBeGreaterThanOrEqual(1)
  })
})
