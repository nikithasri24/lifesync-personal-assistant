/**
 * Unit tests for BucketListDestinationCardV2 component
 * Tests rendering, priority badges, category display, and visited status
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BucketListDestinationCardV2 } from '../BucketListDestinationCardV2';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MapPin: ({ size, color }: any) => <div data-testid="map-pin-icon" data-size={size} data-color={color} />,
  Calendar: ({ size }: any) => <div data-testid="calendar-icon" data-size={size} />,
  DollarSign: ({ size }: any) => <div data-testid="dollar-icon" data-size={size} />,
  CheckCircle: ({ size, color }: any) => <div data-testid="check-circle-icon" data-size={size} data-color={color} />,
  Circle: ({ size }: any) => <div data-testid="circle-icon" data-size={size} />,
}));

describe('BucketListDestinationCardV2', () => {
  const mockOnClick = vi.fn();

  const baseDestination = {
    id: '1',
    name: 'Santorini',
    priority: 'high' as const,
    category: 'beach' as const,
    isVisited: false,
    onClick: mockOnClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render destination name', () => {
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      expect(screen.getByText('Santorini')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      const dest = { ...baseDestination, description: 'Beautiful Greek island' };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Beautiful Greek island')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      // Only the name should be there
      expect(screen.getByText('Santorini')).toBeInTheDocument();
    });

    it('should render category emoji', () => {
      const { container } = render(<BucketListDestinationCardV2 {...baseDestination} />);

      expect(container.textContent).toContain('🏖️');
    });
  });

  describe('Location Display', () => {
    it('should display city and country', () => {
      const dest = { ...baseDestination, cityName: 'Oia', countryName: 'Greece' };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Oia, Greece')).toBeInTheDocument();
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    });

    it('should display only country when city not provided', () => {
      const dest = { ...baseDestination, countryName: 'Greece' };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Greece')).toBeInTheDocument();
    });

    it('should display only city when country not provided', () => {
      const dest = { ...baseDestination, cityName: 'Santorini' };
      const { container } = render(<BucketListDestinationCardV2 {...dest} />);

      // Check for location text (not the title)
      expect(container.textContent).toContain('Santorini');
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    });

    it('should not display location when both city and country not provided', () => {
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      expect(screen.queryByTestId('map-pin-icon')).not.toBeInTheDocument();
    });
  });

  describe('Priority Badges', () => {
    it('should display urgent priority badge', () => {
      const dest = { ...baseDestination, priority: 'urgent' as const };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('🔥 Urgent')).toBeInTheDocument();
    });

    it('should display high priority badge', () => {
      const dest = { ...baseDestination, priority: 'high' as const };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('⭐ High')).toBeInTheDocument();
    });

    it('should display medium priority badge', () => {
      const dest = { ...baseDestination, priority: 'medium' as const };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('📌 Medium')).toBeInTheDocument();
    });

    it('should display low priority badge', () => {
      const dest = { ...baseDestination, priority: 'low' as const };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('💭 Someday')).toBeInTheDocument();
    });
  });

  describe('Category Display', () => {
    const categories = [
      { value: 'beach', emoji: '🏖️' },
      { value: 'mountain', emoji: '⛰️' },
      { value: 'city', emoji: '🏙️' },
      { value: 'cultural', emoji: '🏛️' },
      { value: 'adventure', emoji: '🎒' },
      { value: 'relaxation', emoji: '🧘' },
      { value: 'food', emoji: '🍽️' },
      { value: 'wildlife', emoji: '🦁' },
      { value: 'other', emoji: '🌍' },
    ] as const;

    categories.forEach(({ value, emoji }) => {
      it(`should display ${value} category emoji`, () => {
        const dest = { ...baseDestination, category: value };
        const { container } = render(<BucketListDestinationCardV2 {...dest} />);

        expect(container.textContent).toContain(emoji);
      });
    });
  });

  describe('Budget Display', () => {
    it('should display budget when provided', () => {
      const dest = { ...baseDestination, estimatedBudget: 3000, currency: 'USD' };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('$3,000')).toBeInTheDocument();
      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
    });

    it('should not display budget when not provided', () => {
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      expect(screen.queryByTestId('dollar-icon')).not.toBeInTheDocument();
    });

    it('should handle different currencies', () => {
      const dest = { ...baseDestination, estimatedBudget: 2500, currency: 'EUR' };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('€2,500')).toBeInTheDocument();
    });

    it('should default to USD when currency not specified', () => {
      const dest = { ...baseDestination, estimatedBudget: 1500 };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('$1,500')).toBeInTheDocument();
    });
  });

  describe('Target Year and Season', () => {
    it('should display target year when provided', () => {
      const dest = { ...baseDestination, targetYear: 2025 };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('2025')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('should display target season when provided', () => {
      const dest = { ...baseDestination, targetSeason: 'summer' };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText(/Summer/i)).toBeInTheDocument();
    });

    it('should display both season and year', () => {
      const dest = { ...baseDestination, targetSeason: 'spring', targetYear: 2026 };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText(/Spring 2026/i)).toBeInTheDocument();
    });

    it('should not display calendar icon when neither provided', () => {
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument();
    });
  });

  describe('Must-Do Items', () => {
    it('should display must-do items preview', () => {
      const dest = {
        ...baseDestination,
        mustDo: ['Watch sunset', 'Visit wineries', 'Explore beaches'],
      };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Must Do:')).toBeInTheDocument();
      expect(screen.getByText('Watch sunset')).toBeInTheDocument();
      expect(screen.getByText('Visit wineries')).toBeInTheDocument();
    });

    it('should show only first 2 must-do items', () => {
      const dest = {
        ...baseDestination,
        mustDo: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
      };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
    });

    it('should show count of remaining items', () => {
      const dest = {
        ...baseDestination,
        mustDo: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
      };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('should not show must-do section when empty', () => {
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      expect(screen.queryByText('Must Do:')).not.toBeInTheDocument();
    });

    it('should handle empty must-do array', () => {
      const dest = { ...baseDestination, mustDo: [] };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.queryByText('Must Do:')).not.toBeInTheDocument();
    });
  });

  describe('Visited Status', () => {
    it('should show checkmark when visited', () => {
      const dest = { ...baseDestination, isVisited: true };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should apply line-through to name when visited', () => {
      const dest = { ...baseDestination, isVisited: true };
      const { container } = render(<BucketListDestinationCardV2 {...dest} />);

      const nameElement = screen.getByText('Santorini');
      expect(nameElement.style.textDecoration).toContain('line-through');
    });

    it('should not show checkmark when not visited', () => {
      const dest = { ...baseDestination, isVisited: false };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument();
    });

    it('should not apply line-through when not visited', () => {
      const dest = { ...baseDestination, isVisited: false };
      render(<BucketListDestinationCardV2 {...dest} />);

      const nameElement = screen.getByText('Santorini');
      expect(nameElement.style.textDecoration).not.toContain('line-through');
    });
  });

  describe('Owner Badge', () => {
    it('should not show owner badge by default', () => {
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      expect(screen.queryByText(/Sarah|John/)).not.toBeInTheDocument();
    });

    it('should show owner badge when showOwnerBadge is true and owner provided', () => {
      const dest = {
        ...baseDestination,
        showOwnerBadge: true,
        owner: { isOwner: false, displayName: 'Sarah' },
      };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });

    it('should not show owner badge when showOwnerBadge is false', () => {
      const dest = {
        ...baseDestination,
        showOwnerBadge: false,
        owner: { isOwner: false, displayName: 'John' },
      };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.queryByText(/JOHN/)).not.toBeInTheDocument();
    });

    it('should handle isOwner true', () => {
      const dest = {
        ...baseDestination,
        showOwnerBadge: true,
        owner: { isOwner: true, displayName: 'Me' },
      };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Me')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<BucketListDestinationCardV2 {...baseDestination} />);

      await user.click(screen.getByText('Santorini'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<BucketListDestinationCardV2 {...baseDestination} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover effect', () => {
      const { container } = render(<BucketListDestinationCardV2 {...baseDestination} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-lg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long description', () => {
      const longDesc = 'A'.repeat(500);
      const dest = { ...baseDestination, description: longDesc };
      const { container } = render(<BucketListDestinationCardV2 {...dest} />);

      // Should have line clamp
      const descElement = container.querySelector('p');
      expect(descElement?.style.WebkitLineClamp).toBe('2');
    });

    it('should handle zero budget', () => {
      const dest = { ...baseDestination, estimatedBudget: 0 };
      render(<BucketListDestinationCardV2 {...dest} />);

      // Zero budget is falsy, should not display
      expect(screen.queryByTestId('dollar-icon')).not.toBeInTheDocument();
    });

    it('should handle single must-do item', () => {
      const dest = { ...baseDestination, mustDo: ['Single item'] };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.getByText('Single item')).toBeInTheDocument();
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('should handle empty strings for location', () => {
      const dest = { ...baseDestination, cityName: '', countryName: '' };
      render(<BucketListDestinationCardV2 {...dest} />);

      expect(screen.queryByTestId('map-pin-icon')).not.toBeInTheDocument();
    });
  });
});
