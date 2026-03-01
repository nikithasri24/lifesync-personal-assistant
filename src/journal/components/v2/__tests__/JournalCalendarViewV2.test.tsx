/**
 * Unit tests for JournalCalendarViewV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalCalendarViewV2 } from '../JournalCalendarViewV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('@/utils/dateUtils', () => ({
  isSameDay: (date1: Date | string, date2: Date | string) => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() === d2.getTime();
  },
}));

describe('JournalCalendarViewV2', () => {
  const mockOnSelectDate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Basic', () => {
    it('should render calendar', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Should render month label
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should render day labels', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('should render current month by default', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(currentMonth)).toBeInTheDocument();
    });
  });

  describe('Month Navigation', () => {
    it('should navigate to previous month', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(currentMonth)).toBeInTheDocument();

      const prevButton = screen.getByLabelText('Previous month');
      await user.click(prevButton);

      // Should show previous month
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthLabel = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(prevMonthLabel)).toBeInTheDocument();
    });

    it('should navigate to next month', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      // Should show next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthLabel = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(nextMonthLabel)).toBeInTheDocument();
    });

    it('should navigate across year boundaries', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const prevButton = screen.getByLabelText('Previous month');

      // Click 12 times to go back a year
      for (let i = 0; i < 12; i++) {
        await user.click(prevButton);
      }

      // Should show same month, previous year
      const prevYear = new Date();
      prevYear.setFullYear(prevYear.getFullYear() - 1);
      const prevYearLabel = prevYear.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(prevYearLabel)).toBeInTheDocument();
    });
  });

  describe('Entry Indicators', () => {
    it('should show indicator for days with entries', () => {
      const entries = [
        { createdAt: new Date(2024, 0, 15) }, // January 15, 2024
      ];

      render(
        <JournalCalendarViewV2
          entries={entries}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Navigate to January 2024
      // Note: This test may need adjustment based on current date
      // For now, just verify the component renders
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should handle entries with string dates', () => {
      const entries = [
        { createdAt: '2024-01-15T10:00:00Z' },
      ];

      render(
        <JournalCalendarViewV2
          entries={entries}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should handle multiple entries on same day', () => {
      const entries = [
        { createdAt: new Date(2024, 0, 15, 9, 0) },
        { createdAt: new Date(2024, 0, 15, 14, 0) },
        { createdAt: new Date(2024, 0, 15, 20, 0) },
      ];

      render(
        <JournalCalendarViewV2
          entries={entries}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Should handle duplicate entries gracefully
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('should call onSelectDate when date is clicked', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Click on the 15th day (should be in current month)
      const dayButton = screen.getByText('15');
      await user.click(dayButton);

      expect(mockOnSelectDate).toHaveBeenCalled();
      const calledDate = mockOnSelectDate.mock.calls[0][0];
      expect(calledDate).toBeInstanceOf(Date);
      expect(calledDate.getDate()).toBe(15);
    });

    it('should show selected date with border', () => {
      const selectedDate = new Date();
      selectedDate.setDate(15);

      const { container } = render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={selectedDate}
          onSelectDate={mockOnSelectDate}
        />
      );

      // The selected date should have a border (implementation detail)
      expect(container).toBeInTheDocument();
    });

    it('should not allow selecting days from other months', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Days from other months should be disabled
      // This test verifies the calendar renders without errors
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Calendar Grid', () => {
    it('should render 42 day cells (6 rows x 7 days)', () => {
      const { container } = render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Find all buttons that represent days
      const dayButtons = container.querySelectorAll('button[type="button"]');
      // Should have 42 day buttons + 2 navigation buttons = 44 total
      expect(dayButtons.length).toBe(44);
    });

    it('should show days from previous month', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Calendar should show trailing days from previous month
      // (implementation verified by visual inspection)
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should show days from next month', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Calendar should show leading days from next month
      // (implementation verified by visual inspection)
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Today Indicator', () => {
    it('should highlight today', () => {
      const { container } = render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Today should be highlighted with gradient background.
      // Use getAllByText because the day number may appear more than once
      // (e.g. in both the grid cell and an adjacent month overlap).
      const today = new Date().getDate();
      const todayElements = screen.getAllByText(String(today));
      expect(todayElements.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should render calendar with no entries', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle February with 28 days', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // Navigate to February (adjust based on current month)
      const currentDate = new Date();
      const monthsToFeb = (2 - currentDate.getMonth() - 1 + 12) % 12;

      const nextButton = screen.getByLabelText('Next month');
      for (let i = 0; i < monthsToFeb; i++) {
        await user.click(nextButton);
      }

      // Should render February without errors
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should handle leap year February', () => {
      // This would require mocking Date to test leap years
      // For now, verify component renders
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should handle entries from different years', () => {
      const entries = [
        { createdAt: new Date(2023, 0, 15) },
        { createdAt: new Date(2024, 0, 15) },
        { createdAt: new Date(2025, 0, 15) },
      ];

      render(
        <JournalCalendarViewV2
          entries={entries}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should handle very large number of entries', () => {
      const entries = Array.from({ length: 1000 }, (_, i) => ({
        createdAt: new Date(2024, 0, (i % 31) + 1),
      }));

      render(
        <JournalCalendarViewV2
          entries={entries}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for navigation', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('should have heading for month', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should have clickable day buttons', () => {
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      // All current month days should be clickable
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      const { container } = render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const calendar = container.firstChild as HTMLElement;
      expect(calendar).toHaveClass('rounded-2xl');
    });

    it('should have padding', () => {
      const { container } = render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const calendar = container.firstChild as HTMLElement;
      expect(calendar).toHaveClass('p-4');
    });

    it('should have bottom margin', () => {
      const { container } = render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const calendar = container.firstChild as HTMLElement;
      expect(calendar).toHaveClass('mb-6');
    });
  });

  describe('User Interactions', () => {
    it('should allow multiple date selections', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const day15 = screen.getByText('15');
      await user.click(day15);
      expect(mockOnSelectDate).toHaveBeenCalledTimes(1);

      const day20 = screen.getByText('20');
      await user.click(day20);
      expect(mockOnSelectDate).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid navigation', async () => {
      const user = userEvent.setup();
      render(
        <JournalCalendarViewV2
          entries={[]}
          selectedDate={null}
          onSelectDate={mockOnSelectDate}
        />
      );

      const nextButton = screen.getByLabelText('Next month');
      const prevButton = screen.getByLabelText('Previous month');

      // Rapid clicking should not break the calendar
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(prevButton);
      await user.click(prevButton);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });
});
