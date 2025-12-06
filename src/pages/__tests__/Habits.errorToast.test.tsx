import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const addHabit = vi.fn().mockRejectedValue(new Error('fail'))

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [{ id: 'general', name: 'General' }],
    habits: [],
    addHabit,
    deleteHabit: vi.fn(),
    completeHabit: vi.fn(),
    updateHabit: vi.fn(),
    resetHabitToday: vi.fn(),
    resetHabitHistory: vi.fn(),
  }),
}))

describe('Habits error toasts', () => {
  it('shows error toast when add fails', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)
    fireEvent.change(screen.getByTestId('habit-add-name'), { target: { value: 'Yoga' } })
    fireEvent.click(screen.getByTestId('habit-add-submit'))
    await waitFor(() => {
      expect(screen.getByText(/Unable to save the habit right now/i)).toBeInTheDocument()
    })
  })
})

