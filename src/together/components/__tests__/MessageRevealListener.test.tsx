/**
 * Unit tests for MessageRevealListener component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageRevealListener } from '../MessageRevealListener';
import { usePendingMessageReveals } from '../../hooks/usePartnerMessagesQuery';
import { useAchievementRewards } from '../../hooks/useAchievementRewardsQuery';
import type { PartnerMessage, AchievementReward } from '../../types';

// Mock dependencies
vi.mock('../../hooks/usePartnerMessagesQuery');
vi.mock('../../hooks/useAchievementRewardsQuery');
vi.mock('@/services/logger');

// Mock MessageRevealNotification component
vi.mock('../MessageRevealNotification', () => ({
  MessageRevealNotification: ({ message, onClose }: any) => (
    <div data-testid="message-reveal-notification">
      <div data-testid="message-id">{message.id}</div>
      <div data-testid="message-title">{message.title}</div>
      <button onClick={onClose} data-testid="close-notification">
        Close
      </button>
    </div>
  ),
}));

describe('MessageRevealListener', () => {
  const mockMessage: PartnerMessage = {
    id: 'message-1',
    user_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Test Message',
    message_body: 'Test body',
    status: 'pending',
    reveal_trigger: 'first_login',
    is_sent: true,
    is_received: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2024-06-15T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('No pending messages', () => {
    it('should render nothing when no pending messages', () => {
      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when pending messages is undefined', () => {
      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: undefined,
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: undefined,
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('First login trigger', () => {
    it('should reveal message with first_login trigger immediately', async () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'first_login',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      render(<MessageRevealListener />);

      await waitFor(() => {
        expect(screen.getByTestId('message-reveal-notification')).toBeInTheDocument();
      });

      expect(screen.getByTestId('message-id')).toHaveTextContent('message-1');
      expect(screen.getByTestId('message-title')).toHaveTextContent('Test Message');
    });

    it('should reveal multiple first_login messages one at a time', async () => {
      const user = userEvent.setup({ delay: null });
      const message1: PartnerMessage = {
        ...mockMessage,
        id: 'message-1',
        title: 'First Message',
        reveal_trigger: 'first_login',
      };

      const message2: PartnerMessage = {
        ...mockMessage,
        id: 'message-2',
        title: 'Second Message',
        reveal_trigger: 'first_login',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message1, message2],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { rerender } = render(<MessageRevealListener />);

      // Should show first message
      await waitFor(() => {
        expect(screen.getByTestId('message-id')).toHaveTextContent('message-1');
      });

      // Close first message
      const closeButton = screen.getByTestId('close-notification');
      await user.click(closeButton);

      // Should show second message
      await waitFor(() => {
        expect(screen.getByTestId('message-id')).toHaveTextContent('message-2');
      });
    });
  });

  describe('Specific date trigger', () => {
    it('should reveal message when reveal_date has passed', async () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'specific_date',
        reveal_date: '2024-06-14T10:00:00', // Past date
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      render(<MessageRevealListener />);

      await waitFor(() => {
        expect(screen.getByTestId('message-reveal-notification')).toBeInTheDocument();
      });
    });

    it('should NOT reveal message when reveal_date is in the future', () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'specific_date',
        reveal_date: '2024-06-20T10:00:00', // Future date
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });

    it('should NOT reveal message when reveal_date is missing', () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'specific_date',
        reveal_date: undefined,
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });

    it('should reveal message scheduled for exact current time', async () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'specific_date',
        reveal_date: '2024-06-15T10:00:00', // Exact current time
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      render(<MessageRevealListener />);

      await waitFor(() => {
        expect(screen.getByTestId('message-reveal-notification')).toBeInTheDocument();
      });
    });
  });

  describe('Achievement trigger', () => {
    it('should reveal message when linked achievement is completed', async () => {
      const achievement: AchievementReward = {
        id: 'achievement-1',
        user_id: 'user-123',
        connection_id: 'conn-1',
        title: 'Test Achievement',
        description: 'Test description',
        challenge_type: 'habit',
        target_count: 10,
        current_progress: 10,
        status: 'completed',
        reward_type: 'message',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'achievement',
        achievement_id: 'achievement-1',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [achievement],
      } as any);

      render(<MessageRevealListener />);

      await waitFor(() => {
        expect(screen.getByTestId('message-reveal-notification')).toBeInTheDocument();
      });
    });

    it('should NOT reveal message when linked achievement is not completed', () => {
      const achievement: AchievementReward = {
        id: 'achievement-1',
        user_id: 'user-123',
        connection_id: 'conn-1',
        title: 'Test Achievement',
        description: 'Test description',
        challenge_type: 'habit',
        target_count: 10,
        current_progress: 5,
        status: 'active',
        reward_type: 'message',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'achievement',
        achievement_id: 'achievement-1',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [achievement],
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });

    it('should NOT reveal message when achievement_id is missing', () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'achievement',
        achievement_id: undefined,
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });

    it('should NOT reveal message when linked achievement not found', () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'achievement',
        achievement_id: 'non-existent-achievement',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Manual trigger', () => {
    it('should NOT auto-reveal message with manual trigger', () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'manual',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { container } = render(<MessageRevealListener />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Queue management', () => {
    it('should process reveal queue in order', async () => {
      const user = userEvent.setup({ delay: null });
      const message1: PartnerMessage = {
        ...mockMessage,
        id: 'message-1',
        title: 'First',
        reveal_trigger: 'first_login',
      };

      const message2: PartnerMessage = {
        ...mockMessage,
        id: 'message-2',
        title: 'Second',
        reveal_trigger: 'first_login',
      };

      const message3: PartnerMessage = {
        ...mockMessage,
        id: 'message-3',
        title: 'Third',
        reveal_trigger: 'first_login',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message1, message2, message3],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      render(<MessageRevealListener />);

      // First message
      await waitFor(() => {
        expect(screen.getByTestId('message-title')).toHaveTextContent('First');
      });

      // Close first
      await user.click(screen.getByTestId('close-notification'));

      // Second message
      await waitFor(() => {
        expect(screen.getByTestId('message-title')).toHaveTextContent('Second');
      });

      // Close second
      await user.click(screen.getByTestId('close-notification'));

      // Third message
      await waitFor(() => {
        expect(screen.getByTestId('message-title')).toHaveTextContent('Third');
      });

      // Close third - should render nothing
      await user.click(screen.getByTestId('close-notification'));

      await waitFor(() => {
        expect(screen.queryByTestId('message-reveal-notification')).not.toBeInTheDocument();
      });
    });

    it('should clear queue when all messages are closed', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'first_login',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      render(<MessageRevealListener />);

      await waitFor(() => {
        expect(screen.getByTestId('message-reveal-notification')).toBeInTheDocument();
      });

      // Close message
      await user.click(screen.getByTestId('close-notification'));

      await waitFor(() => {
        expect(screen.queryByTestId('message-reveal-notification')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mixed triggers', () => {
    it('should reveal messages with different triggers correctly', async () => {
      const user = userEvent.setup({ delay: null });
      const achievement: AchievementReward = {
        id: 'achievement-1',
        user_id: 'user-123',
        connection_id: 'conn-1',
        title: 'Test Achievement',
        description: 'Test description',
        challenge_type: 'habit',
        target_count: 10,
        current_progress: 10,
        status: 'completed',
        reward_type: 'message',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const messages: PartnerMessage[] = [
        { ...mockMessage, id: 'm1', reveal_trigger: 'first_login' },
        { ...mockMessage, id: 'm2', reveal_trigger: 'specific_date', reveal_date: '2024-06-14T10:00:00' },
        { ...mockMessage, id: 'm3', reveal_trigger: 'achievement', achievement_id: 'achievement-1' },
        { ...mockMessage, id: 'm4', reveal_trigger: 'manual' }, // Should NOT reveal
        { ...mockMessage, id: 'm5', reveal_trigger: 'specific_date', reveal_date: '2024-06-20T10:00:00' }, // Future - should NOT reveal
      ];

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: messages,
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [achievement],
      } as any);

      render(<MessageRevealListener />);

      // Should reveal first message (first_login)
      await waitFor(() => {
        expect(screen.getByTestId('message-id')).toHaveTextContent('m1');
      });

      // Close and check second message (specific_date - past)
      await user.click(screen.getByTestId('close-notification'));
      await waitFor(() => {
        expect(screen.getByTestId('message-id')).toHaveTextContent('m2');
      });

      // Close and check third message (achievement - completed)
      await user.click(screen.getByTestId('close-notification'));
      await waitFor(() => {
        expect(screen.getByTestId('message-id')).toHaveTextContent('m3');
      });

      // Close third - should render nothing (m4 and m5 don't meet criteria)
      await user.click(screen.getByTestId('close-notification'));
      await waitFor(() => {
        expect(screen.queryByTestId('message-reveal-notification')).not.toBeInTheDocument();
      });
    });
  });

  describe('Re-render behavior', () => {
    it('should update when pending messages change', async () => {
      const message1: PartnerMessage = {
        ...mockMessage,
        id: 'message-1',
        reveal_trigger: 'first_login',
      };

      // Initially no messages
      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [],
      } as any);

      const { rerender } = render(<MessageRevealListener />);

      expect(screen.queryByTestId('message-reveal-notification')).not.toBeInTheDocument();

      // Add pending message
      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message1],
      } as any);

      rerender(<MessageRevealListener />);

      await waitFor(() => {
        expect(screen.getByTestId('message-reveal-notification')).toBeInTheDocument();
      });
    });

    it('should update when achievements change', async () => {
      const message: PartnerMessage = {
        ...mockMessage,
        reveal_trigger: 'achievement',
        achievement_id: 'achievement-1',
      };

      const achievement: AchievementReward = {
        id: 'achievement-1',
        user_id: 'user-123',
        connection_id: 'conn-1',
        title: 'Test Achievement',
        description: 'Test description',
        challenge_type: 'habit',
        target_count: 10,
        current_progress: 5,
        status: 'active',
        reward_type: 'message',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(usePendingMessageReveals).mockReturnValue({
        data: [message],
      } as any);
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [achievement],
      } as any);

      const { rerender } = render(<MessageRevealListener />);

      // Achievement not completed - should not reveal
      expect(screen.queryByTestId('message-reveal-notification')).not.toBeInTheDocument();

      // Complete achievement
      const completedAchievement = { ...achievement, status: 'completed' as const };
      vi.mocked(useAchievementRewards).mockReturnValue({
        data: [completedAchievement],
      } as any);

      rerender(<MessageRevealListener />);

      // Should now reveal
      await waitFor(() => {
        expect(screen.getByTestId('message-reveal-notification')).toBeInTheDocument();
      });
    });
  });
});
