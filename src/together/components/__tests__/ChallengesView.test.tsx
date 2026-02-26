/**
 * Unit tests for ChallengesView component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChallengesView } from '../ChallengesView';
import { useAchievementRewards } from '../../hooks';
import { useMergedChallengesConnection } from '../../hooks/useTogetherMergedMode';
import { useCurrentUserId } from '@/hooks/useOwnerInfo';
import type { AchievementReward, PartnerLink } from '../../types';

// Mock dependencies
vi.mock('../../hooks');
vi.mock('../../hooks/useTogetherMergedMode');
vi.mock('@/hooks/useOwnerInfo');
vi.mock('@/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({
    state: { create: false, viewingChallenge: null },
    open: vi.fn(),
    close: vi.fn(),
    set: vi.fn(),
  })),
}));
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: vi.fn(() => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  })),
}));
vi.mock('@/components/common/OwnerFilter', () => ({
  OwnerFilter: () => <div data-testid="owner-filter">Filter</div>,
}));
vi.mock('../ChallengeCard', () => ({
  ChallengeCard: ({ challenge, onClick, showOwner }: any) => (
    <div data-testid={`challenge-card-${challenge.id}`} onClick={onClick}>
      <div data-testid="challenge-title">{challenge.title}</div>
      <div data-testid="challenge-status">{challenge.status}</div>
      {showOwner && <div data-testid="show-owner">true</div>}
    </div>
  ),
}));
vi.mock('../modals/CreateChallengeModal', () => ({
  CreateChallengeModal: ({ isOpen }: any) => (
    isOpen ? <div data-testid="create-challenge-modal">Create</div> : null
  ),
}));
vi.mock('../modals/ChallengeDetailModal', () => ({
  ChallengeDetailModal: ({ isOpen, challenge }: any) => (
    isOpen && challenge ? (
      <div data-testid="challenge-detail-modal">{challenge.title}</div>
    ) : null
  ),
}));

describe('ChallengesView', () => {
  const baseChallenge: AchievementReward = {
    id: 'chal-1',
    user_id: 'user-123',
    creator_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Daily Exercise',
    description: 'Exercise every day for a month',
    challenge_type: 'habit',
    target_count: 30,
    current_progress: 15,
    status: 'active',
    reward_type: 'message',
    reward_description: 'Love letter',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const acceptedPartnerLink: PartnerLink = {
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
    vi.mocked(useMergedChallengesConnection).mockReturnValue({ data: null } as any);
    vi.mocked(useAchievementRewards).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
  });

  describe('Partner link requirement', () => {
    it('should show link partner message when no partner', () => {
      const pendingLink: PartnerLink = {
        ...acceptedPartnerLink,
        status: 'pending',
      };

      render(<ChallengesView partnerLink={pendingLink} />);

      expect(screen.getByText('Link with your partner to create challenges')).toBeInTheDocument();
      expect(screen.getByText('💪')).toBeInTheDocument();
    });

    it('should show link with Shared link when no partner', () => {
      render(<ChallengesView partnerLink={null} />);

      const sharedLink = screen.getByRole('link', { name: /shared/i });
      expect(sharedLink).toHaveAttribute('href', '/shared');
    });

    it('should render challenges view when partner is accepted', () => {
      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Create Challenge for Partner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create challenge/i })).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show skeleton loading', () => {
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no challenges', () => {
      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('No challenges yet')).toBeInTheDocument();
      expect(screen.getByText('Create habit-based challenges with unlockable rewards for your partner')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Challenge')).toBeInTheDocument();
    });

    it('should show emoji in empty state', () => {
      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('🎯')).toBeInTheDocument();
    });
  });

  describe('Challenge categorization', () => {
    it('should categorize active challenges', () => {
      const activeChallenge: AchievementReward = {
        ...baseChallenge,
        status: 'active',
      };

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [activeChallenge],
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Active Challenges')).toBeInTheDocument();
      expect(screen.getByTestId('challenge-card-chal-1')).toBeInTheDocument();
      expect(screen.getByTestId('challenge-status')).toHaveTextContent('active');
    });

    it('should categorize completed challenges', () => {
      const completedChallenge: AchievementReward = {
        ...baseChallenge,
        status: 'completed',
      };

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [completedChallenge],
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Completed Challenges')).toBeInTheDocument();
      expect(screen.getByTestId('challenge-status')).toHaveTextContent('completed');
    });

    it('should categorize expired challenges', () => {
      const expiredChallenge: AchievementReward = {
        ...baseChallenge,
        status: 'expired',
      };

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [expiredChallenge],
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Expired Challenges')).toBeInTheDocument();
      expect(screen.getByTestId('challenge-status')).toHaveTextContent('expired');
    });

    it('should show all three categories when challenges exist in each', () => {
      const challenges: AchievementReward[] = [
        { ...baseChallenge, id: 'active-1', status: 'active' },
        { ...baseChallenge, id: 'completed-1', status: 'completed' },
        { ...baseChallenge, id: 'expired-1', status: 'expired' },
      ];

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: challenges,
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Active Challenges')).toBeInTheDocument();
      expect(screen.getByText('Completed Challenges')).toBeInTheDocument();
      expect(screen.getByText('Expired Challenges')).toBeInTheDocument();
    });
  });

  describe('Merged mode', () => {
    it('should show owner filter when in merged mode', () => {
      vi.mocked(useMergedChallengesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('owner-filter')).toBeInTheDocument();
    });

    it('should not show owner filter when not in merged mode', () => {
      vi.mocked(useMergedChallengesConnection).mockReturnValue({
        data: null,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.queryByTestId('owner-filter')).not.toBeInTheDocument();
    });

    it('should pass showOwner=true to challenge cards in merged mode', () => {
      vi.mocked(useMergedChallengesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [baseChallenge],
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('show-owner')).toBeInTheDocument();
    });

    it('should filter challenges by creator (mine)', () => {
      const myChallenge: AchievementReward = { ...baseChallenge, creator_id: 'user-123' };
      const partnerChallenge: AchievementReward = {
        ...baseChallenge,
        id: 'chal-2',
        creator_id: 'user-456',
      };

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [myChallenge, partnerChallenge],
        isLoading: false,
      } as any);

      vi.mocked(useMergedChallengesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      // Both should be visible initially (default: both selected)
      expect(screen.getByTestId('challenge-card-chal-1')).toBeInTheDocument();
      expect(screen.getByTestId('challenge-card-chal-2')).toBeInTheDocument();
    });
  });

  describe('Modals', () => {
    it('should open create modal when create button clicked', async () => {
      const user = userEvent.setup();
      const mockUseModalState = await import('@/hooks/useModalState');
      const mockOpen = vi.fn();

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { create: false, viewingChallenge: null },
        open: mockOpen,
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      const createButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(createButton);

      expect(mockOpen).toHaveBeenCalledWith('create');
    });

    it('should render create modal when state is true', async () => {
      const mockUseModalState = await import('@/hooks/useModalState');

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { create: true, viewingChallenge: null },
        open: vi.fn(),
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('create-challenge-modal')).toBeInTheDocument();
    });

    it('should open detail modal when challenge card is clicked', async () => {
      const user = userEvent.setup();
      const mockUseModalState = await import('@/hooks/useModalState');
      const mockSet = vi.fn();

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { create: false, viewingChallenge: null },
        open: vi.fn(),
        close: vi.fn(),
        set: mockSet,
      } as any);

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [baseChallenge],
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      const challengeCard = screen.getByTestId('challenge-card-chal-1');
      await user.click(challengeCard);

      expect(mockSet).toHaveBeenCalledWith('viewingChallenge', baseChallenge);
    });

    it('should render detail modal when viewing challenge', async () => {
      const mockUseModalState = await import('@/hooks/useModalState');

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { create: false, viewingChallenge: baseChallenge },
        open: vi.fn(),
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('challenge-detail-modal')).toBeInTheDocument();
      expect(screen.getByTestId('challenge-detail-modal')).toHaveTextContent('Daily Exercise');
    });
  });

  describe('Empty state CTA', () => {
    it('should open create modal when clicking empty state button', async () => {
      const user = userEvent.setup();
      const mockUseModalState = await import('@/hooks/useModalState');
      const mockOpen = vi.fn();

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { create: false, viewingChallenge: null },
        open: mockOpen,
        close: vi.fn(),
        set: vi.fn(),
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      const emptyStateButton = screen.getByText('Create Your First Challenge');
      await user.click(emptyStateButton);

      expect(mockOpen).toHaveBeenCalledWith('create');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on create button', () => {
      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      const createButton = screen.getByRole('button', { name: /create challenge/i });
      expect(createButton).toHaveAttribute('aria-label');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined partner link', () => {
      render(<ChallengesView partnerLink={undefined} />);

      expect(screen.getByText('Link with your partner to create challenges')).toBeInTheDocument();
    });

    it('should handle null partner link', () => {
      render(<ChallengesView partnerLink={null} />);

      expect(screen.getByText('Link with your partner to create challenges')).toBeInTheDocument();
    });

    it('should handle undefined current user ID', () => {
      vi.mocked(useCurrentUserId).mockReturnValue({ data: undefined } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Create Challenge for Partner')).toBeInTheDocument();
    });

    it('should handle empty challenges array', () => {
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('No challenges yet')).toBeInTheDocument();
    });

    it('should handle mixed challenge statuses', () => {
      const challenges: AchievementReward[] = [
        { ...baseChallenge, id: 'c1', status: 'active', title: 'Active 1' },
        { ...baseChallenge, id: 'c2', status: 'active', title: 'Active 2' },
        { ...baseChallenge, id: 'c3', status: 'completed', title: 'Completed 1' },
        { ...baseChallenge, id: 'c4', status: 'expired', title: 'Expired 1' },
      ];

      vi.mocked(useAchievementRewards).mockReturnValue({
        data: challenges,
        isLoading: false,
      } as any);

      render(<ChallengesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getAllByTestId(/^challenge-card-/)).toHaveLength(4);
    });
  });
});
