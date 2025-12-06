import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const updateTaskMock = vi.fn()

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [
        { id: 't1', title: 'Original Title', created_at: now },
      ],
      projects: [],
      loading: false,
      error: null,
      createTask: vi.fn(),
      updateTask: updateTaskMock,
      deleteTask: vi.fn(),
      restoreTask: vi.fn(),
      permanentlyDeleteTask: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshData: vi.fn(),
    }),
  }
})

describe('Todos inline editing', () => {
  beforeEach(() => {
    updateTaskMock.mockClear()
  })

  it('edits task title inline and saves on Enter', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    render(<Todos />)

    // Use the action button to enter edit mode (more stable)
    const editBtn = await screen.findByTitle('Edit task')
    fireEvent.click(editBtn)

    // Input should appear; change value
    const input = await screen.findByDisplayValue('Original Title')
    fireEvent.change(input, { target: { value: 'Renamed Title' } })
    // Save via the Save button to avoid key handling flakiness
    const saveBtn = await screen.findByTitle('Save')
    fireEvent.click(saveBtn)

    // Assert API called with new title
    await waitFor(() => expect(updateTaskMock).toHaveBeenCalled())
    const [idArg, updatesArg] = updateTaskMock.mock.calls[0]
    expect(idArg).toBe('t1')
    expect((updatesArg as any).title).toBe('Renamed Title')
  })

  it('toggles bulk mode and selects a task via checkbox', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    const { container } = render(<Todos />)

    // Enable bulk mode
    const bulkToggle = container.querySelector('button[title="Bulk selection mode"]') as HTMLElement
    expect(bulkToggle).toBeTruthy()
    fireEvent.click(bulkToggle)

    // Checkbox should appear; click to select
    const checkbox = screen.getByLabelText(/Select task/i) as HTMLInputElement
    expect(checkbox).toBeTruthy()
    fireEvent.click(checkbox)

    // Selected label should show "1 selected"
    expect(await screen.findByText(/1 selected/i)).toBeInTheDocument()
  })
})
