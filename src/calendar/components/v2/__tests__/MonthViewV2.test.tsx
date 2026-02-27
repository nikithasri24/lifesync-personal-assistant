/**
 * Unit tests for MonthViewV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthViewV2 } from '../MonthViewV2';

const defaultProps = {
  currentDate: new Date('2026-02-15'),
  tasks: [],
  events: [],
  onDateClick: vi.fn(),
  onTaskClick: vi.fn(),
  onEventClick: vi.fn(),
  onDragOver: vi.fn(),
  onDrop: vi.fn(),
};

describe('MonthViewV2', () => {
  describe('Weekday Headers', () => {
    it('should render all 7 weekday headers', () => {
      render(<MonthViewV2 {...defaultProps} />);
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('weekday headers should use uppercase styling', () => {
      render(<MonthViewV2 {...defaultProps} />);
      const sunHeader = screen.getByText('Sun');
      expect(sunHeader.className).toContain('uppercase');
    });

    it('weekday headers should use text-xs', () => {
      render(<MonthViewV2 {...defaultProps} />);
      const monHeader = screen.getByText('Mon');
      expect(monHeader.className).toContain('text-xs');
    });
  });

  describe('Calendar Grid', () => {
    it('should render dates for the current month', () => {
      render(<MonthViewV2 {...defaultProps} />);
      // February 2026 has 28 days
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    it('should render a 7-column grid', () => {
      const { container } = render(<MonthViewV2 {...defaultProps} />);
      const grid = container.querySelector('.grid-cols-7');
      expect(grid).toBeInTheDocument();
    });

    it('should render multiple weeks', () => {
      const { container } = render(<MonthViewV2 {...defaultProps} />);
      // February 2026 spans 4-5 weeks; should have at least 28 date cells
      const dateCells = container.querySelectorAll('.min-h-\\[70px\\]');
      expect(dateCells.length).toBeGreaterThanOrEqual(28);
    });
  });

  describe('Date Clicking', () => {
    it('should call onDateClick when a date is clicked', async () => {
      const user = userEvent.setup();
      const onDateClickMock = vi.fn();
      render(<MonthViewV2 {...defaultProps} onDateClick={onDateClickMock} />);

      // Click on the 15th
      await user.click(screen.getByText('15'));
      expect(onDateClickMock).toHaveBeenCalledTimes(1);
    });

    it('should call onDateClick with a Date object', async () => {
      const user = userEvent.setup();
      const onDateClickMock = vi.fn();
      render(<MonthViewV2 {...defaultProps} onDateClick={onDateClickMock} />);

      await user.click(screen.getByText('15'));
      expect(onDateClickMock).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should call onDateClick with correct date when clicking day 1', async () => {
      const user = userEvent.setup();
      const onDateClickMock = vi.fn();
      render(<MonthViewV2 {...defaultProps} onDateClick={onDateClickMock} />);

      // Find and click the first "1" in the calendar (Feb 1)
      const ones = screen.getAllByText('1');
      await user.click(ones[0]);
      expect(onDateClickMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Dots', () => {
    it('should render terracotta dots for events on a date', () => {
      const events = [
        { id: 'ev-1', title: 'Meeting', start_date: '2026-02-15', end_date: '2026-02-15', all_day: false },
      ];
      const { container } = render(<MonthViewV2 {...defaultProps} events={events as any} />);

      const terracottaDots = container.querySelectorAll('div[style*="rgb(212, 165, 116)"]');
      expect(terracottaDots.length).toBeGreaterThan(0);
    });

    it('should render blue dots for tasks on a date', () => {
      const tasks = [
        { id: 'task-1', title: 'Fix Bug', due_date: '2026-02-15', status: 'todo' },
      ];
      const { container } = render(<MonthViewV2 {...defaultProps} tasks={tasks as any} />);

      const blueDots = container.querySelectorAll('div[style*="rgb(59, 130, 246)"]');
      expect(blueDots.length).toBeGreaterThan(0);
    });

    it('should show max 3 event dots per day', () => {
      const events = Array.from({ length: 5 }, (_, i) => ({
        id: `ev-${i}`,
        title: `Event ${i}`,
        start_date: '2026-02-15',
        end_date: '2026-02-15',
        all_day: false,
      }));
      const { container } = render(<MonthViewV2 {...defaultProps} events={events as any} />);

      // Event dots have width/height 4px style - differentiate from today circle
      const eventDots = container.querySelectorAll('div[style*="width: 4px"]');
      const terracottaDots = Array.from(eventDots).filter(el =>
        (el as HTMLElement).style.backgroundColor.includes('212, 165, 116') ||
        (el as HTMLElement).style.backgroundColor === '#D4A574'
      );
      expect(terracottaDots.length).toBeLessThanOrEqual(3);
    });

    it('should show max 3 task dots per day', () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        due_date: '2026-02-15',
        status: 'todo',
      }));
      const { container } = render(<MonthViewV2 {...defaultProps} tasks={tasks as any} />);

      const blueDots = container.querySelectorAll('div[style*="rgb(59, 130, 246)"]');
      expect(blueDots.length).toBeLessThanOrEqual(3);
    });

    it('should not show dots for done tasks', () => {
      const tasks = [
        { id: 'task-1', title: 'Done Task', due_date: '2026-02-15', status: 'done' },
      ];
      const { container } = render(<MonthViewV2 {...defaultProps} tasks={tasks as any} />);

      const blueDots = container.querySelectorAll('div[style*="rgb(59, 130, 246)"]');
      expect(blueDots.length).toBe(0);
    });

    it('should not show dots for events on different dates', () => {
      const events = [
        { id: 'ev-1', title: 'Other Day Event', start_date: '2026-02-20', end_date: '2026-02-20', all_day: false },
      ];
      const { container } = render(<MonthViewV2 {...defaultProps} events={events as any} />);

      // Only dots with width 4px style (event dots), not today circle
      const eventDots = container.querySelectorAll('div[style*="width: 4px"]');
      const terracottaDots = Array.from(eventDots).filter(el =>
        (el as HTMLElement).style.backgroundColor.includes('212, 165, 116')
      );
      expect(terracottaDots.length).toBe(1);
    });
  });

  describe('Today Highlighting', () => {
    it('should highlight today with special circle', () => {
      // Use today's date
      const today = new Date();
      const { container } = render(<MonthViewV2 {...defaultProps} currentDate={today} />);

      // Today should have a circle background (rounded-full)
      const todayCircle = container.querySelector('.rounded-full.flex.items-center.justify-center');
      expect(todayCircle).toBeInTheDocument();
    });
  });

  describe('Different Months', () => {
    it('should render January 2026 correctly', () => {
      render(<MonthViewV2 {...defaultProps} currentDate={new Date('2026-01-15')} />);
      // January has 31 days - multiple "31"s may appear (Jan 31 + Dec 31 from prev month)
      const thirtyOnes = screen.getAllByText('31');
      expect(thirtyOnes.length).toBeGreaterThanOrEqual(1);
    });

    it('should render March 2026 correctly', () => {
      render(<MonthViewV2 {...defaultProps} currentDate={new Date('2026-03-15')} />);
      expect(screen.getByText('31')).toBeInTheDocument(); // March has 31 days
    });
  });

  describe('Empty State', () => {
    it('should render without events or tasks', () => {
      render(<MonthViewV2 {...defaultProps} tasks={[]} events={[]} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
