/**
 * Unit tests for WeeklyOverviewV2 component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyOverviewV2 } from '../WeeklyOverviewV2';

describe('WeeklyOverviewV2', () => {
  const defaultProps = {
    completedTasks: 12,
    journalEntries: 5,
    totalHabits: 8,
  };

  describe('Basic Rendering', () => {
    it('should render "This Week" header', () => {
      render(<WeeklyOverviewV2 {...defaultProps} />);
      expect(screen.getByText('This Week')).toBeInTheDocument();
    });

    it('should render Tasks Completed label', () => {
      render(<WeeklyOverviewV2 {...defaultProps} />);
      expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
    });

    it('should render Journal Entries label', () => {
      render(<WeeklyOverviewV2 {...defaultProps} />);
      expect(screen.getByText('Journal Entries')).toBeInTheDocument();
    });

    it('should render Total Habits label', () => {
      render(<WeeklyOverviewV2 {...defaultProps} />);
      expect(screen.getByText('Total Habits')).toBeInTheDocument();
    });
  });

  describe('Stat Values', () => {
    it('should display completedTasks value', () => {
      render(<WeeklyOverviewV2 {...defaultProps} completedTasks={12} />);
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display journalEntries value', () => {
      render(<WeeklyOverviewV2 {...defaultProps} journalEntries={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display totalHabits value', () => {
      render(<WeeklyOverviewV2 {...defaultProps} totalHabits={8} />);
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      render(<WeeklyOverviewV2 completedTasks={0} journalEntries={0} totalHabits={0} />);
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(3);
    });

    it('should handle large values', () => {
      render(<WeeklyOverviewV2 completedTasks={999} journalEntries={365} totalHabits={100} />);
      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('365')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have rounded-2xl class', () => {
      const { container } = render(<WeeklyOverviewV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-2xl');
    });

    it('should have white background', () => {
      const { container } = render(<WeeklyOverviewV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
    });

    it('should have shadow', () => {
      const { container } = render(<WeeklyOverviewV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('shadow-sm');
    });

    it('should have space-y-4 for stat items', () => {
      const { container } = render(<WeeklyOverviewV2 {...defaultProps} />);
      const statsContainer = container.querySelector('.space-y-4');
      expect(statsContainer).toBeInTheDocument();
    });

    it('stat values should have text-2xl font-bold', () => {
      render(<WeeklyOverviewV2 {...defaultProps} completedTasks={12} />);
      const valueElement = screen.getByText('12');
      expect(valueElement.className).toContain('text-2xl');
      expect(valueElement.className).toContain('font-bold');
    });
  });

  describe('Icons', () => {
    it('should render SVG icons', () => {
      const { container } = render(<WeeklyOverviewV2 {...defaultProps} />);
      const svgs = container.querySelectorAll('svg');
      // TrendingUp header + 3 stat icons
      expect(svgs.length).toBeGreaterThanOrEqual(4);
    });
  });
});
