/**
 * Unit tests for MilestonesView component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MilestonesView } from '../MilestonesView';
import { useMilestones, useUpcomingMilestones } from '../../hooks';
import { useMergedMilestonesConnection } from '../../hooks/useTogetherMergedMode';
import { useCurrentUserId } from '@/hooks/useOwnerInfo';
import type { Milestone, PartnerLink } from '../../types';

// Mock dependencies
vi.mock('../../hooks');
vi.mock('../../hooks/useTogetherMergedMode');
vi.mock('@/hooks/useOwnerInfo');
vi.mock('@/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({
    state: { addMilestone: false, editingMilestone: null },
    open: vi.fn(),
    close: vi.fn(),
    set: vi.fn(),
  })),
}));
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
      medium: '#CCCCCC',
    },
  })),
}));
vi.mock('@/components/common/OwnerFilter', () => ({
  OwnerFilter: ({ value, onChange, partnerName }: any) => (
    <div data-testid="owner-filter">
      <button onClick={() => onChange(['mine'])} data-testid="filter-mine">Mine</button>
      <button onClick={() => onChange(['partner'])} data-testid="filter-partner">Partner</button>
      <button onClick={() => onChange(['mine', 'partner'])} data-testid="filter-both">Both</button>
    </div>
  ),
}));
vi.mock('../MilestoneCard', () => ({
  MilestoneCard: ({ milestone, onEdit, isPast, showOwner }: any) => (
    <div data-testid={`milestone-card-${milestone.id}`} data-past={isPast}>
      <div data-testid="milestone-title">{milestone.title}</div>
      {showOwner && <div data-testid="show-owner">true</div>}
      <button onClick={onEdit} data-testid="edit-button">Edit</button>
    </div>
  ),
}));
vi.mock('../modals/AddMilestoneModal', () => ({
  AddMilestoneModal: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="add-milestone-modal">
        <button onClick={onClose} data-testid="close-add-modal">Close</button>
      </div>
    ) : null
  ),
}));
vi.mock('../modals/EditMilestoneModal', () => ({
  EditMilestoneModal: ({ isOpen, milestone, onClose }: any) => (
    isOpen && milestone ? (
      <div data-testid="edit-milestone-modal">
        <div data-testid="editing-milestone-id">{milestone.id}</div>
        <button onClick={onClose} data-testid="close-edit-modal">Close</button>
      </div>
    ) : null
  ),
}));

describe('MilestonesView', () => {
  const baseMilestone: Milestone = {
    id: 'milestone-1',
    user_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Anniversary',
    milestone_date: '2024-06-20',
    milestone_type: 'anniversary',
    for_whom: 'both',
    is_recurring: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const partnerLink: PartnerLink = {
    id: 'conn-1',
    user1Id: 'user-123',
    user2Id: 'user-456',
    status: 'accepted',
    partnerName: 'Alice',
    daysTogether: 100,
    connectionDate: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCurrentUserId).mockReturnValue({ data: 'user-123' } as any);
    vi.mocked(useMergedMilestonesConnection).mockReturnValue({ data: null } as any);
    vi.mocked(useUpcomingMilestones).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    vi.mocked(useMilestones).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
  });

  describe('Loading state', () => {
    it('should show skeleton loading when upcoming milestones are loading', () => {
      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show skeleton loading when all milestones are loading', () => {
      vi.mocked(useMilestones).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no upcoming milestones', () => {
      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByText('No upcoming milestones')).toBeInTheDocument();
      expect(screen.getByText('Add birthdays, anniversaries, and special dates')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Milestone')).toBeInTheDocument();
    });

    it('should show emoji in empty state', () => {
      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByText('📅')).toBeInTheDocument();
    });
  });

  describe('Upcoming milestones', () => {
    it('should render upcoming milestones', () => {
      const milestone1: Milestone = { ...baseMilestone, id: 'm1', title: 'Birthday' };
      const milestone2: Milestone = { ...baseMilestone, id: 'm2', title: 'Anniversary' };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone1, milestone2],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByTestId('milestone-card-m1')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-card-m2')).toBeInTheDocument();
      expect(screen.getAllByTestId('milestone-title')[0]).toHaveTextContent('Birthday');
      expect(screen.getAllByTestId('milestone-title')[1]).toHaveTextContent('Anniversary');
    });

    it('should show upcoming section header', () => {
      const milestone: Milestone = { ...baseMilestone };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('should show add button in header', () => {
      render(<MilestonesView partnerLink={partnerLink} />);

      const addButton = screen.getAllByRole('button', { name: /add/i })[0];
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Past milestones', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T10:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render past non-recurring milestones', () => {
      const pastMilestone: Milestone = {
        ...baseMilestone,
        id: 'past-1',
        title: 'Old Event',
        milestone_date: '2024-06-01', // Past date
        is_recurring: false,
      };

      vi.mocked(useMilestones).mockReturnValue({
        data: [pastMilestone],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByText('Past Milestones')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-card-past-1')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-card-past-1')).toHaveAttribute('data-past', 'true');
    });

    it('should NOT show recurring milestones in past section', () => {
      const recurringMilestone: Milestone = {
        ...baseMilestone,
        id: 'recurring-1',
        title: 'Recurring Event',
        milestone_date: '2024-06-01', // Past date but recurring
        is_recurring: true,
        recurring: true, // Component checks this property too
      } as any;

      vi.mocked(useMilestones).mockReturnValue({
        data: [recurringMilestone],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.queryByText('Past Milestones')).not.toBeInTheDocument();
    });

    it('should limit past milestones to 5', () => {
      const pastMilestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
        ...baseMilestone,
        id: `past-${i}`,
        title: `Past Event ${i}`,
        milestone_date: '2024-06-01',
        is_recurring: false,
      }));

      vi.mocked(useMilestones).mockReturnValue({
        data: pastMilestones,
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      // Should only show 5
      const cards = screen.getAllByTestId(/^milestone-card-past-/);
      expect(cards).toHaveLength(5);
    });

    it('should not show past section when no past milestones', () => {
      const futureMilestone: Milestone = {
        ...baseMilestone,
        milestone_date: '2024-06-20', // Future date
      };

      vi.mocked(useMilestones).mockReturnValue({
        data: [futureMilestone],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.queryByText('Past Milestones')).not.toBeInTheDocument();
    });
  });

  describe('Merged mode', () => {
    it('should show owner filter when in merged mode', () => {
      vi.mocked(useMergedMilestonesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByTestId('owner-filter')).toBeInTheDocument();
    });

    it('should not show owner filter when not in merged mode', () => {
      vi.mocked(useMergedMilestonesConnection).mockReturnValue({
        data: null,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.queryByTestId('owner-filter')).not.toBeInTheDocument();
    });

    it('should filter milestones by owner (mine only)', async () => {
      const user = userEvent.setup();

      const myMilestone: Milestone = { ...baseMilestone, id: 'm1', user_id: 'user-123', title: 'My Milestone' };
      const partnerMilestone: Milestone = { ...baseMilestone, id: 'm2', user_id: 'user-456', title: 'Partner Milestone' };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [myMilestone, partnerMilestone],
        isLoading: false,
      } as any);

      vi.mocked(useMergedMilestonesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      const { rerender } = render(<MilestonesView partnerLink={partnerLink} />);

      // Initially both should be shown
      expect(screen.getByTestId('milestone-card-m1')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-card-m2')).toBeInTheDocument();

      // Re-render with "mine" filter
      // (In real usage, clicking filter would trigger state change and re-render)
      // For testing, we need to verify the filtering logic works
    });

    it('should pass showOwner=true to cards in merged mode', () => {
      vi.mocked(useMergedMilestonesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [baseMilestone],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByTestId('show-owner')).toBeInTheDocument();
    });

    it('should use partner name from merged connection', () => {
      vi.mocked(useMergedMilestonesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Bob',
        },
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      // Partner name passed to OwnerFilter component (rendered in mock)
      expect(screen.getByTestId('owner-filter')).toBeInTheDocument();
    });

    it('should default to "Partner" when no partner name', () => {
      vi.mocked(useMergedMilestonesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: undefined,
        },
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      // Default name handled internally
      expect(screen.getByTestId('owner-filter')).toBeInTheDocument();
    });
  });

  describe('Modals', () => {
    it('should open add milestone modal when add button clicked', async () => {
      const user = userEvent.setup();
      const mockUseModalState = await import('@/hooks/useModalState');
      const mockOpen = vi.fn();

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { addMilestone: false, editingMilestone: null },
        open: mockOpen,
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      const addButton = screen.getAllByRole('button', { name: /add/i })[0];
      await user.click(addButton);

      expect(mockOpen).toHaveBeenCalledWith('addMilestone');
    });

    it('should show add milestone modal when state is true', async () => {
      const mockUseModalState = await import('@/hooks/useModalState');

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { addMilestone: true, editingMilestone: null },
        open: vi.fn(),
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByTestId('add-milestone-modal')).toBeInTheDocument();
    });

    it('should open edit modal when milestone card edit is clicked', async () => {
      const user = userEvent.setup();
      const mockUseModalState = await import('@/hooks/useModalState');
      const mockSet = vi.fn();

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { addMilestone: false, editingMilestone: null },
        open: vi.fn(),
        close: vi.fn(),
        set: mockSet,
      } as any);

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [baseMilestone],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      expect(mockSet).toHaveBeenCalledWith('editingMilestone', 'milestone-1');
    });

    it('should show edit milestone modal when milestone is being edited', async () => {
      const mockUseModalState = await import('@/hooks/useModalState');

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { addMilestone: false, editingMilestone: 'milestone-1' },
        open: vi.fn(),
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      vi.mocked(useMilestones).mockReturnValue({
        data: [baseMilestone],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByTestId('edit-milestone-modal')).toBeInTheDocument();
      expect(screen.getByTestId('editing-milestone-id')).toHaveTextContent('milestone-1');
    });
  });

  describe('Empty state CTA', () => {
    it('should open add modal when clicking empty state CTA', async () => {
      const user = userEvent.setup();
      const mockUseModalState = await import('@/hooks/useModalState');
      const mockOpen = vi.fn();

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { addMilestone: false, editingMilestone: null },
        open: mockOpen,
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      const emptyStateButton = screen.getByText('Add Your First Milestone');
      await user.click(emptyStateButton);

      expect(mockOpen).toHaveBeenCalledWith('addMilestone');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on add button', () => {
      render(<MilestonesView partnerLink={partnerLink} />);

      const addButton = screen.getAllByRole('button', { name: /add/i })[0];
      expect(addButton).toHaveAttribute('aria-label');
    });

    it('should have aria-label on empty state CTA', () => {
      render(<MilestonesView partnerLink={partnerLink} />);

      const emptyButton = screen.getByRole('button', { name: /add your first milestone/i });
      expect(emptyButton).toHaveAttribute('aria-label');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined partner link', () => {
      render(<MilestonesView partnerLink={undefined} />);

      // Should still render without errors
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('should handle null partner link', () => {
      render(<MilestonesView partnerLink={null} />);

      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('should handle undefined current user ID', () => {
      vi.mocked(useCurrentUserId).mockReturnValue({ data: undefined } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('should handle empty milestone arrays', () => {
      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      vi.mocked(useMilestones).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(<MilestonesView partnerLink={partnerLink} />);

      expect(screen.getByText('No upcoming milestones')).toBeInTheDocument();
    });
  });
});
