import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const updateHabit = vi.fn()

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [{ id: 'general', name: 'General' }],
    habits: [
      {
        id: 'h1',
        name: 'Read',
        description: '15 minutes',
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
    updateHabit,
    completeHabit: vi.fn(),
    resetHabitToday: vi.fn(),
    resetHabitHistory: vi.fn(),
    deleteHabit: vi.fn(),
  }),
}))

describe('Habits edit', () => {
  it('opens edit form and saves changes', async () => {
    const mod = await import('../Habits')
    const Habits = mod.default
    render(<Habits />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    const editNameInput = screen.getByTestId('habit-edit-name') as HTMLInputElement
    fireEvent.change(editNameInput, { target: { value: 'Read books' } })

    fireEvent.click(screen.getByTestId('habit-save-changes'))
    expect(updateHabit).toHaveBeenCalledWith('h1', expect.objectContaining({ name: 'Read books' }))
  })
})
