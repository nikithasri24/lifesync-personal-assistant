import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

// Mutable habits variable used by the mock to simulate store updates
let habitsVar = [
  {
    id: 'h1',
    name: 'Plan day',
    description: '',
    frequency: 'daily' as const,
    targetCount: 1,
    categoryId: 'work',
    color: '#22c55e',
    currentProgress: 0,
    streak: 0,
    completions: [] as Array<{ id: string; completedAt: Date; notes?: string }>,
    createdAt: new Date(),
  },
]

const updateHabit = vi.fn(async (id: string, updates: any) => {
  habitsVar = habitsVar.map((h) => (h.id === id ? { ...h, ...updates } : h))
})

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [
      { id: 'work', name: 'Work' },
      { id: 'health', name: 'Health' },
    ],
    get habits() {
      return habitsVar
    },
    addHabit: vi.fn(),
    updateHabit,
    completeHabit: vi.fn(),
    resetHabitToday: vi.fn(),
    resetHabitHistory: vi.fn(),
    deleteHabit: vi.fn(),
  }),
}))

describe('Habits category label updates after edit', () => {
  it('updates category label to new category after saving', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)

    // Open edit for the card
    const card = screen.getByText('Plan day').closest('article') as HTMLElement
    expect(within(card).getByText(/Work \u2022|Work •/)).toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: /^Edit$/ }))

    // Change Category to Health and save
    const editCategory = within(card).getAllByLabelText('Category')[0] as HTMLSelectElement
    fireEvent.change(editCategory, { target: { value: 'health' } })
    fireEvent.click(within(card).getByRole('button', { name: /save changes/i }))

    // After update, component re-renders (local state changes) and reflects new category label
    await waitFor(() => {
      expect(within(card).getByText(/Health \u2022|Health •/)).toBeInTheDocument()
    })
  })
})

