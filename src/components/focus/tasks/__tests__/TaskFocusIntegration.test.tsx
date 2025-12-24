import '@testing-library/jest-dom'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskFocusIntegration } from '../TaskFocusIntegration'
import { vi } from 'vitest'
import { useComposedStore } from '../../../../stores/useComposedStore'
import type { TaskData, Project } from '@/services/types'

const baseDate = new Date('2024-01-01T08:00:00.000Z')

const daysFromBase = (days: number): Date => new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

const sampleTasks: TaskData[] = [
  {
    id: '1',
    user_id: 'test-user',
    title: 'Design homepage mockups',
    description: 'Create wireframes and visual designs for the new homepage',
    status: 'in_progress',
    priority: 'high',
    project_id: '1',
    due_date: daysFromBase(2).toISOString(),
    tags: ['design', 'ui', 'homepage'],
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    estimated_time: 180,
    actual_time: 75,
    notes: 'Focus on mobile-first approach'
  },
  {
    id: '2',
    user_id: 'test-user',
    title: 'Implement responsive navigation',
    description: 'Code the new navigation component with mobile responsiveness',
    status: 'todo',
    priority: 'medium',
    project_id: '1',
    due_date: daysFromBase(5).toISOString(),
    tags: ['frontend', 'react', 'responsive'],
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    estimated_time: 120,
    actual_time: 0
  },
  {
    id: '3',
    user_id: 'test-user',
    title: 'Set up analytics tracking',
    description: 'Implement analytics events',
    status: 'todo',
    priority: 'low',
    project_id: '1',
    due_date: daysFromBase(10).toISOString(),
    tags: ['analytics', 'tracking'],
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    estimated_time: 90,
    actual_time: 0
  },
  {
    id: '4',
    user_id: 'test-user',
    title: 'Complete React Hooks tutorial',
    description: 'Go through the official React Hooks documentation and examples',
    status: 'done',
    priority: 'medium',
    project_id: '2',
    due_date: baseDate.toISOString(),
    tags: ['react', 'hooks', 'tutorial'],
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    estimated_time: 180,
    actual_time: 165,
    completed_at: baseDate.toISOString()
  },
  {
    id: '5',
    user_id: 'test-user',
    title: 'Build a todo app with React',
    description: 'Practice React skills by building a functional todo application',
    status: 'in_progress',
    priority: 'high',
    project_id: '2',
    due_date: daysFromBase(3).toISOString(),
    tags: ['react', 'project', 'practice'],
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    estimated_time: 240,
    actual_time: 120
  },
  {
    id: '6',
    user_id: 'test-user',
    title: 'Morning workout routine',
    description: '30-minute morning exercise routine',
    status: 'todo',
    priority: 'medium',
    project_id: '3',
    due_date: baseDate.toISOString(),
    tags: ['exercise', 'morning', 'routine'],
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    estimated_time: 30,
    actual_time: 0
  }
]

const sampleProjects: Project[] = [
  {
    id: '1',
    user_id: 'test-user',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website',
    color: '#6366f1',
    status: 'active',
    priority: 'high',
    tags: [],
    progress: 30,
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
  },
  {
    id: '2',
    user_id: 'test-user',
    name: 'Learning React',
    description: 'Master React framework',
    color: '#10b981',
    status: 'active',
    priority: 'medium',
    tags: [],
    progress: 50,
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
  },
  {
    id: '3',
    user_id: 'test-user',
    name: 'Fitness Goals',
    description: 'Health and wellness objectives',
    color: '#f59e0b',
    status: 'active',
    priority: 'medium',
    tags: [],
    progress: 10,
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
  }
]

beforeEach(() => {
  act(() => {
    // tasks, projects, and sessions slices removed - now using React Query
    // useComposedStore.setState({
    //   tasks: sampleTasks.map(task => ({ ...task })),
    //   projects: sampleProjects.map(project => ({ ...project })),
    //   sessions: []
    // })
  })
})

afterEach(() => {
  act(() => {
    // useComposedStore.setState({
    //   tasks: [], projects: [], sessions: []
    // })
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
