import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const today = new Date()
const completion = (id: string) => ({ id, completedAt: today, notes: undefined as string | undefined })

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [{ id: 'work', name: 'Work' }],
    habits: [
      {
        id: 'h4',
        name: 'Plan',
        description: '',
        frequency: 'daily',
        targetCount: 2,
        categoryId: 'work',
        color: '#22c55e',
        currentProgress: 2,
        streak: 0,
        completions: [completion('c1'), completion('c2')],
        createdAt: new Date(),
      },
    ],
    addHabit: vi.fn(),
    updateHabit: vi.fn(),
    completeHabit: vi.fn(),
    resetHabitToday: vi.fn(),
    resetHabitHistory: vi.fn(),
    deleteHabit: vi.fn(),
  }),
}))

describe('Habits progress completed', () => {
  it('shows Completed today (2/2) and disables the button', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)
    const card = screen.getByText('Plan').closest('article') as HTMLElement
    expect(card).toBeTruthy()
    expect(card.textContent).toMatch(/Completed today\s*\(2\/2\)/)
    const completeBtn = screen.getByRole('button', { name: /completed today/i }) as HTMLButtonElement
    expect(completeBtn).toBeDisabled()
  })
})

