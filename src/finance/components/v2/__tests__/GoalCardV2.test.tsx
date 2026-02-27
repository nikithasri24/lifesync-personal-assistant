/**
 * Unit tests for GoalCardV2 component
 * Tests financial goal cards with progress tracking and category icons
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalCardV2 } from '../GoalCardV2';

describe('GoalCardV2', () => {
  const mockOnClick = vi.fn();

  const baseGoal = {
    id: '1',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 5000,
    deadline: '2026-12-31T00:00:00Z',
    category: 'emergency',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render goal name', () => {
      render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    it('should render current amount', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$5,000/);
    });

    it('should render target amount', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$10,000/);
    });

    it('should render deadline when provided', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Dec|December/i);
      expect(container.textContent).toMatch(/2026/);
    });

    it('should not render deadline when not provided', () => {
      const goalNoDeadline = { ...baseGoal, deadline: undefined };
      const { container } = render(<GoalCardV2 goal={goalNoDeadline} onClick={mockOnClick} />);

      expect(container.textContent).not.toMatch(/Target:/);
    });

    it('should render category icon', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(container.textContent).toContain('🛟');
    });
  });

  describe('Category Icons', () => {
    const categories = [
      { category: 'vacation', icon: '✈️' },
      { category: 'home', icon: '🏠' },
      { category: 'car', icon: '🚗' },
      { category: 'education', icon: '🎓' },
      { category: 'emergency', icon: '🛟' },
      { category: 'retirement', icon: '🌴' },
      { category: 'investment', icon: '📈' },
      { category: 'other', icon: '🎯' },
    ];

    categories.forEach(({ category, icon }) => {
      it(`should display ${category} category icon`, () => {
        const goal = { ...baseGoal, category };
        const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

        expect(container.textContent).toContain(icon);
      });
    });

    it('should display default icon for unknown category', () => {
      const goal = { ...baseGoal, category: 'unknown' };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toContain('🎯');
    });

    it('should display default icon when category not provided', () => {
      const goal = { ...baseGoal, category: undefined };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toContain('🎯');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate percentage correctly', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      // 5000/10000 = 50%
      expect(container.textContent).toMatch(/50% Complete/);
    });

    it('should display progress bar with correct width', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      const progressBar = container.querySelector('div[style*="width: 50%"]');
      expect(progressBar).toBeTruthy();
    });

    it('should handle 0% progress', () => {
      const goal = { ...baseGoal, currentAmount: 0 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/0% Complete/);
    });

    it('should handle 100% progress', () => {
      const goal = { ...baseGoal, currentAmount: 10000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/100% Complete/);
    });

    it('should cap percentage at 100% when over target', () => {
      const goal = { ...baseGoal, currentAmount: 15000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/100% Complete/);
      const progressBar = container.querySelector('div[style*="width: 100%"]');
      expect(progressBar).toBeTruthy();
    });

    it('should handle fractional percentages', () => {
      const goal = { ...baseGoal, currentAmount: 3333, targetAmount: 10000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      // 3333/10000 = 33.33%, rounded to 33%
      expect(container.textContent).toMatch(/33% Complete/);
    });

    it('should round percentage to nearest integer', () => {
      const goal = { ...baseGoal, currentAmount: 6789, targetAmount: 10000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      // 6789/10000 = 67.89%, rounded to 68%
      expect(container.textContent).toMatch(/68% Complete/);
    });
  });

  describe('Remaining Amount', () => {
    it('should display remaining amount when not complete', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$5,000 to go/);
    });

    it('should not display remaining amount when goal is complete', () => {
      const goal = { ...baseGoal, currentAmount: 10000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).not.toMatch(/to go/);
    });

    it('should not display remaining amount when over target', () => {
      const goal = { ...baseGoal, currentAmount: 12000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).not.toMatch(/to go/);
    });

    it('should calculate remaining amount correctly', () => {
      const goal = { ...baseGoal, currentAmount: 7500, targetAmount: 10000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$2,500 to go/);
    });
  });

  describe('Date Formatting', () => {
    it('should format deadline as "Month Year"', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Dec|December/i);
      expect(container.textContent).toMatch(/2026/);
    });

    it('should handle different months', () => {
      const goal = { ...baseGoal, deadline: '2026-06-15T00:00:00Z' };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Jun|June/i);
    });

    it('should handle different years', () => {
      const goal = { ...baseGoal, deadline: '2027-06-15T00:00:00Z' };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/2027/);
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency without decimals', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$5,000/);
      expect(container.textContent).toMatch(/\$10,000/);
      expect(container.textContent).not.toMatch(/\$5,000\.00/);
    });

    it('should handle large amounts with commas', () => {
      const goal = { ...baseGoal, currentAmount: 50000, targetAmount: 100000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$50,000/);
      expect(container.textContent).toMatch(/\$100,000/);
    });

    it('should format remaining amount', () => {
      const goal = { ...baseGoal, currentAmount: 2500, targetAmount: 10000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$7,500 to go/);
    });
  });

  describe('Progress Bar Styling', () => {
    it('should use green gradient for progress bar', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      const progressBar = container.querySelector('div[style*="width: 50%"]');
      expect(progressBar?.getAttribute('style')).toMatch(/#4CAF50|#388E3C/);
    });

    it('should apply transition to progress bar', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      const progressBar = container.querySelector('div[style*="width: 50%"]');
      expect(progressBar?.getAttribute('style')).toContain('transition');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      const card = screen.getByText('Emergency Fund').closest('div');
      if (card) {
        await user.click(card);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover scale effect', () => {
      const { container } = render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:scale-[1.01]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero current amount', () => {
      const goal = { ...baseGoal, currentAmount: 0 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$0/);
      expect(container.textContent).toMatch(/\$10,000 to go/);
    });

    it('should handle zero target amount', () => {
      const goal = { ...baseGoal, targetAmount: 0, currentAmount: 0 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$0/);
    });

    it('should handle very large amounts', () => {
      const goal = { ...baseGoal, currentAmount: 500000, targetAmount: 1000000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$500,000/);
      expect(container.textContent).toMatch(/\$1,000,000/);
    });

    it('should handle very long goal name', () => {
      const goal = { ...baseGoal, name: 'Long-term Retirement and Investment Portfolio Savings Goal' };
      render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(screen.getByText('Long-term Retirement and Investment Portfolio Savings Goal')).toBeInTheDocument();
    });

    it('should handle small amounts', () => {
      const goal = { ...baseGoal, currentAmount: 10, targetAmount: 100 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$10/);
      expect(container.textContent).toMatch(/\$100/);
    });

    it('should handle exact target match', () => {
      const goal = { ...baseGoal, currentAmount: 10000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/100% Complete/);
      expect(container.textContent).not.toMatch(/to go/);
    });

    it('should handle current amount exceeding target', () => {
      const goal = { ...baseGoal, currentAmount: 15000 };
      const { container } = render(<GoalCardV2 goal={goal} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$15,000/);
      expect(container.textContent).toMatch(/100% Complete/);
    });
  });

  describe('Labels and Headers', () => {
    it('should display "Saved" label', () => {
      render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should display "Target" label', () => {
      render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(screen.getByText('Target')).toBeInTheDocument();
    });

    it('should display "Target:" prefix for deadline', () => {
      render(<GoalCardV2 goal={baseGoal} onClick={mockOnClick} />);

      expect(screen.getByText(/Target:/)).toBeInTheDocument();
    });
  });
});
