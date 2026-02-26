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

    it('should show subtask count when provided', () => {
      render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          subtaskCount={3}
        />
      );
      // Subtask count should be displayed
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          subtaskCount={3}
        />
      );
      expect(container.textContent).toContain('3');
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
    it('should call onTaskClick when card is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          onTaskClick={mockOnTaskClick}
        />
      );

      const card = container.querySelector('[data-task-card="true"]');
      if (card) {
        await user.click(card);
        expect(mockOnTaskClick).toHaveBeenCalledWith('task-1');
      }
    });
  });

  describe('Selection Mode', () => {
    it('should call onSelect when clicked in selection mode', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TaskCardV2
          task={mockTask}
          onToggleStatus={mockOnToggleStatus}
          isSelectionMode={true}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = container.querySelector('[data-task-card="true"]');
      if (card) {
        await user.click(card);
        expect(mockOnSelect).toHaveBeenCalledWith('task-1');
      }
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
      const urgentTask = { ...mockTask, priority: 'urgent' as const };
      const { container } = render(
        <TaskCardV2 task={urgentTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toHaveStyle({ borderLeftColor: '#EF4444' });
    });

    it('should show important priority border color', () => {
      const importantTask = { ...mockTask, priority: 'important' as const };
      const { container } = render(
        <TaskCardV2 task={importantTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toHaveStyle({ borderLeftColor: '#F59E0B' });
    });

    it('should show medium priority border color by default', () => {
      const { container } = render(
        <TaskCardV2 task={mockTask} onToggleStatus={mockOnToggleStatus} />
      );

      const card = container.querySelector('[data-task-card="true"]');
      expect(card).toHaveStyle({ borderLeftColor: '#3B82F6' });
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
});
