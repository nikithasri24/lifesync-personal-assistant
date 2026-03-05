/**
 * Unit tests for ChallengeCard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChallengeCard } from '../ChallengeCard';
import type { AchievementReward } from '../../types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: vi.fn(() => ({
    bg: {
      white: '#FFFFFF',
      secondary: '#F5F5F5',
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

vi.mock('../../hooks/useAchievementRewardsQuery', () => ({
  useUpdateAchievementReward: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

describe('ChallengeCard', () => {
  const mockOnClick = vi.fn();

  const baseChallenge: AchievementReward = {
    id: 'challenge-1',
    connection_id: 'conn-1',
    creator_id: 'user-123',
    title: '30 Day Workout Challenge',
    description: 'Complete 30 workouts',
    target_value: 30,
    current_progress: 15,
    unit: 'workouts',
    status: 'active',
    reward_description: 'Spa day together!',
    reward_type: 'activity',
    hide_reward: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render challenge title and description', () => {
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />);

      expect(screen.getByText('30 Day Workout Challenge')).toBeInTheDocument();
      expect(screen.getByText('Complete 30 workouts')).toBeInTheDocument();
    });

    it('should render challenge emoji', () => {
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />);

      expect(screen.getByText('💪')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const challengeWithoutDesc: AchievementReward = {
        ...baseChallenge,
        description: null,
      };

      render(<ChallengeCard challenge={challengeWithoutDesc} onClick={mockOnClick} />);

      expect(screen.queryByText('Complete 30 workouts')).not.toBeInTheDocument();
    });

    it('should render reward description when user is the creator', () => {
      // Creator always sees the real reward text
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} currentUserId="user-123" />);

      expect(screen.getByText('Spa day together!')).toBeInTheDocument();
    });

    it('should render default reward text when no description and user is creator', () => {
      const challengeWithoutReward: AchievementReward = {
        ...baseChallenge,
        reward_description: null,
      };

      render(<ChallengeCard challenge={challengeWithoutReward} onClick={mockOnClick} currentUserId="user-123" />);

      expect(screen.getByText('Reward awaits!')).toBeInTheDocument();
    });

    it('should render teaser text for recipient before challenge is complete', () => {
      // Non-creator, non-complete → teaser
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} currentUserId="user-456" />);

      expect(screen.getByText('A date or activity is waiting for you…')).toBeInTheDocument();
    });
  });

  describe('Owner badge', () => {
    it('should show owner badge when showOwner is true', () => {
      render(
        <ChallengeCard
          challenge={baseChallenge}
          onClick={mockOnClick}
          showOwner
          currentUserId="user-123"
          partnerName="Alice"
        />
      );

      expect(screen.getByTestId('owner-badge')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should show partner name when challenge belongs to partner', () => {
      render(
        <ChallengeCard
          challenge={baseChallenge}
          onClick={mockOnClick}
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
        <ChallengeCard
          challenge={baseChallenge}
          onClick={mockOnClick}
          showOwner={false}
          currentUserId="user-123"
        />
      );

      expect(screen.queryByTestId('owner-badge')).not.toBeInTheDocument();
    });
  });

  describe('Progress bar', () => {
    it('should render progress bar for active challenge', () => {
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Current: 15 | Target: 30')).toBeInTheDocument();
    });

    it('should calculate progress correctly', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 20,
        target_value: 50,
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('should mark as completed when progress exceeds 100%', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 40,
        target_value: 30,
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      // Progress bar should not render when progress >= 100%
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('100%')).not.toBeInTheDocument();

      // Should have claim reward button since progress is complete
      expect(screen.getByText(/claim reward/i)).toBeInTheDocument();
    });

    it('should not render progress bar when challenge is complete', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('should not render progress bar when challenge is expired', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        status: 'expired',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('should handle zero target_value', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        target_value: 0,
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Reward icons', () => {
    it('should show message icon for message reward', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        reward_type: 'message',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('💌')).toBeInTheDocument();
    });

    it('should show activity icon for activity reward', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        reward_type: 'activity',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('should show gift icon for gift reward', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        reward_type: 'gift',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('🎁')).toBeInTheDocument();
    });

    it('should show surprise icon for surprise reward', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        reward_type: 'surprise',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('✨')).toBeInTheDocument();
    });

    it('should show activity icon and teaser when reward is hidden and challenge is incomplete', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        hide_reward: true,
        reward_type: 'activity',
      };

      // Non-creator, non-complete: recipient sees teaser + activity icon
      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} currentUserId="user-456" />);

      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('A date or activity is waiting for you…')).toBeInTheDocument();
    });

    it('should reveal reward icon when challenge is complete', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        hide_reward: true,
        reward_type: 'activity',
        current_progress: 30,
        target_value: 30,
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('Spa day together!')).toBeInTheDocument();
    });
  });

  describe('Status badges', () => {
    it('should show completed badge when challenge is completed', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('✓ Completed')).toBeInTheDocument();
    });

    it('should show expired badge when challenge is expired', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        status: 'expired',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should not show any badge for active challenge', () => {
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />);

      expect(screen.queryByText('✓ Completed')).not.toBeInTheDocument();
      expect(screen.queryByText('Expired')).not.toBeInTheDocument();
    });
  });

  describe('Claim reward button', () => {
    it('should show claim button when progress is complete', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'active',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByRole('button', { name: /Claim Reward/i })).toBeInTheDocument();
    });

    it('should not show claim button when progress is incomplete', () => {
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />);

      expect(screen.queryByRole('button', { name: /Claim Reward/i })).not.toBeInTheDocument();
    });

    it('should not show claim button when challenge is expired', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'expired',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.queryByRole('button', { name: /Claim Reward/i })).not.toBeInTheDocument();
    });

    it('should show claimed button when reward is claimed', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      const button = screen.getByRole('button', { name: /Claimed/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should call update mutation when clicking claim button', async () => {
      const mockMutate = vi.fn();
      const { useUpdateAchievementReward } = await import('../../hooks/useAchievementRewardsQuery');
      vi.mocked(useUpdateAchievementReward).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();

      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'active',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      const claimButton = screen.getByRole('button', { name: /Claim Reward/i });
      await user.click(claimButton);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'challenge-1',
        status: 'completed',
        completed_at: expect.any(String),
      });
    });

    it('should stop propagation when clicking claim button', async () => {
      const user = userEvent.setup();

      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'active',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      const claimButton = screen.getByRole('button', { name: /Claim Reward/i });
      await user.click(claimButton);

      // Card onClick should not be called
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should disable claim button when claiming is in progress', async () => {
      const { useUpdateAchievementReward } = await import('../../hooks/useAchievementRewardsQuery');
      vi.mocked(useUpdateAchievementReward).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as any);

      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'active',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      const claimButton = screen.getByRole('button', { name: /Claiming/i });
      expect(claimButton).toBeDisabled();
      expect(screen.getByText('Claiming...')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();

      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />);

      const card = screen.getByText('30 Day Workout Challenge').closest('div');
      await user.click(card!);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(
        <ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover effect class', () => {
      const { container } = render(
        <ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-md');
    });
  });

  describe('Styling', () => {
    it('should use white background for active challenge', () => {
      const { container } = render(
        <ChallengeCard challenge={baseChallenge} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.backgroundColor).toBe('rgb(255, 255, 255)');
    });

    it('should use blue background for completed challenge', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      };

      const { container } = render(
        <ChallengeCard challenge={challenge} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.backgroundColor).toBe('rgb(240, 249, 255)');
    });

    it('should use secondary background for expired challenge', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        status: 'expired',
      };

      const { container } = render(
        <ChallengeCard challenge={challenge} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.backgroundColor).toBe('rgb(245, 245, 245)');
    });

    it('should reduce opacity for expired challenge', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        status: 'expired',
      };

      const { container } = render(
        <ChallengeCard challenge={challenge} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.opacity).toBe('0.6');
    });

    it('should use blue border for completed challenge', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      };

      const { container } = render(
        <ChallengeCard challenge={challenge} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.borderColor).toBe('rgb(59, 130, 246)');
    });
  });

  describe('Reward label', () => {
    it('should show "Reward Unlocked! 🎉" when challenge is complete', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 30,
        target_value: 30,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('Reward Unlocked! 🎉')).toBeInTheDocument();
    });

    it('should show "Your reward:" for recipient when challenge is incomplete', () => {
      // Non-creator recipient sees "Your reward:" label
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} currentUserId="user-456" />);

      expect(screen.getByText('Your reward:')).toBeInTheDocument();
    });

    it('should show "Gift you\'ve prepared:" for creator when challenge is incomplete', () => {
      render(<ChallengeCard challenge={baseChallenge} onClick={mockOnClick} currentUserId="user-123" />);

      expect(screen.getByText("Gift you've prepared:")).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle challenge without connection_id', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        connection_id: null,
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('30 Day Workout Challenge')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        title: 'This is a very long challenge title that should still display properly without breaking the layout',
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(
        screen.getByText('This is a very long challenge title that should still display properly without breaking the layout')
      ).toBeInTheDocument();
    });

    it('should handle zero current_progress', () => {
      const challenge: AchievementReward = {
        ...baseChallenge,
        current_progress: 0,
      };

      render(<ChallengeCard challenge={challenge} onClick={mockOnClick} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Current: 0 | Target: 30')).toBeInTheDocument();
    });
  });
});
