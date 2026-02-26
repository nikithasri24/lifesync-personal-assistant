/**
 * Unit tests for StreakIndicatorV2 component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakIndicatorV2 } from '../StreakIndicatorV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

describe('StreakIndicatorV2', () => {
  describe('Rendering - Basic', () => {
    it('should render current streak', () => {
      render(<StreakIndicatorV2 currentStreak={5} />);

      expect(screen.getByText('5 days')).toBeInTheDocument();
    });

    it('should render singular "day" for streak of 1', () => {
      render(<StreakIndicatorV2 currentStreak={1} />);

      expect(screen.getByText('1 day')).toBeInTheDocument();
    });

    it('should render plural "days" for streak > 1', () => {
      render(<StreakIndicatorV2 currentStreak={10} />);

      expect(screen.getByText('10 days')).toBeInTheDocument();
    });

    it('should show fire icon', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} />);

      // lucide-react Flame renders as svg
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} size="sm" />);

      const indicator = container.querySelector('.text-xs');
      expect(indicator).toBeInTheDocument();
    });

    it('should render medium size (default)', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} size="md" />);

      const indicator = container.querySelector('.text-sm');
      expect(indicator).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} size="lg" />);

      const indicator = container.querySelector('.text-base');
      expect(indicator).toBeInTheDocument();
    });

    it('should default to medium size', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} />);

      const indicator = container.querySelector('.text-sm');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Best Streak Display', () => {
    it('should not show best streak by default', () => {
      render(<StreakIndicatorV2 currentStreak={5} bestStreak={10} />);

      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
    });

    it('should show best streak when showBest is true', () => {
      render(<StreakIndicatorV2 currentStreak={5} bestStreak={10} showBest={true} />);

      expect(screen.getByText('Best: 10')).toBeInTheDocument();
    });

    it('should not show best streak when equal to current', () => {
      render(<StreakIndicatorV2 currentStreak={10} bestStreak={10} showBest={true} />);

      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
    });

    it('should not show best streak when less than current', () => {
      render(<StreakIndicatorV2 currentStreak={15} bestStreak={10} showBest={true} />);

      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
    });

    it('should not show best when undefined', () => {
      render(<StreakIndicatorV2 currentStreak={5} showBest={true} />);

      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
    });
  });

  describe('Milestone Celebrations', () => {
    it('should show celebration emoji for 7-day streak', () => {
      render(<StreakIndicatorV2 currentStreak={7} />);

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should show celebration emoji for 30-day streak', () => {
      render(<StreakIndicatorV2 currentStreak={30} />);

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should show celebration emoji for 100-day streak', () => {
      render(<StreakIndicatorV2 currentStreak={100} />);

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should not show celebration for 6-day streak', () => {
      render(<StreakIndicatorV2 currentStreak={6} />);

      expect(screen.queryByText('🎉')).not.toBeInTheDocument();
    });

    it('should not show celebration for 1-day streak', () => {
      render(<StreakIndicatorV2 currentStreak={1} />);

      expect(screen.queryByText('🎉')).not.toBeInTheDocument();
    });

    it('should show celebration for streaks above 100', () => {
      render(<StreakIndicatorV2 currentStreak={365} />);

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
  });

  describe('Zero Streak', () => {
    it('should handle zero streak', () => {
      render(<StreakIndicatorV2 currentStreak={0} />);

      expect(screen.getByText('0 days')).toBeInTheDocument();
    });

    it('should not show celebration for zero streak', () => {
      render(<StreakIndicatorV2 currentStreak={0} />);

      expect(screen.queryByText('🎉')).not.toBeInTheDocument();
    });
  });

  describe('Large Numbers', () => {
    it('should handle three-digit streaks', () => {
      render(<StreakIndicatorV2 currentStreak={999} />);

      expect(screen.getByText('999 days')).toBeInTheDocument();
    });

    it('should handle four-digit streaks', () => {
      render(<StreakIndicatorV2 currentStreak={1000} />);

      expect(screen.getByText('1000 days')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply gradient background', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} />);

      const indicator = container.querySelector('.inline-flex');
      expect(indicator).toHaveStyle({
        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(245, 124, 0, 0.15) 100%)',
      });
    });

    it('should apply orange color', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} />);

      const indicator = container.querySelector('.inline-flex');
      expect(indicator).toHaveStyle({ color: '#F57C00' });
    });

    it('should have rounded corners', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} />);

      const indicator = container.querySelector('.inline-flex');
      expect(indicator).toHaveClass('rounded-xl');
    });

    it('should have bold font weight', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} />);

      const indicator = container.querySelector('.inline-flex');
      expect(indicator).toHaveClass('font-bold');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should combine custom className with default classes', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} className="mt-4" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('mt-4', 'flex', 'items-center', 'gap-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative streaks gracefully', () => {
      render(<StreakIndicatorV2 currentStreak={-1} />);

      // Should still render, even if value is invalid
      expect(screen.getByText(/-1 day/)).toBeInTheDocument();
    });

    it('should handle very large best streak numbers', () => {
      render(<StreakIndicatorV2 currentStreak={5} bestStreak={99999} showBest={true} />);

      expect(screen.getByText('Best: 99999')).toBeInTheDocument();
    });

    it('should handle missing bestStreak with showBest=true', () => {
      render(<StreakIndicatorV2 currentStreak={5} showBest={true} />);

      // Should not crash, just not show best
      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
    });
  });

  describe('Combined Features', () => {
    it('should show all features together', () => {
      render(
        <StreakIndicatorV2
          currentStreak={30}
          bestStreak={50}
          size="lg"
          showBest={true}
          className="my-custom-class"
        />
      );

      expect(screen.getByText('30 days')).toBeInTheDocument();
      expect(screen.getByText('Best: 50')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should show celebration with best streak', () => {
      render(
        <StreakIndicatorV2
          currentStreak={100}
          bestStreak={200}
          showBest={true}
        />
      );

      expect(screen.getByText('100 days')).toBeInTheDocument();
      expect(screen.getByText('Best: 200')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render filled flame icon', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('fill', '#F57C00');
    });

    it('should render icon with correct size for sm', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} size="sm" />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('w-3', 'h-3');
    });

    it('should render icon with correct size for md', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} size="md" />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    it('should render icon with correct size for lg', () => {
      const { container } = render(<StreakIndicatorV2 currentStreak={5} size="lg" />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });
});
