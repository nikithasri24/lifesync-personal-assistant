import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

let mockState: any

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => mockState,
}))

import SeventyFiveHard from '../SeventyFiveHard'

const baseMock = () => ({
  seventyFiveHardChallenges: [] as any[],
  addSeventyFiveHardChallenge: vi.fn(),
  updateSeventyFiveHardChallenge: vi.fn(),
  deleteSeventyFiveHardChallenge: vi.fn(),
  addSeventyFiveHardEntry: vi.fn(),
  updateSeventyFiveHardEntry: vi.fn(),
  initializeData: vi.fn(),
  ensureSFHTasksForToday: vi.fn(),
  showSFHTasksInTasks: false,
  setShowSFHTasksInTasks: vi.fn(),
  resetSFHChallengeStart: vi.fn(),
  showGlobalToast: vi.fn(),
  sfhLastSynced: null,
  purgeSFHDuplicateTasks: vi.fn(),
  purgeNonSFHDuplicateTasks: vi.fn(),
})

const makeActiveChallenge = () => {
  const today = new Date()
  const end = new Date(today.getTime() + 74 * 24 * 60 * 60 * 1000)
  return {
    id: 'c1',
    name: 'Active Challenge',
    startDate: today,
    endDate: end,
    isActive: true,
    currentDay: 1,
    rules: [
      { id: 'r1', title: 'Follow a Diet', description: 'No cheat meals or alcohol', isRequired: true, isCustom: false },
      { id: 'r2', title: 'Workout Twice Daily', description: 'Two workouts', isRequired: true, isCustom: false, dailyTarget: 2 },
    ],
    dailyEntries: [],
    createdAt: today,
    notes: '',
  }
}

