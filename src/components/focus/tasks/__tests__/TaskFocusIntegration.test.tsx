import '@testing-library/jest-dom'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskFocusIntegration } from '../TaskFocusIntegration'
import { vi } from 'vitest'
import { useAppStore } from '../../../../stores/useAppStore'
import type { TodoItem, Project as StoreProject } from '../../../../types'

const baseDate = new Date('2024-01-01T08:00:00.000Z')

const daysFromBase = (days: number): Date => new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

const sampleTasks: TodoItem[] = [
  {
    id: '1',
    title: 'Design homepage mockups',
    description: 'Create wireframes and visual designs for the new homepage',
    status: 'in-progress',
    priority: 'high',
    categoryId: 'work',
    dueDate: daysFromBase(2),
    tags: ['design', 'ui', 'homepage'],
    createdAt: baseDate,
    updatedAt: baseDate,
    estimatedTime: 180,
    actualTime: 75,
    notes: 'Focus on mobile-first approach',
    projectId: '1',
    subtasks: [],
    completed: false
  },
  {
    id: '2',
    title: 'Implement responsive navigation',
    description: 'Code the new navigation component with mobile responsiveness',
    status: 'todo',
    priority: 'medium',
    categoryId: 'work',
    dueDate: daysFromBase(5),
    tags: ['frontend', 'react', 'responsive'],
    createdAt: baseDate,
    updatedAt: baseDate,
    estimatedTime: 120,
    actualTime: 0,
    projectId: '1',
    subtasks: [],
    completed: false
  },
  {
    id: '3',
    title: 'Set up analytics tracking',
    description: 'Implement analytics events',
    status: 'todo',
    priority: 'low',
    categoryId: 'work',
    dueDate: daysFromBase(10),
    tags: ['analytics', 'tracking'],
    createdAt: baseDate,
    updatedAt: baseDate,
    estimatedTime: 90,
    actualTime: 0,
    projectId: '1',
    subtasks: [],
    completed: false
  },
  {
    id: '4',
    title: 'Complete React Hooks tutorial',
    description: 'Go through the official React Hooks documentation and examples',
    status: 'done',
    priority: 'medium',
    categoryId: 'learning',
    dueDate: baseDate,
    tags: ['react', 'hooks', 'tutorial'],
    createdAt: baseDate,
    updatedAt: baseDate,
    estimatedTime: 180,
    actualTime: 165,
    completedAt: baseDate,
    projectId: '2',
    subtasks: [],
    completed: true
  },
  {
    id: '5',
    title: 'Build a todo app with React',
    description: 'Practice React skills by building a functional todo application',
    status: 'in-progress',
    priority: 'high',
    categoryId: 'learning',
    dueDate: daysFromBase(3),
    tags: ['react', 'project', 'practice'],
    createdAt: baseDate,
    updatedAt: baseDate,
    estimatedTime: 240,
    actualTime: 120,
    projectId: '2',
    subtasks: [],
    completed: false
  },
  {
    id: '6',
    title: 'Morning workout routine',
    description: '30-minute morning exercise routine',
    status: 'todo',
    priority: 'medium',
    categoryId: 'health',
    dueDate: baseDate,
    tags: ['exercise', 'morning', 'routine'],
    createdAt: baseDate,
    updatedAt: baseDate,
    estimatedTime: 30,
    actualTime: 0,
    projectId: '3',
    subtasks: [],
    completed: false
  }
]

const sampleProjects: StoreProject[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website',
    color: '#6366f1',
    status: 'active',
    icon: '📁',
    createdAt: baseDate,
    updatedAt: baseDate,
  },
  {
    id: '2',
    name: 'Learning React',
    description: 'Master React framework',
    color: '#10b981',
    status: 'active',
    icon: '📘',
    createdAt: baseDate,
    updatedAt: baseDate,
  },
  {
    id: '3',
    name: 'Fitness Goals',
    description: 'Health and wellness objectives',
    color: '#f59e0b',
    status: 'active',
    icon: '💪',
    createdAt: baseDate,
    updatedAt: baseDate,
  }
]

beforeEach(() => {
  act(() => {
    useAppStore.setState({
      tasks: sampleTasks.map(task => ({ ...task })),
      projects: sampleProjects.map(project => ({ ...project })),
      focusSessions: []
    })
  })
})

afterEach(() => {
  act(() => {
    useAppStore.setState({ tasks: [], projects: [], focusSessions: [] })
  })
})

describe('TaskFocusIntegration tasks tab', () => {
  const renderTasks = (): { user: ReturnType<typeof userEvent.setup>; props: { onStartFocusSession: ReturnType<typeof vi.fn>; onTaskComplete: ReturnType<typeof vi.fn> } } => {
    const props = {
      onStartFocusSession: vi.fn(),
      onTaskComplete: vi.fn(),
    }

    const user = userEvent.setup()
    render(
      <TaskFocusIntegration
        onStartFocusSession={props.onStartFocusSession}
        onTaskComplete={props.onTaskComplete}
      />
    )

    return { user, props }
  }

  it('renders seeded tasks by default', async () => {
    renderTasks()

    expect(await screen.findByText('Design homepage mockups')).toBeInTheDocument()
    const taskHeadings = await screen.findAllByRole('heading', { level: 3 })
    expect(taskHeadings.length).toBeGreaterThan(1)
  })

  it('filters to completed tasks only', async () => {
    const { user } = renderTasks()

    await screen.findByText('Design homepage mockups')
    const filterSelect = screen.getByDisplayValue('All Tasks')

    await user.selectOptions(filterSelect, 'completed')

    expect(await screen.findByText('Complete React Hooks tutorial')).toBeInTheDocument()
    expect(screen.queryByText('Design homepage mockups')).not.toBeInTheDocument()
  })

  it('searches tasks by title', async () => {
    const { user } = renderTasks()

    await screen.findByText('Design homepage mockups')
    const searchInput = screen.getByPlaceholderText('Search tasks...')

    await user.type(searchInput, 'React')

    expect(await screen.findByText('Complete React Hooks tutorial')).toBeInTheDocument()
    expect(await screen.findByText('Build a todo app with React')).toBeInTheDocument()
    expect(screen.queryByText('Design homepage mockups')).not.toBeInTheDocument()
  })

  it('sorts tasks by due date', async () => {
    const { user } = renderTasks()

    await screen.findByText('Design homepage mockups')
    const sortSelect = screen.getByDisplayValue('Sort by Priority')

    await user.selectOptions(sortSelect, 'dueDate')

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3 })
      const titles = headings
        .map((heading) => heading.textContent?.trim())
        .filter((title): title is string => Boolean(title))

      expect(titles[0]).toContain('Complete React Hooks tutorial')
      expect(titles[1]).toContain('Morning workout routine')
    })
  })
})
