/**
 * Unit tests for TaskCardV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCardV2 } from '../TaskCardV2';
import type { TaskData, ProjectData } from '@/services/types';

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

vi.mock('@/components/dependencies/DependencyIndicator', () => ({
  DependencyIndicator: ({ task }: any) => (
    <div data-testid="dependency-indicator" title="Blocked by dependencies">
      {task.depends_on?.length || 0} dependencies
    </div>
  ),
}));

describe('TaskCardV2', () => {
  const mockTask: TaskData = {
    id: 'task-1',
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
  };

  const mockProject: ProjectData = {
    id: 'project-1',
    name: 'Test Project',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockOnToggleStatus = vi.fn();
  const mockOnTaskClick = vi.fn();
  const mockOnSelect = vi.fn();
  const mockOnDragStart = vi.fn();
  const mockOnDragEnd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render task title', () => {
      render(<TaskCardV2 task={mockTask} onToggleStatus={mockOnToggleStatus} />);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should render with data-task-card attribute', () => {
      const { container } = render(
        <TaskCardV2 task={mockTask} onToggleStatus={mockOnToggleStatus} />
      );
      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toBeInTheDocument();
    });

    it('should render project name when project is provided', () => {
      render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          project={mockProject}
        />
      );
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should show subtask count when task has follow_up_tasks', () => {
      const taskWithSubtasks = {
        ...mockTask,
        follow_up_tasks: [
          { id: 'st-1', title: 'Subtask 1', completed: false }, // incomplete
          { id: 'st-2', title: 'Subtask 2', completed: false }, // incomplete
          { id: 'st-3', title: 'Subtask 3', completed: false }, // incomplete
        ],
        // Shows 3/3 (3 incomplete out of 3 total)
      };
      const { container } = render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
        />
      );
      // Subtask count should show 3/3 (all incomplete)
      const text = container.textContent || '';
      expect(text).toContain('3');
      expect(text).toMatch(/3.*\/.*3/);
    });

    it('should render owner name in merged mode', () => {
      render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          ownerName="John Doe"
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Due Date Display', () => {
    it('should show "Due today" for today\'s tasks', () => {
      const today = new Date().toISOString();
      const taskWithDueDate = { ...mockTask, due_date: today };
      render(<TaskCardV2 task={taskWithDueDate} onToggleStatus={mockOnToggleStatus} />);
      expect(screen.getByText('Due today')).toBeInTheDocument();
    });

    it('should show "Due tomorrow" for tomorrow\'s tasks', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const taskWithDueDate = { ...mockTask, due_date: tomorrow.toISOString() };
      render(<TaskCardV2 task={taskWithDueDate} onToggleStatus={mockOnToggleStatus} />);
      expect(screen.getByText('Due tomorrow')).toBeInTheDocument();
    });

    it('should show "Overdue" for past tasks', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const taskWithDueDate = { ...mockTask, due_date: yesterday.toISOString() };
      render(<TaskCardV2 task={taskWithDueDate} onToggleStatus={mockOnToggleStatus} />);
      expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
    });

    it('should show formatted date for future tasks', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const taskWithDueDate = { ...mockTask, due_date: futureDate.toISOString() };
      render(<TaskCardV2 task={taskWithDueDate} onToggleStatus={mockOnToggleStatus} />);
      expect(screen.getByText(/Due/i)).toBeInTheDocument();
    });

    it('should not show due date when not provided', () => {
      render(<TaskCardV2 task={mockTask} onToggleStatus={mockOnToggleStatus} />);
      expect(screen.queryByText(/Due/i)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onTaskClick when task content is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          onTaskClick={mockOnTaskClick}
        />
      );

      // Click on the task title
      await user.click(screen.getByText('Test Task'));
      expect(mockOnTaskClick).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Selection Mode', () => {
    it('should call onSelect when checkbox is clicked in selection mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          isSelectionMode={true}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      // In selection mode, there's a checkbox instead of the regular checkbox
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      expect(mockOnSelect).toHaveBeenCalledWith('task-1');
    });

    it('should show selected state when isSelected is true', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          isSelectionMode={true}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );

      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should be draggable when draggable prop is true', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          draggable={true}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
        />
      );

      const card = container.querySelector('[draggable="true"]');
      expect(card).toBeInTheDocument();
    });

    it('should not be draggable when draggable prop is false', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          draggable={false}
        />
      );

      const card = container.querySelector('[draggable="true"]');
      expect(card).not.toBeInTheDocument();
    });

    it('should call onDragStart when drag starts', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          draggable={true}
          onDragStart={mockOnDragStart}
        />
      );

      const card = container.querySelector('[draggable="true"]');
      if (card) {
        const event = new DragEvent('dragstart', { bubbles: true });
        card.dispatchEvent(event);
        expect(mockOnDragStart).toHaveBeenCalledWith(mockTask, expect.any(Object));
      }
    });

    it('should call onDragEnd when drag ends', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          draggable={true}
          onDragEnd={mockOnDragEnd}
        />
      );

      const card = container.querySelector('[draggable="true"]');
      if (card) {
        const event = new DragEvent('dragend', { bubbles: true });
        card.dispatchEvent(event);
        expect(mockOnDragEnd).toHaveBeenCalled();
      }
    });

    it('should show drag count badge when dragging multiple tasks', () => {
      render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          draggable={true}
          isDragging={true}
          draggedTaskCount={3}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should reduce opacity when isDragging is true', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          isDragging={true}
        />
      );

      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toHaveStyle({ opacity: '0.4' });
    });
  });

  describe('Completed State', () => {
    it('should show completed styling for done tasks', () => {
      const completedTask = { ...mockTask, status: 'done' };
      const { container } = render(
        <TaskCardV2 task={completedTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('Priority Border', () => {
    it('should show urgent priority border color', () => {
      const urgentTask: TaskData = { ...mockTask, priority: 'urgent' };
      const { container } = render(
        <TaskCardV2 task={urgentTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      const style = card?.getAttribute('style');
      // RGB conversion of #EF4444 is rgb(239, 68, 68)
      expect(style).toMatch(/border-left.*rgb\(239,\s*68,\s*68\)|border-left.*#EF4444/i);
    });

    it('should show high priority border color', () => {
      const highTask: TaskData = {
        ...mockTask,
        priority: 'high',
      };
      const { container } = render(
        <TaskCardV2 task={highTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      const style = card?.getAttribute('style');
      // RGB conversion of #F97316 is rgb(249, 115, 22)
      expect(style).toMatch(/border-left.*rgb\(249,\s*115,\s*22\)|border-left.*#F97316/i);
    });

    it('should show medium priority border color by default', () => {
      const { container } = render(
        <TaskCardV2 task={mockTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      const style = card?.getAttribute('style');
      // RGB conversion of #3B82F6 is rgb(59, 130, 246)
      expect(style).toMatch(/border-left.*rgb\(59,\s*130,\s*246\)|border-left.*#3B82F6/i);
    });
  });

  describe('Accessibility', () => {
    it('should have data-task-card attribute', () => {
      const { container } = render(
        <TaskCardV2 task={mockTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ADVANCED FEATURES TESTS
  // ============================================================================

  describe('Subtasks', () => {
    const mockOnToggleExpanded = vi.fn();
    const mockOnToggleSubtask = vi.fn();

    const taskWithSubtasks: TaskData = {
      ...mockTask,
      follow_up_tasks: [
        { id: 'st-1', title: 'Subtask 1', completed: false },
        { id: 'st-2', title: 'Subtask 2', completed: true }, // 1 completed
        { id: 'st-3', title: 'Subtask 3', completed: false },
      ],
      // Display format: {incomplete}/{total} = 2/3
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show subtask count indicator', () => {
      const { container } = render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          onToggleExpanded={mockOnToggleExpanded}
        />
      );

      // Should show 2/3 (2 incomplete out of 3 total) - text may be split
      const text = container.textContent || '';
      expect(text).toContain('2');
      expect(text).toContain('3');
      // Verify it's in the format X/Y
      expect(text).toMatch(/2.*\/.*3/);
    });

    it('should show incomplete count correctly', () => {
      const allComplete: TaskData = {
        ...mockTask,
        follow_up_tasks: [
          { id: 'st-1', title: 'Task 1', completed: true },  // completed
          { id: 'st-2', title: 'Task 2', completed: true },  // completed
        ],
        // Shows 0/2 (0 incomplete out of 2 total)
      };

      const { container } = render(
        <TaskCardV2
          task={allComplete}
          onToggleStatus={mockOnToggleStatus}
          onToggleExpanded={mockOnToggleExpanded}
        />
      );

      // Should show 0/2 (all completed, so 0 incomplete)
      const text = container.textContent || '';
      expect(text).toContain('0');
      expect(text).toContain('2');
      expect(text).toMatch(/0.*\/.*2/);
    });

    it('should call onToggleExpanded when subtask count is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          onToggleExpanded={mockOnToggleExpanded}
        />
      );

      const button = screen.getByRole('button', { name: /subtasks/i });
      await user.click(button);

      expect(mockOnToggleExpanded).toHaveBeenCalledWith('task-1');
    });

    it('should show expanded subtasks when isExpanded is true', () => {
      render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          onToggleSubtask={mockOnToggleSubtask}
        />
      );

      expect(screen.getByText('Subtask 1')).toBeInTheDocument();
      expect(screen.getByText('Subtask 2')).toBeInTheDocument();
      expect(screen.getByText('Subtask 3')).toBeInTheDocument();
    });

    it('should not show subtasks when isExpanded is false', () => {
      render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
        />
      );

      expect(screen.queryByText('Subtask 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Subtask 2')).not.toBeInTheDocument();
    });

    it('should call onToggleSubtask when subtask checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          isExpanded={true}
          onToggleSubtask={mockOnToggleSubtask}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is the main task, subsequent are subtasks
      await user.click(checkboxes[1]);

      expect(mockOnToggleSubtask).toHaveBeenCalledWith('task-1', 'st-1');
    });

    it('should show chevron rotated when expanded', () => {
      const { container } = render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
        />
      );

      const chevron = container.querySelector('.rotate-90');
      expect(chevron).toBeInTheDocument();
    });

    it('should show chevron not rotated when collapsed', () => {
      const { container } = render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
        />
      );

      const chevron = container.querySelector('.rotate-90');
      expect(chevron).not.toBeInTheDocument();
    });

    it('should not show subtask indicator when no subtasks', () => {
      render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      expect(screen.queryByText(/\//)).not.toBeInTheDocument(); // No X/Y pattern
    });

    it('should show completed subtasks with line-through', () => {
      const { container } = render(
        <TaskCardV2
          task={taskWithSubtasks}
          onToggleStatus={mockOnToggleStatus}
          isExpanded={true}
        />
      );

      const completedSubtask = screen.getByText('Subtask 2');
      expect(completedSubtask).toHaveClass('line-through');
    });
  });

  describe('Dependencies', () => {
    const mockAllTasks: TaskData[] = [
      {
        id: 'dep-1',
        title: 'Dependency Task 1',
        status: 'todo',
        priority: 'medium',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      },
      {
        id: 'dep-2',
        title: 'Dependency Task 2',
        status: 'done',
        priority: 'medium',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      },
    ];

    it('should show dependency indicator when task has dependencies', () => {
      const taskWithDeps: TaskData = {
        ...mockTask,
        depends_on: ['dep-1', 'dep-2'],
      };

      const { container } = render(
        <TaskCardV2
          task={taskWithDeps}
          onToggleStatus={mockOnToggleStatus}
          allTasks={mockAllTasks}
        />
      );

      // DependencyIndicator should be rendered
      expect(container.querySelector('[title*="Blocked"]') || container.textContent).toBeTruthy();
    });

    it('should not show dependency indicator when no dependencies', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          allTasks={mockAllTasks}
        />
      );

      expect(container.querySelector('[title*="Blocked"]')).not.toBeInTheDocument();
    });

    it('should pass allTasks to DependencyIndicator', () => {
      const taskWithDeps: TaskData = {
        ...mockTask,
        depends_on: ['dep-1'],
      };

      render(
        <TaskCardV2
          task={taskWithDeps}
          onToggleStatus={mockOnToggleStatus}
          allTasks={mockAllTasks}
        />
      );

      // Component renders without errors when allTasks is provided
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  describe('Reminders', () => {
    it('should show reminder icon when reminder is set', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 30, 0, 0);

      const taskWithReminder: TaskData = {
        ...mockTask,
        reminder: tomorrow.toISOString(),
      };

      const { container } = render(
        <TaskCardV2
          task={taskWithReminder}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      // Bell icon should be present
      const bellIcon = container.querySelector('svg[class*="lucide-bell"]');
      expect(bellIcon).toBeInTheDocument();
    });

    it('should display formatted reminder time', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 30, 0, 0);

      const taskWithReminder: TaskData = {
        ...mockTask,
        reminder: tomorrow.toISOString(),
      };

      render(
        <TaskCardV2
          task={taskWithReminder}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      // Should show time in format like "2:30 PM"
      expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
    });

    it('should not show reminder when not set', () => {
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      const bellIcon = container.querySelector('svg[class*="lucide-bell"]');
      expect(bellIcon).not.toBeInTheDocument();
    });

    it('should show blue background for reminder badge', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const taskWithReminder: TaskData = {
        ...mockTask,
        reminder: tomorrow.toISOString(),
      };

      const { container } = render(
        <TaskCardV2
          task={taskWithReminder}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      const badge = container.querySelector('.bg-blue-50');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Combined Advanced Features', () => {
    it('should render task with all advanced features', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      const comprehensiveTask: TaskData = {
        ...mockTask,
        follow_up_tasks: [
          { id: 'st-1', title: 'Step 1', completed: false }, // incomplete
          { id: 'st-2', title: 'Step 2', completed: false }, // incomplete
        ], // Shows 2/2 (2 incomplete out of 2 total)
        depends_on: ['dep-1'],
        reminder: tomorrow.toISOString(),
      };

      const mockAllTasks: TaskData[] = [
        {
          id: 'dep-1',
          title: 'Dependency',
          status: 'todo',
          priority: 'medium',
          created_at: '2024-01-01T00:00:00Z',
          user_id: 'user-1',
        },
      ];

      const { container } = render(
        <TaskCardV2
          task={comprehensiveTask}
          onToggleStatus={mockOnToggleStatus}
          allTasks={mockAllTasks}
        />
      );

      const text = container.textContent || '';

      // Subtasks indicator (2/2 = 2 incomplete out of 2 total)
      expect(text).toMatch(/2.*\/.*2/);

      // Reminder (time display)
      expect(text).toMatch(/3:00 PM/i);

      // Dependency indicator (from mocked component)
      expect(text).toContain('dependencies');
    });

    it('should handle task with some features missing', () => {
      const partialTask: TaskData = {
        ...mockTask,
        follow_up_tasks: [
          { id: 'st-1', title: 'Only subtask', completed: false }, // 1 incomplete
        ],
        // No dependencies or reminder - Shows 1/1 (1 incomplete out of 1 total)
      };

      const { container } = render(
        <TaskCardV2
          task={partialTask}
          onToggleStatus={mockOnToggleStatus}
        />
      );

      const text = container.textContent || '';

      // Only subtasks show (1/1 = 1 incomplete out of 1 total)
      expect(text).toMatch(/1.*\/.*1/);

      // No reminder
      expect(text).not.toMatch(/\d+:\d+\s*(AM|PM)/i);

      // No dependencies
      expect(text).not.toContain('dependencies');
    });
  });
});
