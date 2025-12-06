import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const addHabit = vi.fn()

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

describe('Habits validation and normalization', () => {
  it('does not submit when name is empty', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)
    // Submit without entering a name
    fireEvent.click(screen.getByTestId('habit-add-submit'))
    expect(addHabit).not.toHaveBeenCalled()
  })

  it('normalizes target count to minimum 1', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)
    fireEvent.change(screen.getByTestId('habit-add-name'), { target: { value: 'Stretch' } })

    // Set target to 0
    const targetInput = screen.getByLabelText('Target count') as HTMLInputElement
    fireEvent.change(targetInput, { target: { value: '0' } })

    fireEvent.click(screen.getByTestId('habit-add-submit'))
    expect(addHabit).toHaveBeenCalled()
    const args = addHabit.mock.calls.pop()[0]
    expect(args.targetCount).toBe(1)
  })
})

