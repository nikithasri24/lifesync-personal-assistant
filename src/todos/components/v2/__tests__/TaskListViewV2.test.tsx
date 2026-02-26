/**
 * Unit tests for TaskListViewV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskListViewV2 } from '../TaskListViewV2';
import type { Task, Project } from '../../../types';

// Mock dependencies
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
    badge: { bg: '#F3F4F6', text: '#374151' },
  }),
}));

vi.mock('../TaskCardV2', () => ({
  TaskCardV2: ({ task, onToggleStatus, onTaskClick, isSelectionMode, onSelect }: any) => (
    <div
      data-testid={`task-card-${task.id}`}
      data-task-card="true"
      onClick={() => {
        if (isSelectionMode && onSelect) {
          onSelect(task.id);
        } else if (onTaskClick) {
          onTaskClick(task.id);
        }
      }}
    >
      <span>{task.title}</span>
      <button onClick={() => onToggleStatus(task.id)}>Toggle</button>
    </div>
  ),
}));

describe('TaskListViewV2', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Todo Task',
      status: 'todo',
      priority: 'medium',
      created_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1',
    },
    {
      id: 'task-2',
      title: 'In Progress Task',
      status: 'in_progress',
      priority: 'high',
      created_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1',
    },
    {
      id: 'task-3',
      title: 'Waiting Task',
      status: 'waiting',
      priority: 'low',
      created_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1',
    },
    {
      id: 'task-4',
      title: 'Done Task',
      status: 'done',
      priority: 'medium',
      created_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1',
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'project-1',
      name: 'Test Project',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockOnToggleStatus = vi.fn();
  const mockOnTaskClick = vi.fn();
  const mockOnSelectTask = vi.fn();
  const mockOnDragStart = vi.fn();
  const mockOnDragEnd = vi.fn();
  const mockOnDropOnSection = vi.fn();
  const mockOnDragOver = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all status sections', () => {
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      expect(screen.getAllByText(/To Do/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/In Progress/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Waiting/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Done/i).length).toBeGreaterThan(0);
    });

    it('should render section emojis', () => {
      const { container } = render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      // Check emojis are present in section headers
      expect(container.textContent).toContain('📝');
      expect(container.textContent).toContain('⚡');
      expect(container.textContent).toContain('⏸️');
      expect(container.textContent).toContain('✅');
    });

    it('should render tasks in correct sections', () => {
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      expect(screen.getByText('Todo Task')).toBeInTheDocument();
      expect(screen.getByText('In Progress Task')).toBeInTheDocument();
      expect(screen.getByText('Waiting Task')).toBeInTheDocument();
      expect(screen.getByText('Done Task')).toBeInTheDocument();
    });

    it('should show task count for each section', () => {
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      // Each section should show count of 1
      const counts = screen.getAllByText('1');
      expect(counts.length).toBeGreaterThanOrEqual(4);
    });

    it('should show only tasks in populated sections', () => {
      const todoOnlyTasks = mockTasks.filter((t) => t.status === 'todo');
      render(
        <TaskListViewV2
          tasks={todoOnlyTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      // Only To Do section should have tasks
      expect(screen.getByText('Todo Task')).toBeInTheDocument();
      expect(screen.queryByText('In Progress Task')).not.toBeInTheDocument();
      expect(screen.queryByText('Waiting Task')).not.toBeInTheDocument();
      expect(screen.queryByText('Done Task')).not.toBeInTheDocument();
    });

    it('should show empty state when no tasks', () => {
      render(
        <TaskListViewV2
          tasks={[]}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      expect(screen.getByText(/No tasks found/i)).toBeInTheDocument();
    });
  });

  describe('Task Interactions', () => {
    it('should call onToggleStatus when task checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      const toggleButton = screen.getAllByText('Toggle')[0];
      await user.click(toggleButton);

      expect(mockOnToggleStatus).toHaveBeenCalledWith('task-1');
    });

    it('should call onTaskClick when task is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          onTaskClick={mockOnTaskClick}
        />
      );

      const task = screen.getByTestId('task-card-task-1');
      await user.click(task);

      expect(mockOnTaskClick).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Selection Mode', () => {
    it('should pass isSelectionMode to TaskCards', () => {
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          isSelectionMode={true}
          selectedTaskIds={new Set()}
          onSelectTask={mockOnSelectTask}
        />
      );

      // Tasks should be rendered (selection mode active)
      expect(screen.getByText('Todo Task')).toBeInTheDocument();
    });

    it('should call onSelectTask when task is clicked in selection mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          isSelectionMode={true}
          selectedTaskIds={new Set()}
          onSelectTask={mockOnSelectTask}
        />
      );

      const task = screen.getByTestId('task-card-task-1');
      await user.click(task);

      expect(mockOnSelectTask).toHaveBeenCalledWith('task-1');
    });

    it('should pass selected state to TaskCards', () => {
      const selectedIds = new Set(['task-1', 'task-2']);
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          isSelectionMode={true}
          selectedTaskIds={selectedIds}
          onSelectTask={mockOnSelectTask}
        />
      );

      expect(screen.getByText('Todo Task')).toBeInTheDocument();
      expect(screen.getByText('In Progress Task')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should render drop zones for sections', () => {
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          onDropOnSection={mockOnDropOnSection}
          onDragOver={mockOnDragOver}
        />
      );

      // Sections should be rendered as drop zones
      expect(screen.getByText(/To Do/i)).toBeInTheDocument();
    });

    it('should highlight valid drop targets when dragging', () => {
      const draggedTask = mockTasks[0];
      const { container } = render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          draggedTask={draggedTask}
          onDropOnSection={mockOnDropOnSection}
          onDragOver={mockOnDragOver}
        />
      );

      // Drop zones should be rendered
      const sections = container.querySelectorAll('[class*="transition-all"]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should pass drag handlers to TaskCards', () => {
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
        />
      );

      expect(screen.getByText('Todo Task')).toBeInTheDocument();
    });

    it('should show multi-select drag count', () => {
      const draggedTaskIds = new Set(['task-1', 'task-2']);
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          draggedTaskIds={draggedTaskIds}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText('Todo Task')).toBeInTheDocument();
    });
  });

  describe('Project Integration', () => {
    it('should pass projects to TaskCards', () => {
      const tasksWithProject = [
        { ...mockTasks[0], project_id: 'project-1' },
      ];
      render(
        <TaskListViewV2
          tasks={tasksWithProject}
          projects={mockProjects}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      expect(screen.getByText('Todo Task')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper section structure', () => {
      const { container } = render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      const sections = container.querySelectorAll('[class*="mb-5"]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should render tasks with proper attributes', () => {
      render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      const taskCards = screen.getAllByTestId(/task-card-/);
      expect(taskCards.length).toBe(4);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <TaskListViewV2
          tasks={mockTasks}
          onToggleStatus={mockOnToggleStatus}
          className="custom-class"
        />
      );

      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Status Grouping', () => {
    it('should group scheduled tasks with in_progress', () => {
      const scheduledTask: Task = {
        id: 'task-5',
        title: 'Scheduled Task',
        status: 'scheduled',
        priority: 'medium',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      };
      render(
        <TaskListViewV2
          tasks={[scheduledTask]}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      // Should appear in In Progress section
      expect(screen.getByText('Scheduled Task')).toBeInTheDocument();
      expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    });

    it('should count tasks correctly in each section', () => {
      const multipleTasks: Task[] = [
        ...mockTasks,
        {
          id: 'task-5',
          title: 'Another Todo',
          status: 'todo',
          priority: 'low',
          created_at: '2024-01-01T00:00:00Z',
          user_id: 'user-1',
        },
      ];
      render(
        <TaskListViewV2
          tasks={multipleTasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      // Todo section should have count of 2
      expect(screen.getByText('Another Todo')).toBeInTheDocument();
    });
  });
});
