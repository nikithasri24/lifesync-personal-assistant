/**
 * Unit tests for NutritionStatsV2 component
 * Tests 2x2 stats grid for dashboard metrics
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NutritionStatsV2 } from '../NutritionStatsV2';

describe('NutritionStatsV2', () => {
  const defaultProps = {
    dayStreak: 7,
    avgCalories: 2150,
    avgProtein: 125,
    goalHitRate: 85,
  };

  describe('Basic Rendering', () => {
    it('should render all four stat cards', () => {
      const { container } = render(<NutritionStatsV2 {...defaultProps} />);

      const statCards = container.querySelectorAll('div[style*="background: white"]');
      expect(statCards).toHaveLength(4);
    });

    it('should render stat icons', () => {
      render(<NutritionStatsV2 {...defaultProps} />);

      expect(screen.getByText('🔥')).toBeInTheDocument(); // Day Streak
      expect(screen.getByText('📈')).toBeInTheDocument(); // Avg Calories
      expect(screen.getByText('🥩')).toBeInTheDocument(); // Avg Protein
      expect(screen.getByText('🎯')).toBeInTheDocument(); // Goal Hit Rate
    });

    it('should render stat labels', () => {
      render(<NutritionStatsV2 {...defaultProps} />);

      expect(screen.getByText('Day Streak')).toBeInTheDocument();
      expect(screen.getByText('Avg Calories')).toBeInTheDocument();
      expect(screen.getByText('Avg Protein')).toBeInTheDocument();
      expect(screen.getByText('Goal Hit Rate')).toBeInTheDocument();
    });
  });

  describe('Day Streak', () => {
    it('should display day streak value', () => {
      render(<NutritionStatsV2 {...defaultProps} />);

      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should handle zero day streak', () => {
      render(<NutritionStatsV2 {...defaultProps} dayStreak={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle high day streak values', () => {
      render(<NutritionStatsV2 {...defaultProps} dayStreak={365} />);

      expect(screen.getByText('365')).toBeInTheDocument();
    });
  });

  describe('Average Calories', () => {
    it('should display average calories with locale formatting', () => {
      render(<NutritionStatsV2 {...defaultProps} />);

      expect(screen.getByText('2,150')).toBeInTheDocument();
    });

    it('should format large calorie values with commas', () => {
      render(<NutritionStatsV2 {...defaultProps} avgCalories={12345} />);

      expect(screen.getByText('12,345')).toBeInTheDocument();
    });

    it('should handle zero average calories', () => {
      render(<NutritionStatsV2 {...defaultProps} avgCalories={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle decimal average calories', () => {
      render(<NutritionStatsV2 {...defaultProps} avgCalories={2150.75} />);

      // toLocaleString() should format it
      expect(screen.getByText(/2,150/)).toBeInTheDocument();
    });
  });

  describe('Average Protein', () => {
    it('should display average protein with "g" suffix', () => {
      render(<NutritionStatsV2 {...defaultProps} />);

      expect(screen.getByText('125g')).toBeInTheDocument();
    });

    it('should round decimal protein values', () => {
      render(<NutritionStatsV2 {...defaultProps} avgProtein={123.4} />);

      expect(screen.getByText('123g')).toBeInTheDocument();
    });

    it('should round protein values up when needed', () => {
      render(<NutritionStatsV2 {...defaultProps} avgProtein={123.6} />);

      expect(screen.getByText('124g')).toBeInTheDocument();
    });

    it('should handle zero protein', () => {
      render(<NutritionStatsV2 {...defaultProps} avgProtein={0} />);

      expect(screen.getByText('0g')).toBeInTheDocument();
    });

    it('should handle high protein values', () => {
      render(<NutritionStatsV2 {...defaultProps} avgProtein={250} />);

      expect(screen.getByText('250g')).toBeInTheDocument();
    });
  });

  describe('Goal Hit Rate', () => {
    it('should display goal hit rate with "%" suffix', () => {
      render(<NutritionStatsV2 {...defaultProps} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should round decimal percentage values', () => {
      render(<NutritionStatsV2 {...defaultProps} goalHitRate={87.4} />);

      expect(screen.getByText('87%')).toBeInTheDocument();
    });

    it('should round percentage up when needed', () => {
      render(<NutritionStatsV2 {...defaultProps} goalHitRate={87.6} />);

      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should handle 0% goal hit rate', () => {
      render(<NutritionStatsV2 {...defaultProps} goalHitRate={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100% goal hit rate', () => {
      render(<NutritionStatsV2 {...defaultProps} goalHitRate={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle values over 100%', () => {
      render(<NutritionStatsV2 {...defaultProps} goalHitRate={120} />);

      expect(screen.getByText('120%')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should use 2-column grid layout', () => {
      const { container } = render(<NutritionStatsV2 {...defaultProps} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer.style.display).toBe('grid');
      expect(gridContainer.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
    });

    it('should have gap between cards', () => {
      const { container } = render(<NutritionStatsV2 {...defaultProps} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer.style.gap).toBe('12px');
    });
  });

  describe('Card Styling', () => {
    it('should have white background on all cards', () => {
      const { container } = render(<NutritionStatsV2 {...defaultProps} />);

      const statCards = container.querySelectorAll('div[style*="background: white"]');
      statCards.forEach(card => {
        expect((card as HTMLElement).style.background).toBe('white');
      });
    });

    it('should have rounded corners on all cards', () => {
      const { container } = render(<NutritionStatsV2 {...defaultProps} />);

      const statCards = container.querySelectorAll('div[style*="background: white"]');
      statCards.forEach(card => {
        expect((card as HTMLElement).style.borderRadius).toBe('16px');
      });
    });

    it('should have box shadow on all cards', () => {
      const { container } = render(<NutritionStatsV2 {...defaultProps} />);

      const statCards = container.querySelectorAll('div[style*="background: white"]');
      statCards.forEach(card => {
        expect((card as HTMLElement).style.boxShadow).toContain('rgba(92, 74, 58, 0.08)');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle all values at zero', () => {
      render(
        <NutritionStatsV2
          dayStreak={0}
          avgCalories={0}
          avgProtein={0}
          goalHitRate={0}
        />
      );

      // Check for labels to verify all stats are present
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
      expect(screen.getByText('Avg Calories')).toBeInTheDocument();
      expect(screen.getByText('Avg Protein')).toBeInTheDocument();
      expect(screen.getByText('Goal Hit Rate')).toBeInTheDocument();

      // Check for zero values with specific suffixes
      expect(screen.getByText('0g')).toBeInTheDocument(); // Protein
      expect(screen.getByText('0%')).toBeInTheDocument(); // Goal hit rate
    });

    it('should handle negative values', () => {
      render(
        <NutritionStatsV2
          dayStreak={-5}
          avgCalories={-1000}
          avgProtein={-50}
          goalHitRate={-10}
        />
      );

      expect(screen.getByText('-5')).toBeInTheDocument();
      expect(screen.getByText('-1,000')).toBeInTheDocument();
      expect(screen.getByText('-50g')).toBeInTheDocument();
      expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('should handle very large values', () => {
      render(
        <NutritionStatsV2
          dayStreak={1000}
          avgCalories={99999}
          avgProtein={999}
          goalHitRate={999}
        />
      );

      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('99,999')).toBeInTheDocument();
      expect(screen.getByText('999g')).toBeInTheDocument();
      expect(screen.getByText('999%')).toBeInTheDocument();
    });

    it('should handle decimal day streak gracefully', () => {
      render(<NutritionStatsV2 {...defaultProps} dayStreak={7.5} />);

      // toString() will show decimal
      expect(screen.getByText('7.5')).toBeInTheDocument();
    });
  });
});
