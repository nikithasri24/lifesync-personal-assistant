/**
 * Unit tests for EmptyStateV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyStateV2 } from '../EmptyStateV2';
import { CheckSquare, FileText, Target } from 'lucide-react';

describe('EmptyStateV2', () => {
  const defaultProps = {
    icon: CheckSquare,
    title: 'No tasks yet',
    description: 'Add your first task to get started',
  };

  describe('Basic Rendering', () => {
    it('should render title', () => {
      render(<EmptyStateV2 {...defaultProps} />);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<EmptyStateV2 {...defaultProps} />);
      expect(screen.getByText('Add your first task to get started')).toBeInTheDocument();
    });

    it('should render icon', () => {
      const { container } = render(<EmptyStateV2 {...defaultProps} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should not render action button when no actionLabel or onAction', () => {
      render(<EmptyStateV2 {...defaultProps} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render action button when actionLabel and onAction provided', () => {
      render(
        <EmptyStateV2
          {...defaultProps}
          actionLabel="Add Task"
          onAction={vi.fn()}
        />
      );
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });

    it('should not render action button when only actionLabel provided', () => {
      render(<EmptyStateV2 {...defaultProps} actionLabel="Add Task" />);
      expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should call onAction when button clicked', async () => {
      const user = userEvent.setup();
      const onActionMock = vi.fn();
      render(
        <EmptyStateV2
          {...defaultProps}
          actionLabel="Get Started"
          onAction={onActionMock}
        />
      );

      await user.click(screen.getByText('Get Started'));
      expect(onActionMock).toHaveBeenCalledTimes(1);
    });

    it('action button should have white text', () => {
      render(
        <EmptyStateV2
          {...defaultProps}
          actionLabel="Add Task"
          onAction={vi.fn()}
        />
      );
      const button = screen.getByText('Add Task');
      expect(button.className).toContain('text-white');
    });
  });

  describe('Variants', () => {
    it('should render with primary variant (default)', () => {
      render(<EmptyStateV2 {...defaultProps} />);
      // Component renders without error with default variant
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });

    it('should render with secondary variant', () => {
      render(<EmptyStateV2 {...defaultProps} variant="secondary" />);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });

    it('should render with accent variant', () => {
      render(<EmptyStateV2 {...defaultProps} variant="accent" />);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have text-center class', () => {
      const { container } = render(<EmptyStateV2 {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-center');
    });

    it('should have py-12 padding', () => {
      const { container } = render(<EmptyStateV2 {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('py-12');
    });

    it('title should use h4', () => {
      render(<EmptyStateV2 {...defaultProps} />);
      expect(screen.getByRole('heading', { level: 4, name: 'No tasks yet' })).toBeInTheDocument();
    });
  });

  describe('Different Icons', () => {
    it('should render FileText icon', () => {
      const { container } = render(<EmptyStateV2 {...defaultProps} icon={FileText} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Target icon', () => {
      const { container } = render(<EmptyStateV2 {...defaultProps} icon={Target} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Content Variations', () => {
    it('should render long description', () => {
      const longDesc = 'This is a very long description that explains the empty state in detail';
      render(<EmptyStateV2 {...defaultProps} description={longDesc} />);
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('should render different action labels', () => {
      render(
        <EmptyStateV2
          {...defaultProps}
          actionLabel="Create your first task"
          onAction={vi.fn()}
        />
      );
      expect(screen.getByText('Create your first task')).toBeInTheDocument();
    });
  });
});
