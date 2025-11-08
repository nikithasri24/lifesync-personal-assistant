import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [
      { id: 'other', name: 'Other' },
    ],
    habits: [
      {
        id: 'h5',
        name: 'Custom cadence',
        description: '',
        frequency: 'custom',
        targetCount: 1,
        categoryId: 'other',
        color: '#22c55e',
        currentProgress: 0,
        streak: 0,
        completions: [],
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

describe('Habits frequency label: custom', () => {
  it('renders category and custom frequency in the header', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)

    const card = screen.getByText('Custom cadence').closest('article') as HTMLElement
    expect(card).toBeTruthy()
    // Expect: "Other • custom" somewhere near the header meta
    expect(within(card).getByText(/Other\s+•\s*custom/i)).toBeInTheDocument()
  })
})

