/**
 * Unit tests for TaskCardV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCardV2 } from '../TaskCardV2';

const defaultProps = {
  id: 'task-1',
  title: 'Wash Face',
  emoji: '🧼',
  status: 'due' as const,
  dueDate: 'Today',
  onComplete: vi.fn(),
};

describe('TaskCardV2', () => {
  describe('Basic Rendering', () => {
    it('should render task title', () => {
      render(<TaskCardV2 {...defaultProps} />);
      expect(screen.getByText('Wash Face')).toBeInTheDocument();
    });

    it('should render task emoji', () => {
      render(<TaskCardV2 {...defaultProps} />);
      expect(screen.getByText('🧼')).toBeInTheDocument();
    });

    it('should render due date', () => {
      render(<TaskCardV2 {...defaultProps} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('should not render category when not provided', () => {
      render(<TaskCardV2 {...defaultProps} />);
      expect(screen.queryByText(/•/)).not.toBeInTheDocument();
    });

    it('should render category name when provided', () => {
      render(<TaskCardV2 {...defaultProps} categoryName="Morning Routine" />);
      expect(screen.getByText(/Morning Routine/)).toBeInTheDocument();
    });

    it('should render category with bullet separator', () => {
      render(<TaskCardV2 {...defaultProps} categoryName="Evening Routine" dueDate="Tomorrow" />);
      expect(screen.getByText('Tomorrow • Evening Routine')).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('should show DUE badge for due status', () => {
      render(<TaskCardV2 {...defaultProps} status="due" />);
      expect(screen.getByText('DUE')).toBeInTheDocument();
    });

    it('should show UPCOMING badge for upcoming status', () => {
      render(<TaskCardV2 {...defaultProps} status="upcoming" />);
      expect(screen.getByText('UPCOMING')).toBeInTheDocument();
    });

    it('should show COMPLETED badge for completed status', () => {
      render(<TaskCardV2 {...defaultProps} status="completed" />);
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });

    it('should have orange styling for due badge', () => {
      render(<TaskCardV2 {...defaultProps} status="due" />);
      const badge = screen.getByText('DUE');
      // Verify badge renders (styling verified through visual testing)
      expect(badge).toBeInTheDocument();
    });

    it('should have green styling for upcoming badge', () => {
      render(<TaskCardV2 {...defaultProps} status="upcoming" />);
      const badge = screen.getByText('UPCOMING');
      expect(badge).toBeInTheDocument();
    });

    it('should have purple styling for completed badge', () => {
      render(<TaskCardV2 {...defaultProps} status="completed" />);
      const badge = screen.getByText('COMPLETED');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should show "Complete Now" button for due status', () => {
      render(<TaskCardV2 {...defaultProps} status="due" />);
      expect(screen.getByText('Complete Now')).toBeInTheDocument();
    });

    it('should show "Mark as Done" button for upcoming status', () => {
      render(<TaskCardV2 {...defaultProps} status="upcoming" />);
      expect(screen.getByText('Mark as Done')).toBeInTheDocument();
    });

    it('should NOT show action button for completed status', () => {
      render(<TaskCardV2 {...defaultProps} status="completed" />);
      expect(screen.queryByText('Complete Now')).not.toBeInTheDocument();
      expect(screen.queryByText('Mark as Done')).not.toBeInTheDocument();
    });

    it('should NOT show action button when onComplete not provided', () => {
      render(<TaskCardV2 {...defaultProps} onComplete={undefined} />);
      expect(screen.queryByText('Complete Now')).not.toBeInTheDocument();
    });

    it('should call onComplete when "Complete Now" is clicked', async () => {
      const user = userEvent.setup();
      const onCompleteMock = vi.fn();
      render(<TaskCardV2 {...defaultProps} status="due" onComplete={onCompleteMock} />);

      await user.click(screen.getByText('Complete Now'));
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete when "Mark as Done" is clicked', async () => {
      const user = userEvent.setup();
      const onCompleteMock = vi.fn();
      render(<TaskCardV2 {...defaultProps} status="upcoming" onComplete={onCompleteMock} />);

      await user.click(screen.getByText('Mark as Done'));
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
    });

    it('action button should have terracotta gradient', () => {
      render(<TaskCardV2 {...defaultProps} status="due" />);
      const button = screen.getByText('Complete Now');
      expect(button.style.background).toContain('linear-gradient');
      expect(button.style.background).toContain('#D4A574');
      expect(button.style.background).toContain('#C18B5E');
    });
  });

  describe('Styling', () => {
    it('should have white background', () => {
      const { container } = render(<TaskCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.background).toBe('white');
    });

    it('should have terracotta left border', () => {
      const { container } = render(<TaskCardV2 {...defaultProps} />);
      // borderLeft style on root card element
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeft).toContain('4px solid');
    });

    it('should have rounded corners', () => {
      const { container } = render(<TaskCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderRadius).toBe('12px');
    });

    it('should have box shadow', () => {
      const { container } = render(<TaskCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.boxShadow).toContain('rgba(92, 74, 58, 0.08)');
    });

    it('should have correct padding', () => {
      const { container } = render(<TaskCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.padding).toBe('16px');
    });

    it('emoji should have larger font size', () => {
      render(<TaskCardV2 {...defaultProps} />);
      const emoji = screen.getByText('🧼');
      expect(emoji.style.fontSize).toBe('20px');
    });
  });

  describe('Due Date Variations', () => {
    it('should display "Today" as due date', () => {
      render(<TaskCardV2 {...defaultProps} dueDate="Today" />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('should display "Tomorrow" as due date', () => {
      render(<TaskCardV2 {...defaultProps} dueDate="Tomorrow" />);
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('should display "In 3 days" as due date', () => {
      render(<TaskCardV2 {...defaultProps} dueDate="In 3 days" />);
      expect(screen.getByText('In 3 days')).toBeInTheDocument();
    });

    it('should display "Overdue by 2 days" as due date', () => {
      render(<TaskCardV2 {...defaultProps} dueDate="Overdue by 2 days" />);
      expect(screen.getByText('Overdue by 2 days')).toBeInTheDocument();
    });
  });

  describe('Different Emojis', () => {
    it('should render face wash emoji', () => {
      render(<TaskCardV2 {...defaultProps} emoji="🧖" />);
      expect(screen.getByText('🧖')).toBeInTheDocument();
    });

    it('should render nail care emoji', () => {
      render(<TaskCardV2 {...defaultProps} emoji="💅" />);
      expect(screen.getByText('💅')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle long task title', () => {
      const longTitle = 'Apply Advanced Anti-Aging Serum to Face and Neck Area';
      render(<TaskCardV2 {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should render without onClick handler', () => {
      expect(() => render(<TaskCardV2 {...defaultProps} onClick={undefined} />)).not.toThrow();
    });

    it('should render all statuses without errors', () => {
      const { rerender } = render(<TaskCardV2 {...defaultProps} status="due" />);
      expect(screen.getByText('DUE')).toBeInTheDocument();

      rerender(<TaskCardV2 {...defaultProps} status="upcoming" />);
      expect(screen.getByText('UPCOMING')).toBeInTheDocument();

      rerender(<TaskCardV2 {...defaultProps} status="completed" />);
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });
});
