import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const updateTaskMock = vi.fn()
const deleteTaskMock = vi.fn()

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [
        { id: 'a1', title: 'Task A', created_at: now },
        { id: 'b2', title: 'Task B', created_at: now },
      ],
      projects: [],
      loading: false,
      error: null,
      createTask: vi.fn(),
      updateTask: updateTaskMock,
      deleteTask: deleteTaskMock,
      restoreTask: vi.fn(),
      permanentlyDeleteTask: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshData: vi.fn(),
    }),
  }
})

describe('Todos bulk actions', () => {
  beforeEach(() => {
    updateTaskMock.mockClear()
    deleteTaskMock.mockClear()
  })

  it('archives selected tasks via bulk action', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    const { container } = render(<Todos />)

    // Enable bulk mode
    const bulkToggle = container.querySelector('button[title="Bulk selection mode"]') as HTMLElement
    fireEvent.click(bulkToggle)

    // Select all (uses header bulk controls)
    const selectAll = await screen.findByRole('button', { name: /^Select All$/i })
    fireEvent.click(selectAll)

    // Click archive selected
    const archiveBtn = await screen.findByTitle('Archive selected')
    fireEvent.click(archiveBtn)

    // Expect updateTask called for both ids with archived true
    const ids = updateTaskMock.mock.calls.map((c) => c[0])
    expect(ids).toEqual(expect.arrayContaining(['a1', 'b2']))
    for (const call of updateTaskMock.mock.calls) {
      expect((call[1] as any).archived).toBe(true)
    }
  })

  it('deletes selected tasks via bulk action', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    const { container } = render(<Todos />)

    // Enable bulk mode
    const bulkToggle = container.querySelector('button[title="Bulk selection mode"]') as HTMLElement
    fireEvent.click(bulkToggle)
    const selectAll = await screen.findByRole('button', { name: /^Select All$/i })
    fireEvent.click(selectAll)

    // Click delete selected
    const deleteBtn = await screen.findByTitle('Delete selected')
    fireEvent.click(deleteBtn)

    const ids = deleteTaskMock.mock.calls.map((c) => c[0])
    expect(ids).toEqual(expect.arrayContaining(['a1', 'b2']))
  })
})
