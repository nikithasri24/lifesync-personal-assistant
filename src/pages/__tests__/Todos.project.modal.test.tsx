import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

const createProjectMock = vi.fn()

vi.mock('../../hooks/useApiTasks', () => {
  const now = new Date().toISOString()
  return {
    useApiTasks: () => ({
      tasks: [],
      projects: [],
      loading: false,
      error: null,
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      restoreTask: vi.fn(),
      permanentlyDeleteTask: vi.fn(),
      createProject: createProjectMock,
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshData: vi.fn(),
    })
  }
})

describe('Project creation modal', () => {
  it('opens, fills and creates a project', async () => {
    const mod = await import('../TodosWorkingFollowUp')
    const Todos = mod.default
    const { container } = render(<Todos />)
    // Open modal via Projects header action
    const header = screen.getByText('Projects')
    const plusBtn = header.closest('div')!.parentElement!.querySelector('button') as HTMLElement
    fireEvent.click(plusBtn)

    fireEvent.change(screen.getByPlaceholderText('Project name'), { target: { value: 'Unit Test Project' } })
    fireEvent.change(screen.getByPlaceholderText('Project description'), { target: { value: 'Desc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    expect(createProjectMock).toHaveBeenCalled()
    const args = createProjectMock.mock.calls[0][0]
    expect(args.name).toBe('Unit Test Project')
  })
})

