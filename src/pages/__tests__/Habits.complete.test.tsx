import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const completeHabit = vi.fn()
const resetHabitToday = vi.fn()
const resetHabitHistory = vi.fn()
const deleteHabit = vi.fn()

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [{ id: 'general', name: 'General' }],
    habits: [
      {
        id: 'h1',
        name: 'Drink water',
        description: '8 glasses',
        frequency: 'daily',
        targetCount: 1,
        categoryId: 'general',
        color: '#22c55e',
        currentProgress: 0,
        streak: 0,
        completions: [],
        createdAt: new Date(),
      },
    ],
    addHabit: vi.fn(),
    updateHabit: vi.fn(),
    completeHabit,
    resetHabitToday,
    resetHabitHistory,
    deleteHabit,
  }),
}))

describe('Habits interactions', () => {
  it('completes, resets and deletes a habit', async () => {
    const mod = await import('../Habits')
    const Habits = mod.default
    render(<Habits />)

    // Complete today
    const completeBtn = screen.getByRole('button', { name: /complete today/i })
    fireEvent.click(completeBtn)
    expect(completeHabit).toHaveBeenCalledWith('h1')

    // Reset today
    const resetTodayBtn = screen.getByRole('button', { name: /reset today/i })
    fireEvent.click(resetTodayBtn)
    expect(resetHabitToday).toHaveBeenCalledWith('h1')

    // Reset streak/history
    const resetHistoryBtn = screen.getByRole('button', { name: /reset streak/i })
    fireEvent.click(resetHistoryBtn)
    expect(resetHabitHistory).toHaveBeenCalledWith('h1')

    // Delete
    const deleteBtn = screen.getByRole('button', { name: /delete habit/i })
    fireEvent.click(deleteBtn)
    expect(deleteHabit).toHaveBeenCalledWith('h1')
  })
})
