import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const addHabitMock = vi.fn()

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    habitCategories: [{ id: 'general', name: 'General' }],
    habits: [],
    addHabit: addHabitMock,
    deleteHabit: vi.fn(),
    completeHabit: vi.fn(),
    updateHabit: vi.fn(),
    resetHabitToday: vi.fn(),
    resetHabitHistory: vi.fn(),
  })
}))

describe('Habits Add', () => {
  it('adds a habit via the form', async () => {
    const mod = await import('../Habits')
    const Habits = mod.default
    render(<Habits />)

    const name = screen.getByPlaceholderText('Morning stretch') as HTMLInputElement
    fireEvent.change(name, { target: { value: 'Pushups' } })
    fireEvent.submit(name.closest('form')!)

    expect(addHabitMock).toHaveBeenCalled()
    const args = addHabitMock.mock.calls[0][0]
    expect(args.name).toBe('Pushups')
    expect(args.targetCount).toBe(1)
  })
})