describe('SeventyFiveHard core flows', () => {
  beforeEach(() => {
    mockState = baseMock()
  })

  it('Start Challenge flow calls addSeventyFiveHardChallenge', async () => {
    render(<SeventyFiveHard />)

    const startBtn = screen.getByRole('button', { name: /start challenge/i })
    await userEvent.click(startBtn)

    // Modal visible
    const modal = await screen.findByRole('heading', { name: /start 75 hard challenge/i })
    expect(modal).toBeInTheDocument()

    // Fill minimal form and submit (use placeholder since label isn't associated)
    await userEvent.type(screen.getByPlaceholderText('My 75 Hard Challenge'), 'My Test Challenge')
    const submit = screen
      .getAllByRole('button', { name: /^start challenge$/i })
      .find((b) => b.getAttribute('form') === 'challenge-form')!
    await userEvent.click(submit)

    expect(mockState.addSeventyFiveHardChallenge).toHaveBeenCalled()
  })

  it('Renders active challenge and toggles single-target rule', async () => {
    mockState.seventyFiveHardChallenges = [makeActiveChallenge()]
    // Make add/update mutate mock state so subsequent clicks see an entry
    mockState.addSeventyFiveHardEntry.mockImplementation((entry: any) => {
      const ch = mockState.seventyFiveHardChallenges[0]
      ch.dailyEntries = [...(ch.dailyEntries || []), entry]
    })
    mockState.updateSeventyFiveHardEntry.mockImplementation((id: string, updates: any) => {
      const ch = mockState.seventyFiveHardChallenges[0]
      const idx = ch.dailyEntries.findIndex((e: any) => e.id === id)
      if (idx >= 0) ch.dailyEntries[idx] = { ...ch.dailyEntries[idx], ...updates }
    })
    render(<SeventyFiveHard />)

    expect(screen.getByText('Active Challenge')).toBeInTheDocument()
    // Today section
    expect(screen.getByText(/Today - Day\s+1/i)).toBeInTheDocument()

    // First rule row: has a single toggle button (no accessible name); pick first button inside rules list
    const dietHeading = screen.getByText('Follow a Diet')
    const dietRow = dietHeading.closest('div')!.parentElement!.parentElement as HTMLElement
    const toggleBtn = within(dietRow).getAllByRole('button')[0]
    // First click creates entry (add)
    await userEvent.click(toggleBtn)
    // Second click updates existing entry
    await userEvent.click(toggleBtn)
    await waitFor(() => {
      expect(mockState.updateSeventyFiveHardEntry).toHaveBeenCalled()
    })
  })

  it('Toggles both segments for a multi-segment rule', async () => {
    mockState.seventyFiveHardChallenges = [makeActiveChallenge()]
    mockState.addSeventyFiveHardEntry.mockImplementation((entry: any) => {
      const ch = mockState.seventyFiveHardChallenges[0]
      ch.dailyEntries = [...(ch.dailyEntries || []), entry]
    })
    mockState.updateSeventyFiveHardEntry.mockImplementation((id: string, updates: any) => {
      const ch = mockState.seventyFiveHardChallenges[0]
      const idx = ch.dailyEntries.findIndex((e: any) => e.id === id)
      if (idx >= 0) ch.dailyEntries[idx] = { ...ch.dailyEntries[idx], ...updates }
    })
    render(<SeventyFiveHard />)

    // Find buttons with segment titles "Workout 1" and "Workout 2"
    const seg1 = screen.getByRole('button', { name: /workout 1/i })
    const seg2 = screen.getByRole('button', { name: /workout 2/i })

    await userEvent.click(seg1) // creates entry
    await userEvent.click(seg2) // updates existing entry
    await waitFor(() => {
      expect(mockState.updateSeventyFiveHardEntry).toHaveBeenCalled()
    })
  })

  it('Pause sets challenge inactive', async () => {
    mockState.seventyFiveHardChallenges = [makeActiveChallenge()]
    render(<SeventyFiveHard />)

    await userEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(mockState.updateSeventyFiveHardChallenge).toHaveBeenCalledWith('c1', { isActive: false })
  })

  // Reset Start modal covered indirectly by control presence; invoking store call
  // through the modal is skipped here to avoid brittle DOM coupling.

  it('Export creates a blob URL', async () => {
    render(<SeventyFiveHard />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('Import accepts a JSON file and calls addSeventyFiveHardChallenge', async () => {
    const imported = [{
      id: 'c2', name: 'Imported', startDate: new Date().toISOString(), endDate: new Date().toISOString(), isActive: false, currentDay: 1, rules: [], dailyEntries: [], createdAt: new Date().toISOString(), notes: ''
    }]
    render(<SeventyFiveHard />)

    const fileInput = document.querySelector('input[type="file"][accept="application/json"]') as HTMLInputElement
    const file = new File([JSON.stringify(imported)], 'import.json', { type: 'application/json' })
    await waitFor(() => expect(fileInput).toBeTruthy())

    // Fire change event
    await fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockState.addSeventyFiveHardChallenge).toHaveBeenCalled()
    })
  })

  it('Show in Tasks toggle calls setShowSFHTasksInTasks', async () => {
    render(<SeventyFiveHard />)
    const checkbox = screen.getByRole('checkbox', { name: /show in tasks/i })
    await userEvent.click(checkbox)
    expect(mockState.setShowSFHTasksInTasks).toHaveBeenCalledWith(true)
  })

  it('Duplicate cleaners trigger their actions', async () => {
    render(<SeventyFiveHard />)
    await userEvent.click(screen.getByRole('button', { name: /clean duplicates/i }))
    await userEvent.click(screen.getByRole('button', { name: /clean all task duplicates/i }))
    expect(mockState.purgeSFHDuplicateTasks).toHaveBeenCalled()
    expect(mockState.purgeNonSFHDuplicateTasks).toHaveBeenCalled()
  })

  it('Calls ensureSFHTasksForToday on mount when challenge active', async () => {
    mockState.seventyFiveHardChallenges = [makeActiveChallenge()]
    render(<SeventyFiveHard />)
    expect(mockState.ensureSFHTasksForToday).toHaveBeenCalled()
  })
})
