/**
 * Unit tests for QuickActionButtonV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActionButtonV2 } from '../QuickActionButtonV2';
import { Plus, Calendar, Target } from 'lucide-react';

describe('QuickActionButtonV2', () => {
  const defaultProps = {
    icon: Plus,
    label: 'Add Task',
    onClick: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render button label', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });

    it('should render icon', () => {
      const { container } = render(<QuickActionButtonV2 {...defaultProps} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render as a button', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have minimum height', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('min-h-[100px]');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();
      render(<QuickActionButtonV2 {...defaultProps} onClick={onClickMock} />);

      await user.click(screen.getByRole('button'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();
      render(<QuickActionButtonV2 {...defaultProps} onClick={onClickMock} disabled={true} />);

      await user.click(screen.getByRole('button'));
      expect(onClickMock).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled=true', () => {
      render(<QuickActionButtonV2 {...defaultProps} disabled={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not be disabled when disabled=false', () => {
      render(<QuickActionButtonV2 {...defaultProps} disabled={false} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should have opacity-50 when disabled', () => {
      render(<QuickActionButtonV2 {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('opacity-50');
    });

    it('should have cursor-not-allowed when disabled', () => {
      render(<QuickActionButtonV2 {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('cursor-not-allowed');
    });
  });

  describe('Variants', () => {
    it('should render with primary variant (default)', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.className).toBeTruthy();
    });

    it('should render with secondary variant', () => {
      render(<QuickActionButtonV2 {...defaultProps} variant="secondary" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with accent variant', () => {
      render(<QuickActionButtonV2 {...defaultProps} variant="accent" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Different Icons', () => {
    it('should render Calendar icon', () => {
      const { container } = render(<QuickActionButtonV2 {...defaultProps} icon={Calendar} label="Calendar" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('should render Target icon', () => {
      const { container } = render(<QuickActionButtonV2 {...defaultProps} icon={Target} label="Habits" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('Habits')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should have flex-col layout', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('flex-col');
    });

    it('should have items-center class', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('items-center');
    });

    it('label should have text-xs class', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      const label = screen.getByText('Add Task');
      expect(label.className).toContain('text-xs');
    });

    it('label should have font-medium class', () => {
      render(<QuickActionButtonV2 {...defaultProps} />);
      const label = screen.getByText('Add Task');
      expect(label.className).toContain('font-medium');
    });
  });
});
