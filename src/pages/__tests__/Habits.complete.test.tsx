import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createHabitEntryMock = vi.fn()
const deleteHabitEntriesForDateMock = vi.fn()
const deleteAllHabitEntriesMock = vi.fn()
const deleteHabitMock = vi.fn()

vi.mock('../../hooks/useHabitsQuery', () => ({
  useHabits: () => ({
    data: [
      {
        id: 'h1',
        name: 'Drink water',
        description: '8 glasses',
        frequency: 'daily',
        target_count: 1,
        category_id: 'general',
        icon: '💧',
        color: '#22c55e',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
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
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteHabit: () => ({
    mutate: deleteHabitMock,
    isPending: false,
  }),
  useCreateHabitEntry: () => ({
    mutate: createHabitEntryMock,
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
    mutate: deleteHabitEntriesForDateMock,
    isPending: false,
  }),
  useDeleteHabitEntriesForDateRange: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteAllHabitEntries: () => ({
    mutate: deleteAllHabitEntriesMock,
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

describe('Habits interactions', () => {
  it('completes, resets and deletes a habit', async () => {
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

    // Complete today
    const completeBtn = screen.getByRole('button', { name: /complete today/i })
    fireEvent.click(completeBtn)
    expect(createHabitEntryMock).toHaveBeenCalledWith(expect.objectContaining({
      habit_id: 'h1'
    }))

    // Reset today
    const resetTodayBtn = screen.getByRole('button', { name: /reset today/i })
    fireEvent.click(resetTodayBtn)
    expect(deleteHabitEntriesForDateMock).toHaveBeenCalledWith(expect.objectContaining({
      habitId: 'h1'
    }))

    // Reset streak/history
    const resetHistoryBtn = screen.getByRole('button', { name: /reset streak/i })
    fireEvent.click(resetHistoryBtn)
    expect(deleteAllHabitEntriesMock).toHaveBeenCalledWith('h1')

    // Delete
    const deleteBtn = screen.getByRole('button', { name: /delete habit/i })
    fireEvent.click(deleteBtn)
    expect(deleteHabitMock).toHaveBeenCalledWith('h1')
  })
})
