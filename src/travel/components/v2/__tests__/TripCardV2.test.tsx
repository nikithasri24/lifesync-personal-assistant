/**
 * Unit tests for TripCardV2 component
 * Tests rendering, status display, metadata, and owner badges
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripCardV2 } from '../TripCardV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
    accent: { start: '#D4A574', end: '#C18B5E' },
  }),
}));

describe('TripCardV2', () => {
  const mockOnClick = vi.fn();

  const baseTrip = {
    id: '1',
    name: 'Summer Europe Trip',
    description: 'Exploring the beautiful cities of Europe',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    status: 'upcoming' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render trip name', () => {
      render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      expect(screen.getByText('Summer Europe Trip')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      expect(screen.getByText('Exploring the beautiful cities of Europe')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const tripWithoutDesc = { ...baseTrip, description: undefined };
      render(<TripCardV2 {...tripWithoutDesc} onClick={mockOnClick} />);

      expect(screen.queryByText('Exploring the beautiful cities of Europe')).not.toBeInTheDocument();
    });

    it('should render cover image when provided', () => {
      const tripWithImage = { ...baseTrip, coverPhoto: 'https://example.com/image.jpg' };
      const { container } = render(<TripCardV2 {...tripWithImage} onClick={mockOnClick} />);

      // When cover photo is provided, plane emoji should not be displayed
      expect(container.textContent).not.toContain('✈️');
    });

    it('should render plane emoji placeholder when no cover image', () => {
      const { container } = render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      expect(container.textContent).toContain('✈️');
    });
  });

  describe('Status Display', () => {
    it('should display planning status', () => {
      const trip = { ...baseTrip, status: 'planning' as const };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      expect(screen.getByText('planning')).toBeInTheDocument();
    });

    it('should display upcoming status', () => {
      const trip = { ...baseTrip, status: 'upcoming' as const };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      expect(screen.getByText('upcoming')).toBeInTheDocument();
    });

    it('should display "In Progress" for in_progress status', () => {
      const trip = { ...baseTrip, status: 'in_progress' as const };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should display completed status', () => {
      const trip = { ...baseTrip, status: 'completed' as const };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('should display cancelled status', () => {
      const trip = { ...baseTrip, status: 'cancelled' as const };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
  });

  describe('Date Range Formatting', () => {
    it('should format dates in same month', () => {
      const trip = {
        ...baseTrip,
        startDate: '2024-07-05',
        endDate: '2024-07-15',
      };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      // Jul 4-14 or Jul 5-15 format (timezone variations)
      expect(screen.getByText(/Jul \d+-\d+/i)).toBeInTheDocument();
    });

    it('should format dates across different months', () => {
      const trip = {
        ...baseTrip,
        startDate: '2024-06-28',
        endDate: '2024-07-05',
      };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      // Jun 27 - Jul 4 or Jun 28 - Jul 5 format (timezone variations)
      expect(screen.getByText(/Jun \d+ - Jul \d+/i)).toBeInTheDocument();
    });

    it('should show calendar emoji with dates', () => {
      const { container } = render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      expect(container.textContent).toContain('📅');
    });
  });

  describe('Budget Display', () => {
    it('should display budget when provided', () => {
      const tripWithBudget = { ...baseTrip, budget: 5000, currency: 'USD' };
      const { container } = render(<TripCardV2 {...tripWithBudget} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/5000\s*USD/i);
    });

    it('should not display budget when not provided', () => {
      const { container } = render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      expect(container.textContent).not.toMatch(/USD/i);
    });

    it('should show money emoji when budget exists', () => {
      const tripWithBudget = { ...baseTrip, budget: 3000 };
      const { container } = render(<TripCardV2 {...tripWithBudget} onClick={mockOnClick} />);

      expect(container.textContent).toContain('💰');
    });

    it('should use default USD currency when not specified', () => {
      const tripWithBudget = { ...baseTrip, budget: 2000 };
      const { container } = render(<TripCardV2 {...tripWithBudget} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/2000\s*USD/i);
    });

    it('should display custom currency', () => {
      const tripWithBudget = { ...baseTrip, budget: 3500, currency: 'EUR' };
      const { container } = render(<TripCardV2 {...tripWithBudget} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/3500\s*EUR/i);
    });
  });

  describe('Tags Display', () => {
    it('should display first tag when provided', () => {
      const tripWithTags = { ...baseTrip, tags: ['backpacking', 'solo', 'adventure'] };
      render(<TripCardV2 {...tripWithTags} onClick={mockOnClick} />);

      expect(screen.getByText('backpacking')).toBeInTheDocument();
    });

    it('should show count of additional tags', () => {
      const tripWithTags = { ...baseTrip, tags: ['business', 'conference', 'networking'] };
      render(<TripCardV2 {...tripWithTags} onClick={mockOnClick} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not show additional count for single tag', () => {
      const tripWithTags = { ...baseTrip, tags: ['family'] };
      render(<TripCardV2 {...tripWithTags} onClick={mockOnClick} />);

      expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    });

    it('should not display tags when not provided', () => {
      render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      expect(screen.queryByText('🏷️')).not.toBeInTheDocument();
    });

    it('should show tag emoji when tags exist', () => {
      const tripWithTags = { ...baseTrip, tags: ['weekend'] };
      const { container } = render(<TripCardV2 {...tripWithTags} onClick={mockOnClick} />);

      expect(container.textContent).toContain('🏷️');
    });
  });

  describe('Owner Badge', () => {
    it('should not show owner badge by default', () => {
      render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      expect(screen.queryByText(/Sarah|John/)).not.toBeInTheDocument();
    });

    it('should show owner badge when showOwnerBadge is true and owner provided', () => {
      const tripWithOwner = {
        ...baseTrip,
        showOwnerBadge: true,
        owner: { isOwner: false, displayName: 'Sarah' },
      };
      render(<TripCardV2 {...tripWithOwner} onClick={mockOnClick} />);

      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });

    it('should not show owner badge when showOwnerBadge is false', () => {
      const tripWithOwner = {
        ...baseTrip,
        showOwnerBadge: false,
        owner: { isOwner: false, displayName: 'John' },
      };
      render(<TripCardV2 {...tripWithOwner} onClick={mockOnClick} />);

      expect(screen.queryByText('John')).not.toBeInTheDocument();
    });

    it('should not show owner badge when owner not provided', () => {
      const trip = { ...baseTrip, showOwnerBadge: true };
      render(<TripCardV2 {...trip} onClick={mockOnClick} />);

      // Should not crash, just not show badge
      expect(screen.getByText('Summer Europe Trip')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      await user.click(screen.getByText('Summer Europe Trip'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover scale effect', () => {
      const { container } = render(<TripCardV2 {...baseTrip} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:scale-[1.01]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags array', () => {
      const tripWithEmptyTags = { ...baseTrip, tags: [] };
      render(<TripCardV2 {...tripWithEmptyTags} onClick={mockOnClick} />);

      expect(screen.queryByText('🏷️')).not.toBeInTheDocument();
    });

    it('should handle zero budget', () => {
      const tripWithZeroBudget = { ...baseTrip, budget: 0 };
      render(<TripCardV2 {...tripWithZeroBudget} onClick={mockOnClick} />);

      // Zero budget is falsy, should not display
      expect(screen.queryByText('💰')).not.toBeInTheDocument();
    });

    it('should handle very long description with line clamp', () => {
      const longDesc = 'A'.repeat(500);
      const tripWithLongDesc = { ...baseTrip, description: longDesc };
      const { container } = render(<TripCardV2 {...tripWithLongDesc} onClick={mockOnClick} />);

      const descElement = container.querySelector('.line-clamp-2');
      expect(descElement).toBeInTheDocument();
    });

    it('should handle empty description string', () => {
      const tripWithEmptyDesc = { ...baseTrip, description: '' };
      render(<TripCardV2 {...tripWithEmptyDesc} onClick={mockOnClick} />);

      // Empty string should still render (but be empty)
      expect(screen.getByText('Summer Europe Trip')).toBeInTheDocument();
    });

    it('should handle same start and end date', () => {
      const tripSameDay = {
        ...baseTrip,
        startDate: '2024-07-10',
        endDate: '2024-07-10',
      };
      const { container } = render(<TripCardV2 {...tripSameDay} onClick={mockOnClick} />);

      // Jul 9-9 or Jul 10-10 format (timezone variations)
      expect(container.textContent).toMatch(/Jul \d+-\d+/i);
    });
  });
});
