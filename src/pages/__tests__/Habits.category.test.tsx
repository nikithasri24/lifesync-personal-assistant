import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const addHabit = vi.fn()
const updateHabit = vi.fn()

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [
      { id: 'work', name: 'Work' },
      { id: 'health', name: 'Health' },
    ],
    habits: [
      {
        id: 'h1',
        name: 'Plan day',
        description: '',
        frequency: 'daily',
        targetCount: 1,
        categoryId: 'work',
        color: '#22c55e',
        currentProgress: 0,
        streak: 0,
        completions: [],
        createdAt: new Date(),
      },
      {
        id: 'h2',
        name: 'Run',
        description: '',
        frequency: 'daily',
        targetCount: 1,
        categoryId: 'health',
        color: '#22c55e',
        currentProgress: 0,
        streak: 0,
        completions: [],
        createdAt: new Date(),
      },
    ],
    addHabit,
    updateHabit,
    completeHabit: vi.fn(),
    resetHabitToday: vi.fn(),
    resetHabitHistory: vi.fn(),
    deleteHabit: vi.fn(),
  }),
}))

describe('Habits categories', () => {
  it('shows category labels for each habit card', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)

    // Work habit shows "Work •"
    const workName = screen.getByText('Plan day')
    const workCard = workName.closest('article') as HTMLElement
    expect(within(workCard).getByText(/Work •/)).toBeInTheDocument()

    // Health habit shows "Health •"
    const healthName = screen.getByText('Run')
    const healthCard = healthName.closest('article') as HTMLElement
    expect(within(healthCard).getByText(/Health •/)).toBeInTheDocument()
  })

  it('adds a habit with selected category', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)

    fireEvent.change(screen.getByTestId('habit-add-name'), { target: { value: 'Meditate' } })
    const selects = screen.getAllByLabelText('Category') as HTMLSelectElement[]
    // First select belongs to the Add form
    fireEvent.change(selects[0], { target: { value: 'health' } })
    fireEvent.click(screen.getByTestId('habit-add-submit'))

    expect(addHabit).toHaveBeenCalled()
    const args = addHabit.mock.calls.pop()[0]
    expect(args.categoryId).toBe('health')
  })

  it('edits a habit and changes its category', async () => {
    const { default: Habits } = await import('../Habits')
    render(<Habits />)

    // Open edit for first card
    const workName = screen.getByText('Plan day')
    const workCard = workName.closest('article') as HTMLElement
    const editBtn = within(workCard).getByRole('button', { name: /^Edit$/ })
    fireEvent.click(editBtn)

    // In edit form, change Category to health
    const editCategory = within(workCard).getAllByLabelText('Category')[0] as HTMLSelectElement
    fireEvent.change(editCategory, { target: { value: 'health' } })

    // Save
    const saveBtn = within(workCard).getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)

    expect(updateHabit).toHaveBeenCalledWith('h1', expect.objectContaining({ categoryId: 'health' }))
  })
})
