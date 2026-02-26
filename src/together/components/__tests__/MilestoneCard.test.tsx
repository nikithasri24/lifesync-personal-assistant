/**
 * Unit tests for MilestoneCard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MilestoneCard } from '../MilestoneCard';
import type { Milestone } from '../../types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: vi.fn(() => ({
    bg: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      white: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
    },
    border: {
      light: '#E5E5E5',
    },
  })),
}));

vi.mock('@/components/common/OwnerBadge', () => ({
  OwnerBadge: ({ userId, currentUserId, partnerName }: any) => (
    <span data-testid="owner-badge">
      {userId === currentUserId ? 'You' : partnerName}
    </span>
  ),
}));

// Mock date helpers to return predictable values
vi.mock('../../utils/dateHelpers', () => ({
  getCountdownText: vi.fn((date: string) => {
    if (date === '2024-06-20') return 'In 5 days';
    if (date === '2024-06-10') return '5 days ago';
    return 'Today';
  }),
  getNextOccurrence: vi.fn((date: string, recurring: boolean) => {
    return recurring ? '2024-06-20' : date;
  }),
  formatDateLong: vi.fn((date: string) => {
    if (date === '2024-06-20') return 'June 20, 2024';
    if (date === '2024-06-10') return 'June 10, 2024';
    return 'June 15, 2024';
  }),
  getAgeText: vi.fn(() => 'Turning 35 years old'),
  getAnniversaryText: vi.fn(() => ({
    years: '4 years together ❤️',
    details: '1,461 days • 0 months',
  })),
}));

describe('MilestoneCard', () => {
  const mockOnEdit = vi.fn();

  const baseMilestone: Milestone = {
    id: 'milestone-1',
    user_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Anniversary',
    milestone_date: '2024-06-20',
    milestone_type: 'anniversary',
    for_whom: 'both',
    is_recurring: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render milestone with title and date', () => {
      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('Anniversary')).toBeInTheDocument();
      expect(screen.getByText('June 20, 2024')).toBeInTheDocument();
    });

    it('should render countdown text', () => {
      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('In 5 days')).toBeInTheDocument();
    });

    it('should render milestone type icon', () => {
      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />);

      // Anniversary icon is 💕
      expect(screen.getByText('💕')).toBeInTheDocument();
    });

    it('should render birthday milestone with age text', () => {
      const birthdayMilestone: Milestone = {
        ...baseMilestone,
        milestone_type: 'birthday',
        title: 'John\'s Birthday',
      };

      render(<MilestoneCard milestone={birthdayMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('John\'s Birthday')).toBeInTheDocument();
      expect(screen.getByText('Turning 35 years old')).toBeInTheDocument();
    });

    it('should render anniversary milestone with years together', () => {
      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('4 years together ❤️')).toBeInTheDocument();
      expect(screen.getByText('1,461 days • 0 months')).toBeInTheDocument();
    });

    it('should not render special text for past milestones', () => {
      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} isPast />);

      expect(screen.queryByText('4 years together ❤️')).not.toBeInTheDocument();
    });

    it('should render photo count when photos exist', () => {
      const milestoneWithPhotos: Milestone = {
        ...baseMilestone,
        photo_urls: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
      };

      render(<MilestoneCard milestone={milestoneWithPhotos} onEdit={mockOnEdit} />);

      expect(screen.getByText('📷')).toBeInTheDocument();
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    it('should not render photo section when no photos', () => {
      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />);

      expect(screen.queryByText('📷')).not.toBeInTheDocument();
    });
  });

  describe('Owner badge', () => {
    it('should show owner badge when showOwner is true', () => {
      render(
        <MilestoneCard
          milestone={baseMilestone}
          onEdit={mockOnEdit}
          showOwner
          currentUserId="user-123"
          partnerName="Alice"
        />
      );

      expect(screen.getByTestId('owner-badge')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should show partner name in badge when milestone belongs to partner', () => {
      render(
        <MilestoneCard
          milestone={baseMilestone}
          onEdit={mockOnEdit}
          showOwner
          currentUserId="user-456"
          partnerName="Alice"
        />
      );

      expect(screen.getByTestId('owner-badge')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should not show owner badge when showOwner is false', () => {
      render(
        <MilestoneCard
          milestone={baseMilestone}
          onEdit={mockOnEdit}
          showOwner={false}
          currentUserId="user-123"
        />
      );

      expect(screen.queryByTestId('owner-badge')).not.toBeInTheDocument();
    });
  });

  describe('Recurring milestones', () => {
    it('should use next occurrence date for recurring milestones', () => {
      const recurringMilestone: Milestone = {
        ...baseMilestone,
        is_recurring: true,
      };

      render(<MilestoneCard milestone={recurringMilestone} onEdit={mockOnEdit} />);

      // Should show next occurrence date
      expect(screen.getByText('June 20, 2024')).toBeInTheDocument();
    });

    it('should use original date for non-recurring milestones', () => {
      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('June 20, 2024')).toBeInTheDocument();
    });
  });

  describe('Styling for past milestones', () => {
    it('should use secondary background for past milestones', () => {
      const { container } = render(
        <MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} isPast />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.backgroundColor).toBe('rgb(245, 245, 245)'); // #F5F5F5
    });

    it('should use white background for upcoming milestones', () => {
      const { container } = render(
        <MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} isPast={false} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.backgroundColor).toBe('rgb(255, 255, 255)'); // #FFFFFF
    });

    it('should use tertiary text color for past milestone countdown', () => {
      const { container } = render(
        <MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} isPast />
      );

      // Find the countdown badge by looking for the element with the countdown text
      const countdownBadge = screen.getByText('In 5 days').closest('div');
      expect(countdownBadge?.getAttribute('style')).toContain('rgb(153, 153, 153)');
    });

    it('should use terracotta color for upcoming milestone countdown', () => {
      const { container } = render(
        <MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} isPast={false} />
      );

      // Find the countdown badge by looking for the element with the countdown text
      const countdownBadge = screen.getByText('In 5 days').closest('div');
      expect(countdownBadge?.getAttribute('style')).toContain('rgb(212, 165, 116)');
    });
  });

  describe('Interactions', () => {
    it('should call onEdit when card is clicked', async () => {
      const user = userEvent.setup();

      render(<MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />);

      const card = screen.getByText('Anniversary').closest('div');
      await user.click(card!);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(
        <MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover effect class', () => {
      const { container } = render(
        <MilestoneCard milestone={baseMilestone} onEdit={mockOnEdit} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-md');
    });
  });

  describe('Different milestone types', () => {
    it('should render birthday icon for birthday milestone', () => {
      const birthdayMilestone: Milestone = {
        ...baseMilestone,
        milestone_type: 'birthday',
      };

      render(<MilestoneCard milestone={birthdayMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('🎂')).toBeInTheDocument();
    });

    it('should render custom icon for custom milestone', () => {
      const customMilestone: Milestone = {
        ...baseMilestone,
        milestone_type: 'custom',
      };

      render(<MilestoneCard milestone={customMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('should render first date icon for first date milestone', () => {
      const firstDateMilestone: Milestone = {
        ...baseMilestone,
        milestone_type: 'first_date',
      };

      render(<MilestoneCard milestone={firstDateMilestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('💑')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle milestone without connection_id', () => {
      const milestone: Milestone = {
        ...baseMilestone,
        connection_id: null,
      };

      render(<MilestoneCard milestone={milestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('Anniversary')).toBeInTheDocument();
    });

    it('should handle empty photo_urls array', () => {
      const milestone: Milestone = {
        ...baseMilestone,
        photo_urls: [],
      };

      render(<MilestoneCard milestone={milestone} onEdit={mockOnEdit} />);

      expect(screen.queryByText('📷')).not.toBeInTheDocument();
    });

    it('should handle milestone with single photo', () => {
      const milestone: Milestone = {
        ...baseMilestone,
        photo_urls: ['photo1.jpg'],
      };

      render(<MilestoneCard milestone={milestone} onEdit={mockOnEdit} />);

      expect(screen.getByText('1 photos')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const milestone: Milestone = {
        ...baseMilestone,
        title: 'This is a very long milestone title that should still display properly',
      };

      render(<MilestoneCard milestone={milestone} onEdit={mockOnEdit} />);

      expect(
        screen.getByText('This is a very long milestone title that should still display properly')
      ).toBeInTheDocument();
    });
  });
});
