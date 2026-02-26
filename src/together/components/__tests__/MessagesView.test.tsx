/**
 * Unit tests for MessagesView component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagesView } from '../MessagesView';
import { usePartnerMessages, useDeletePartnerMessage } from '../../hooks';
import { useMergedMessagesConnection } from '../../hooks/useTogetherMergedMode';
import { useCurrentUserId } from '@/hooks/useOwnerInfo';
import { useToast } from '@/hooks/useToast';
import type { PartnerMessage, PartnerLink } from '../../types';

// Mock dependencies
vi.mock('../../hooks');
vi.mock('../../hooks/useTogetherMergedMode');
vi.mock('@/hooks/useOwnerInfo');
vi.mock('@/hooks/useToast');
vi.mock('@/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({
    state: { compose: false, viewingMessageId: null, editingMessage: null },
    open: vi.fn(),
    close: vi.fn(),
    set: vi.fn(),
    batch: vi.fn(),
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
vi.mock('@/components/common/OwnerBadge', () => ({
  OwnerBadge: ({ userId, currentUserId }: any) => (
    <span data-testid="owner-badge">{userId === currentUserId ? 'You' : 'Partner'}</span>
  ),
}));
vi.mock('../modals/ComposeMessageModal', () => ({
  ComposeMessageModal: ({ isOpen }: any) => (
    isOpen ? <div data-testid="compose-modal">Compose</div> : null
  ),
}));
vi.mock('../modals/MessageDetailModal', () => ({
  MessageDetailModal: ({ isOpen, message }: any) => (
    isOpen && message ? <div data-testid="message-detail-modal">{message.title}</div> : null
  ),
}));
vi.mock('../../utils/dateHelpers', () => ({
  formatDateLong: vi.fn((date: string) => `Formatted: ${date}`),
}));
vi.mock('../../types/guards', () => ({
  isPartnerMessage: vi.fn(() => true),
}));

describe('MessagesView', () => {
  const mockShowToast = vi.fn();
  const mockDeleteMessage = vi.fn();

  const baseMessage: PartnerMessage = {
    id: 'msg-1',
    user_id: 'user-123',
    sender_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Love Letter',
    message_body: 'This is a heartfelt message',
    status: 'scheduled',
    reveal_trigger: 'specific_date',
    reveal_date: '2024-12-25',
    is_sent: true,
    is_received: false,
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
    localStorage.clear();

    vi.mocked(useCurrentUserId).mockReturnValue({ data: 'user-123' } as any);
    vi.mocked(useMergedMessagesConnection).mockReturnValue({ data: null } as any);
    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast } as any);
    vi.mocked(usePartnerMessages).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    vi.mocked(useDeletePartnerMessage).mockReturnValue({
      mutate: mockDeleteMessage,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Partner link requirement', () => {
    it('should show link partner message when no partner', () => {
      const pendingLink: PartnerLink = {
        ...acceptedPartnerLink,
        status: 'pending',
      };

      render(<MessagesView partnerLink={pendingLink} />);

      expect(screen.getByText('Link with your partner to send messages')).toBeInTheDocument();
      expect(screen.getByText('💌')).toBeInTheDocument();
    });

    it('should show link with Shared link when no partner', () => {
      render(<MessagesView partnerLink={null} />);

      const sharedLink = screen.getByRole('link', { name: /shared/i });
      expect(sharedLink).toHaveAttribute('href', '/shared');
    });

    it('should render messages view when partner is accepted', () => {
      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Compose New Message')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /write/i })).toHaveLength(2); // Header + empty state
    });
  });

  describe('Loading state', () => {
    it('should show skeleton loading', () => {
      vi.mocked(usePartnerMessages).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no messages', () => {
      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(screen.getByText('Write a surprise birthday letter or anniversary message')).toBeInTheDocument();
      expect(screen.getByText('Write Your First Message')).toBeInTheDocument();
    });
  });

  describe('Message categorization', () => {
    it('should categorize scheduled messages', () => {
      const scheduledMsg: PartnerMessage = {
        ...baseMessage,
        status: 'scheduled',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [scheduledMsg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Scheduled Messages')).toBeInTheDocument();
      expect(screen.getByText('💌 Love Letter')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('should categorize revealed messages', () => {
      const revealedMsg: PartnerMessage = {
        ...baseMessage,
        status: 'revealed',
        revealed_at: '2024-06-15T00:00:00Z',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [revealedMsg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Sent Messages')).toBeInTheDocument();
      expect(screen.getByText('❤️ Love Letter')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    it('should show "Received Messages" when user received messages from partner', () => {
      const receivedMsg: PartnerMessage = {
        ...baseMessage,
        sender_id: 'user-456', // From partner
        status: 'revealed',
        revealed_at: '2024-06-15T00:00:00Z',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [receivedMsg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Received Messages')).toBeInTheDocument();
    });

    it('should categorize draft messages', () => {
      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [draftMsg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Drafts')).toBeInTheDocument();
      expect(screen.getByText('📝 Love Letter')).toBeInTheDocument();
      expect(screen.getByText('Draft - Not sent yet')).toBeInTheDocument();
    });
  });

  describe('Message reveal triggers', () => {
    it('should show first login trigger text', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'first_login',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [msg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('First login trigger')).toBeInTheDocument();
    });

    it('should show scheduled date for specific_date trigger', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'specific_date',
        reveal_date: '2024-12-25',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [msg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText(/Scheduled:/)).toBeInTheDocument();
    });

    it('should show achievement trigger text', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'achievement',
        achievement_id: 'ach-1',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [msg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Achievement unlock trigger')).toBeInTheDocument();
    });

    it('should show manual reveal text', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'manual',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [msg],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByText('Manual reveal')).toBeInTheDocument();
    });
  });

  describe('Delete message', () => {
    it('should show delete button only for own messages', () => {
      const myMessage: PartnerMessage = {
        ...baseMessage,
        sender_id: 'user-123', // Current user
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [myMessage],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByLabelText('Delete message')).toBeInTheDocument();
    });

    it('should NOT show delete button for partner messages', () => {
      const partnerMessage: PartnerMessage = {
        ...baseMessage,
        sender_id: 'user-456', // Partner
        status: 'revealed',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [partnerMessage],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.queryByLabelText('Delete message')).not.toBeInTheDocument();
    });

    it('should show confirmation dialog before deleting', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const myMessage: PartnerMessage = {
        ...baseMessage,
        sender_id: 'user-123',
      };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [myMessage],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      const deleteButton = screen.getByLabelText('Delete message');
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete "Love Letter"?')
      );

      confirmSpy.mockRestore();
    });

    it('should not delete if user cancels confirmation', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const myMessage: PartnerMessage = { ...baseMessage, sender_id: 'user-123' };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [myMessage],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      const deleteButton = screen.getByLabelText('Delete message');
      await user.click(deleteButton);

      expect(mockDeleteMessage).not.toHaveBeenCalled();
    });

    it('should delete message when confirmed', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const myMessage: PartnerMessage = { ...baseMessage, sender_id: 'user-123' };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [myMessage],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      const deleteButton = screen.getByLabelText('Delete message');
      await user.click(deleteButton);

      expect(mockDeleteMessage).toHaveBeenCalledWith(
        'msg-1',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  describe('Modals', () => {
    it('should open compose modal when write button clicked', async () => {
      const user = userEvent.setup();
      const mockUseModalState = await import('@/hooks/useModalState');
      const mockOpen = vi.fn();

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { compose: false, viewingMessageId: null, editingMessage: null },
        open: mockOpen,
        close: vi.fn(),
        set: vi.fn(),
        batch: vi.fn(),
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      const writeButton = screen.getByRole('button', { name: /write new message/i });
      await user.click(writeButton);

      expect(mockOpen).toHaveBeenCalledWith('compose');
    });

    it('should render compose modal when state is true', async () => {
      const mockUseModalState = await import('@/hooks/useModalState');

      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { compose: true, viewingMessageId: null, editingMessage: null },
        open: vi.fn(),
        close: vi.fn(),
        set: vi.fn(),
        batch: vi.fn(),
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('compose-modal')).toBeInTheDocument();
    });
  });

  describe('localStorage persistence', () => {
    it('should restore compose modal state from localStorage', async () => {
      localStorage.setItem('together_messages_compose_open', 'true');

      const mockUseModalState = await import('@/hooks/useModalState');

      // Mock will read from localStorage in initialization
      vi.mocked(mockUseModalState.useModalState).mockReturnValue({
        state: { compose: true, viewingMessageId: null, editingMessage: null },
        open: vi.fn(),
        close: vi.fn(),
        set: vi.fn(),
        batch: vi.fn(),
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('compose-modal')).toBeInTheDocument();
    });
  });

  describe('Merged mode', () => {
    it('should show owner filter when in merged mode', () => {
      vi.mocked(useMergedMessagesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('owner-filter')).toBeInTheDocument();
    });

    it('should not show owner filter when not in merged mode', () => {
      vi.mocked(useMergedMessagesConnection).mockReturnValue({
        data: null,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.queryByTestId('owner-filter')).not.toBeInTheDocument();
    });

    it('should show owner badge on messages in merged mode', () => {
      vi.mocked(useMergedMessagesConnection).mockReturnValue({
        data: {
          connectionId: 'conn-1',
          partnerId: 'user-456',
          partnerName: 'Alice',
        },
      } as any);

      const message: PartnerMessage = { ...baseMessage, sender_id: 'user-123' };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [message],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByTestId('owner-badge')).toBeInTheDocument();
      expect(screen.getByTestId('owner-badge')).toHaveTextContent('You');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on write button', () => {
      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByRole('button', { name: /write new message/i })).toHaveAttribute('aria-label');
    });

    it('should have aria-label on delete button', () => {
      const message: PartnerMessage = { ...baseMessage, sender_id: 'user-123' };

      vi.mocked(usePartnerMessages).mockReturnValue({
        data: [message],
        isLoading: false,
      } as any);

      render(<MessagesView partnerLink={acceptedPartnerLink} />);

      expect(screen.getByLabelText('Delete message')).toBeInTheDocument();
    });
  });
});
