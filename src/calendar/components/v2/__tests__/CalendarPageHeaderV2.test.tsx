/**
 * Unit tests for CalendarPageHeaderV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarPageHeaderV2 } from '../CalendarPageHeaderV2';

const defaultProps = {
  currentView: 'month' as const,
  onViewChange: vi.fn(),
  currentMonth: 'February 2026',
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onToday: vi.fn(),
};

describe('CalendarPageHeaderV2', () => {
  describe('Basic Rendering', () => {
    it('should render the Calendar heading', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should render the 📅 emoji', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByText(/📅/)).toBeInTheDocument();
    });

    it('should render "Calendar" text', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByText('📅 Calendar')).toBeInTheDocument();
    });

    it('should render the current month', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentMonth="February 2026" />);
      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('should render Today button', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  describe('View Toggle', () => {
    it('should render Month, Week, Day buttons', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
    });

    it('should highlight active Month view button', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentView="month" />);
      const monthButton = screen.getByText('Month');
      expect(monthButton.className).toContain('bg-white');
    });

    it('should highlight active Week view button', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentView="week" />);
      const weekButton = screen.getByText('Week');
      expect(weekButton.className).toContain('bg-white');
    });

    it('should highlight active Day view button', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentView="day" />);
      const dayButton = screen.getByText('Day');
      expect(dayButton.className).toContain('bg-white');
    });

    it('inactive view buttons should not have bg-white', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentView="month" />);
      const weekButton = screen.getByText('Week');
      const dayButton = screen.getByText('Day');
      expect(weekButton.className).not.toContain('bg-white');
      expect(dayButton.className).not.toContain('bg-white');
    });

    it('active view button should have terracotta color', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentView="month" />);
      const monthButton = screen.getByText('Month');
      // Browser may keep #D4A574 or convert to rgb
      expect(monthButton.style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
    });

    it('inactive view button should have white color', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentView="month" />);
      const weekButton = screen.getByText('Week');
      expect(weekButton.style.color).toBe('white');
    });
  });

  describe('View Change Callbacks', () => {
    it('should call onViewChange with "month" when Month clicked', async () => {
      const user = userEvent.setup();
      const onViewChangeMock = vi.fn();
      render(<CalendarPageHeaderV2 {...defaultProps} onViewChange={onViewChangeMock} />);

      await user.click(screen.getByText('Month'));
      expect(onViewChangeMock).toHaveBeenCalledWith('month');
    });

    it('should call onViewChange with "week" when Week clicked', async () => {
      const user = userEvent.setup();
      const onViewChangeMock = vi.fn();
      render(<CalendarPageHeaderV2 {...defaultProps} onViewChange={onViewChangeMock} />);

      await user.click(screen.getByText('Week'));
      expect(onViewChangeMock).toHaveBeenCalledWith('week');
    });

    it('should call onViewChange with "day" when Day clicked', async () => {
      const user = userEvent.setup();
      const onViewChangeMock = vi.fn();
      render(<CalendarPageHeaderV2 {...defaultProps} onViewChange={onViewChangeMock} />);

      await user.click(screen.getByText('Day'));
      expect(onViewChangeMock).toHaveBeenCalledWith('day');
    });
  });

  describe('Navigation Buttons', () => {
    it('should render Previous button with aria-label', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    });

    it('should render Next button with aria-label', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('should call onPrevious when Previous button clicked', async () => {
      const user = userEvent.setup();
      const onPreviousMock = vi.fn();
      render(<CalendarPageHeaderV2 {...defaultProps} onPrevious={onPreviousMock} />);

      await user.click(screen.getByRole('button', { name: 'Previous' }));
      expect(onPreviousMock).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next button clicked', async () => {
      const user = userEvent.setup();
      const onNextMock = vi.fn();
      render(<CalendarPageHeaderV2 {...defaultProps} onNext={onNextMock} />);

      await user.click(screen.getByRole('button', { name: 'Next' }));
      expect(onNextMock).toHaveBeenCalledTimes(1);
    });

    it('should call onToday when Today button clicked', async () => {
      const user = userEvent.setup();
      const onTodayMock = vi.fn();
      render(<CalendarPageHeaderV2 {...defaultProps} onToday={onTodayMock} />);

      await user.click(screen.getByText('Today'));
      expect(onTodayMock).toHaveBeenCalledTimes(1);
    });

    it('should show navigation arrows ‹ and ›', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      expect(screen.getByText('‹')).toBeInTheDocument();
      expect(screen.getByText('›')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have terracotta gradient background', () => {
      const { container } = render(<CalendarPageHeaderV2 {...defaultProps} />);
      const header = container.firstChild as HTMLElement;
      expect(header.style.background).toContain('linear-gradient');
      expect(header.style.background).toContain('#D4A574');
    });

    it('should have padding classes', () => {
      const { container } = render(<CalendarPageHeaderV2 {...defaultProps} />);
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('px-5');
      expect(header.className).toContain('py-4');
    });

    it('navigation buttons should be rounded-full', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} />);
      const prevButton = screen.getByRole('button', { name: 'Previous' });
      expect(prevButton.className).toContain('rounded-full');
    });

    it('month text should be white and bold', () => {
      render(<CalendarPageHeaderV2 {...defaultProps} currentMonth="March 2026" />);
      const monthText = screen.getByText('March 2026');
      expect(monthText.className).toContain('text-white');
      expect(monthText.className).toContain('font-semibold');
    });
  });

  describe('Month Display Variations', () => {
    const months = ['January 2026', 'June 2025', 'December 2024'];
    months.forEach(month => {
      it(`should display "${month}"`, () => {
        render(<CalendarPageHeaderV2 {...defaultProps} currentMonth={month} />);
        expect(screen.getByText(month)).toBeInTheDocument();
      });
    });
  });
});
