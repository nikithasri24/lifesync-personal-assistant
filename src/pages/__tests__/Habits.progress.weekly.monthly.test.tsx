import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const today = new Date()
const completion = (id: string) => ({ id, completedAt: today, notes: undefined as string | undefined })

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [
      { id: 'work', name: 'Work' },
      { id: 'health', name: 'Health' },
    ],
    habits: [
      {
        id: 'w1',
        name: 'Weekly habit',
        description: '',
        frequency: 'weekly',
        targetCount: 2,
        categoryId: 'work',
        color: '#22c55e',
        currentProgress: 1,
        streak: 0,
        completions: [completion('cw1')],
        createdAt: new Date(),
      },
      {
        id: 'm1',
        name: 'Monthly habit',
        description: '',
        frequency: 'monthly',
        targetCount: 2,
        categoryId: 'health',
        color: '#22c55e',
        currentProgress: 1,
        streak: 0,
        completions: [completion('cm1')],
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

describe('Habits weekly/monthly multi-target labels', () => {
  it('shows Today 1/2 and category • weekly/monthly', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)

    const wCard = screen.getByText('Weekly habit').closest('article') as HTMLElement
    expect(wCard.textContent).toMatch(/Work\s+•\s*weekly/i)
    expect(wCard.textContent).toMatch(/Today\s+1\/2/)

    const mCard = screen.getByText('Monthly habit').closest('article') as HTMLElement
    expect(mCard.textContent).toMatch(/Health\s+•\s*monthly/i)
    expect(mCard.textContent).toMatch(/Today\s+1\/2/)
  })
})

