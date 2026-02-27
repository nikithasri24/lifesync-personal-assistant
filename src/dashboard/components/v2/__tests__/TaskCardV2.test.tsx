/**
 * Unit tests for Dashboard TaskCardV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCardV2 } from '../TaskCardV2';

const baseTask = {
  id: 'task-1',
  title: 'Write unit tests',
  status: 'todo',
  priority: 'high',
  due_date: '2026-02-27',
  created_at: '2026-02-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

describe('Dashboard TaskCardV2', () => {
  describe('Basic Rendering', () => {
    it('should render task title', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      expect(screen.getByText('Write unit tests')).toBeInTheDocument();
    });

    it('should render completion checkbox button', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render priority badge', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should render due date when provided', () => {
      const { container } = render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      // Due date renders with a Clock icon - find the date text container
      const clockIcon = container.querySelector('svg.lucide-clock');
      expect(clockIcon).toBeInTheDocument();
      // The date text is a sibling to the clock icon
      const dateWrapper = clockIcon?.parentElement;
      expect(dateWrapper?.textContent).toMatch(/Feb/);
    });

    it('should not render Clock icon when no due date', () => {
      const taskWithoutDate = { ...baseTask, due_date: undefined };
      const { container } = render(<TaskCardV2 task={taskWithoutDate as any} onComplete={vi.fn()} />);
      expect(container.querySelector('svg.lucide-clock')).not.toBeInTheDocument();
    });
  });

  describe('Completion', () => {
    it('should call onComplete with task id when checkbox clicked', async () => {
      const user = userEvent.setup();
      const onCompleteMock = vi.fn();
      render(<TaskCardV2 task={baseTask as any} onComplete={onCompleteMock} />);

      await user.click(screen.getByRole('button'));
      expect(onCompleteMock).toHaveBeenCalledWith('task-1');
    });

    it('should disable button when isCompleting=true', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} isCompleting={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should enable button when isCompleting=false', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} isCompleting={false} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should not call onComplete when isCompleting=true', async () => {
      const user = userEvent.setup();
      const onCompleteMock = vi.fn();
      render(<TaskCardV2 task={baseTask as any} onComplete={onCompleteMock} isCompleting={true} />);

      await user.click(screen.getByRole('button'));
      expect(onCompleteMock).not.toHaveBeenCalled();
    });
  });

  describe('Priority Styling', () => {
    it('urgent priority badge', () => {
      const urgentTask = { ...baseTask, priority: 'urgent' };
      render(<TaskCardV2 task={urgentTask as any} onComplete={vi.fn()} />);
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('medium priority badge', () => {
      const mediumTask = { ...baseTask, priority: 'medium' };
      render(<TaskCardV2 task={mediumTask as any} onComplete={vi.fn()} />);
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('low priority badge', () => {
      const lowTask = { ...baseTask, priority: 'low' };
      render(<TaskCardV2 task={lowTask as any} onComplete={vi.fn()} />);
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('should handle no priority gracefully', () => {
      const noPriorityTask = { ...baseTask, priority: undefined };
      render(<TaskCardV2 task={noPriorityTask as any} onComplete={vi.fn()} />);
      expect(screen.getByText('Write unit tests')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have rounded-xl class', () => {
      const { container } = render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-xl');
    });

    it('should have shadow-sm class', () => {
      const { container } = render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('shadow-sm');
    });

    it('should have white background', () => {
      const { container } = render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
    });

    it('title should have truncate class', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} />);
      const title = screen.getByText('Write unit tests');
      expect(title.className).toContain('truncate');
    });
  });

  describe('Index Animation', () => {
    it('should render correctly at index=0', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} index={0} />);
      expect(screen.getByText('Write unit tests')).toBeInTheDocument();
    });

    it('should render correctly at index=3', () => {
      render(<TaskCardV2 task={baseTask as any} onComplete={vi.fn()} index={3} />);
      expect(screen.getByText('Write unit tests')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long task title', () => {
      const longTitle = 'A'.repeat(100);
      const longTitleTask = { ...baseTask, title: longTitle };
      render(<TaskCardV2 task={longTitleTask as any} onComplete={vi.fn()} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle task with no id gracefully', () => {
      const noIdTask = { ...baseTask, id: undefined };
      render(<TaskCardV2 task={noIdTask as any} onComplete={vi.fn()} />);
      // Button should be disabled if no id
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
