import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

// Build a completion with today's date
const today = new Date()
const completion = (id: string) => ({ id, completedAt: today, notes: undefined as string | undefined })

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [{ id: 'health', name: 'Health' }],
    habits: [
      {
        id: 'h3',
        name: 'Hydrate',
        description: '',
        frequency: 'daily',
        targetCount: 3,
        categoryId: 'health',
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

describe('Habits progress (multi-target)', () => {
  it('shows Today 2/3 when two of three completed', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)
    const card = screen.getByText('Hydrate').closest('article') as HTMLElement
    expect(card).toBeTruthy()
    expect(card.textContent).toMatch(/Today\s+2\/3/)
  })
})

