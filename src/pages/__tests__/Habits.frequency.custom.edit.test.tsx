import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

let habitsVar = [
  {
    id: 'hc1',
    name: 'Customizable',
    description: '',
    frequency: 'daily' as const,
    targetCount: 1,
    categoryId: 'other',
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
    habitCategories: [{ id: 'other', name: 'Other' }],
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

describe('Habits custom frequency edit', () => {
  it('updates frequency label to custom after editing', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)

    const card = screen.getByText('Customizable').closest('article') as HTMLElement
    expect(within(card).getByText(/Other\s+•\s*daily/i)).toBeInTheDocument()

    // Edit -> change Frequency to custom, save
    fireEvent.click(within(card).getByRole('button', { name: /^Edit$/ }))
    const freqSelect = within(card).getByLabelText('Frequency') as HTMLSelectElement
    fireEvent.change(freqSelect, { target: { value: 'custom' } })
    fireEvent.click(within(card).getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(within(card).getByText(/Other\s+•\s*custom/i)).toBeInTheDocument()
    })
  })
})

