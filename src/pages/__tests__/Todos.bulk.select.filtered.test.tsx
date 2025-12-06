import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const updateTaskMock = vi.fn()

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [
        { id: 'x1', title: 'Alpha unit', created_at: now },
        { id: 'x2', title: 'Bravo unit', created_at: now },
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
    })
  }
})

describe('Bulk Select respects filtered list', () => {
  beforeEach(() => updateTaskMock.mockClear())

  it('Select All selects only filtered tasks', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    const { container } = render(<Todos />)

    // Filter by search: only Bravo
    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), { target: { value: 'Bravo' } })
    expect(await screen.findByText('Bravo unit')).toBeInTheDocument()
    expect(screen.queryByText('Alpha unit')).toBeNull()

    // Enable bulk mode and Select All
    const bulkToggle = container.querySelector('button[title="Bulk selection mode"]') as HTMLElement
    fireEvent.click(bulkToggle)
    fireEvent.click(await screen.findByRole('button', { name: /^Select All$/i }))

    // Archive selected
    fireEvent.click(await screen.findByTitle('Archive selected'))

    // Expect updateTask called once for Bravo only
    expect(updateTaskMock).toHaveBeenCalledTimes(1)
    const [idArg, updatesArg] = updateTaskMock.mock.calls[0]
    expect(idArg).toBe('x2')
    expect((updatesArg as any).archived).toBe(true)
  })
})
