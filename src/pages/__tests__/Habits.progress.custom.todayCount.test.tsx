import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const today = new Date()
const completion = (id: string) => ({ id, completedAt: today, notes: undefined as string | undefined })

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [{ id: 'other', name: 'Other' }],
    habits: [
      {
        id: 'hc2',
        name: 'Custom hydrate',
        description: '',
        frequency: 'custom',
        targetCount: 2,
        categoryId: 'other',
        color: '#22c55e',
        currentProgress: 1,
        streak: 0,
        completions: [completion('c1')],
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

describe('Habits custom frequency multi-target progress', () => {
  it('shows Today 1/2 for custom target 2 with one completion', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)
    const card = screen.getByText('Custom hydrate').closest('article') as HTMLElement
    expect(card).toBeTruthy()
    expect(card.textContent).toMatch(/Today\s+1\/2/)
    expect(card.textContent).toMatch(/Other\s+•\s*custom/i)
  })
})

