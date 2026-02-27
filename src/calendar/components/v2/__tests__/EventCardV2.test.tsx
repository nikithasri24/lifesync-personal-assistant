/**
 * Unit tests for EventCardV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCardV2 } from '../EventCardV2';

const eventItem = { id: 'ev-1', title: 'Team Meeting', start_date: '2026-02-27', end_date: '2026-02-27', all_day: false };
const taskItem = { id: 'task-1', title: 'Fix Bug', due_date: '2026-02-27', status: 'todo' };
const habitItem = { id: 'habit-1', name: 'Morning Run' };
const blockItem = { id: 'block-1', name: 'Focus Block', start_time: '09:00', end_time: '11:00' };

describe('EventCardV2', () => {
  describe('Title Extraction', () => {
    it('should display title from item.title', () => {
      render(<EventCardV2 type="event" item={eventItem as any} />);
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('should display title from item.name when title is absent', () => {
      render(<EventCardV2 type="habit" item={habitItem as any} />);
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });

    it('should display "Untitled" when no title or name', () => {
      render(<EventCardV2 type="event" item={{ id: 'x' } as any} />);
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });

    it('should display task title', () => {
      render(<EventCardV2 type="task" item={taskItem as any} />);
      expect(screen.getByText('Fix Bug')).toBeInTheDocument();
    });
  });

  describe('Time Label', () => {
    it('should render time label when provided', () => {
      render(<EventCardV2 type="event" item={eventItem as any} timeLabel="9:00 AM" />);
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    it('should not render time label when not provided', () => {
      render(<EventCardV2 type="event" item={eventItem as any} />);
      expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument();
    });

    it('should render time label with small font class', () => {
      render(<EventCardV2 type="event" item={eventItem as any} timeLabel="2:30 PM" />);
      const timeLabel = screen.getByText('2:30 PM');
      expect(timeLabel.className).toContain('text-[10px]');
    });
  });

  describe('Color Coding by Type', () => {
    it('event type should have purple background class', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-purple-100');
    });

    it('event type should have purple border class', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-purple-500');
    });

    it('event type should have purple text class', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('text-purple-900');
    });

    it('task type should have blue background class', () => {
      const { container } = render(<EventCardV2 type="task" item={taskItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-blue-100');
    });

    it('task type should have blue border class', () => {
      const { container } = render(<EventCardV2 type="task" item={taskItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-blue-500');
    });

    it('habit type should have green background class', () => {
      const { container } = render(<EventCardV2 type="habit" item={habitItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-green-100');
    });

    it('block type should have red background class', () => {
      const { container } = render(<EventCardV2 type="block" item={blockItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-red-100');
    });

    it('block type should have red border class', () => {
      const { container } = render(<EventCardV2 type="block" item={blockItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-red-500');
    });
  });

  describe('Dragging State', () => {
    it('should be draggable', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.getAttribute('draggable')).toBe('true');
    });

    it('should apply opacity-50 class when isDragging=true', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} isDragging={true} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('opacity-50');
    });

    it('should not apply opacity-50 when isDragging=false', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} isDragging={false} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('opacity-50');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();
      render(<EventCardV2 type="event" item={eventItem as any} onClick={onClickMock} />);

      await user.click(screen.getByText('Team Meeting'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', async () => {
      const user = userEvent.setup();
      render(<EventCardV2 type="event" item={eventItem as any} />);

      await expect(user.click(screen.getByText('Team Meeting'))).resolves.not.toThrow();
    });
  });

  describe('Styling', () => {
    it('should have cursor-pointer class', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover opacity class', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:opacity-90');
    });

    it('should have transition class', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('transition-opacity');
    });

    it('should have rounded corners', () => {
      const { container } = render(<EventCardV2 type="event" item={eventItem as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded');
    });

    it('should apply custom style prop', () => {
      const { container } = render(
        <EventCardV2 type="event" item={eventItem as any} style={{ top: '10px', left: '5px' }} />
      );
      const card = container.firstChild as HTMLElement;
      expect(card.style.top).toBe('10px');
      expect(card.style.left).toBe('5px');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <EventCardV2 type="event" item={eventItem as any} className="custom-class" />
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });
  });

  describe('Title Truncation', () => {
    it('should have truncate class on title', () => {
      render(<EventCardV2 type="event" item={eventItem as any} />);
      const title = screen.getByText('Team Meeting');
      expect(title.className).toContain('truncate');
    });

    it('should handle very long titles gracefully', () => {
      const longTitle = 'A'.repeat(200);
      const longItem = { ...eventItem, title: longTitle };
      render(<EventCardV2 type="event" item={longItem as any} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });
});
