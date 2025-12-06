import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Dynamic mock state so tests can tweak between cases
let mockState: any

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => mockState,
}))

import SeventyFiveHard from '../SeventyFiveHard'

const baseMock = () => ({
  seventyFiveHardChallenges: [],
  initializeData: vi.fn(),
  ensureSFHTasksForToday: vi.fn(),
  showSFHTasksInTasks: false,
  setShowSFHTasksInTasks: vi.fn(),
  showGlobalToast: vi.fn(),
  purgeSFHDuplicateTasks: vi.fn(),
  purgeNonSFHDuplicateTasks: vi.fn(),
  sfhLastSynced: null,
})

describe('SeventyFiveHard page removals', () => {
  beforeEach(() => {
    mockState = baseMock()
  })

  it('does not render "This Week" or "Challenge History" by default (no challenge)', () => {
    render(<SeventyFiveHard />)

    // Page header should render
    expect(screen.getByText('75 Hard Challenge')).toBeInTheDocument()

    // Removed sections should not be present
    expect(screen.queryByText(/This Week/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Challenge History/i)).not.toBeInTheDocument()
  })

  it('does not render removed sections when an active challenge exists', () => {
    const today = new Date()
    const end = new Date(today.getTime() + 74 * 24 * 60 * 60 * 1000)
    mockState.seventyFiveHardChallenges = [
      {
        id: 'c1',
        name: 'Test Challenge',
        startDate: today,
        endDate: end,
        isActive: true,
        currentDay: 1,
        rules: [
          { id: 'r1', title: 'Rule 1', description: 'Desc', isRequired: true, isCustom: false },
        ],
        dailyEntries: [],
        createdAt: today,
        notes: '',
      },
    ]

    render(<SeventyFiveHard />)

    // Active challenge header
    expect(screen.getByText('Test Challenge')).toBeInTheDocument()

    // Removed sections should not be present
    expect(screen.queryByText(/This Week/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Challenge History/i)).not.toBeInTheDocument()
  })
})

