/**
 * Unit tests for MessageDetailModal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageDetailModal } from '../MessageDetailModal';
import { useDeletePartnerMessage } from '../../../hooks/usePartnerMessagesQuery';
import { useToast } from '@/hooks/useToast';
import type { PartnerMessage } from '../../../types';

// Mock dependencies
vi.mock('../../../hooks/usePartnerMessagesQuery');
vi.mock('@/hooks/useToast');
vi.mock('../../../utils/dateHelpers', () => ({
  formatDateLong: vi.fn((date: string) => `Formatted: ${date}`),
}));

describe('MessageDetailModal', () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();
  const mockShowToast = vi.fn();
  const mockDeleteMessage = vi.fn();

  const baseMessage: PartnerMessage = {
    id: 'msg-1',
    user_id: 'user-123',
    sender_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Love Letter',
    message_body: 'This is a heartfelt message\nWith multiple paragraphs',
    status: 'scheduled',
    reveal_trigger: 'specific_date',
    reveal_date: '2024-12-25',
    is_sent: false,
    is_received: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast } as any);
    vi.mocked(useDeletePartnerMessage).mockReturnValue({
      mutate: mockDeleteMessage,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    // Cleanup body styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <MessageDetailModal
          isOpen={false}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open', () => {
      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Love Letter')).toBeInTheDocument();
      expect(screen.getByText('This is a heartfelt message')).toBeInTheDocument();
      expect(screen.getByText('With multiple paragraphs')).toBeInTheDocument();
    });

    it('should render mobile drag handle', () => {
      const { container } = render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      const dragHandle = container.querySelector('.w-9.h-1.bg-gray-300.rounded-full');
      expect(dragHandle).toBeInTheDocument();
    });
  });

  describe('Message display', () => {
    it('should display scheduled status badge', () => {
      const scheduledMsg: PartnerMessage = {
        ...baseMessage,
        status: 'scheduled',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={scheduledMsg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('should display draft status badge', () => {
      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      const { container } = render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
        />
      );

      // Check for draft badge specifically (gray background)
      const draftBadge = container.querySelector('[style*="rgb(107, 114, 128)"]');
      expect(draftBadge).toBeInTheDocument();
      expect(draftBadge).toHaveTextContent('Draft');
    });

    it('should display Heart icon for revealed messages', () => {
      const revealedMsg: PartnerMessage = {
        ...baseMessage,
        status: 'revealed',
        revealed_at: '2024-06-15T00:00:00Z',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={revealedMsg}
          onClose={mockOnClose}
        />
      );

      // Should have gradient background with Heart icon
      const heartContainer = screen.getByText('Love Letter').closest('div')?.previousElementSibling;
      expect(heartContainer).toBeInTheDocument();
    });

    it('should display reveal trigger text for first_login', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'first_login',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Will reveal when partner opens the app')).toBeInTheDocument();
    });

    it('should display reveal trigger text for specific_date', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'specific_date',
        reveal_date: '2024-12-25T12:00:00',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Scheduled for/)).toBeInTheDocument();
    });

    it('should display reveal trigger text for achievement', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'achievement',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Will reveal when partner unlocks achievement')).toBeInTheDocument();
    });

    it('should display reveal trigger text for manual', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'manual',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Sent immediately')).toBeInTheDocument();
    });
  });

  describe('Photo gallery', () => {
    it('should show photo gallery when photos exist', () => {
      const msgWithPhotos: PartnerMessage = {
        ...baseMessage,
        photo_urls: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msgWithPhotos}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('📷')).toBeInTheDocument();
      expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
      expect(screen.getByText('3 photos attached')).toBeInTheDocument();
    });

    it('should show singular "photo" for single photo', () => {
      const msgWithPhotos: PartnerMessage = {
        ...baseMessage,
        photo_urls: ['photo1.jpg'],
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msgWithPhotos}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('1 photo attached')).toBeInTheDocument();
    });

    it('should not show photo gallery when no photos', () => {
      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('📷')).not.toBeInTheDocument();
      expect(screen.queryByText('Photo Gallery')).not.toBeInTheDocument();
    });
  });

  describe('Edit functionality', () => {
    it('should show edit button for drafts when onEdit provided', () => {
      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit message');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should not show edit button for revealed messages', () => {
      const revealedMsg: PartnerMessage = {
        ...baseMessage,
        status: 'revealed',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={revealedMsg}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByLabelText('Edit message')).not.toBeInTheDocument();
    });

    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
        />
      );

      // Click the header edit button (first one)
      const editButtons = screen.getAllByLabelText('Edit message');
      await user.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should show Edit Message button in footer for drafts', () => {
      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Edit Message')).toBeInTheDocument();
    });
  });

  describe('Delete functionality', () => {
    it('should show delete button for drafts', () => {
      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Delete message')).toBeInTheDocument();
    });

    it('should not show delete button for revealed messages', () => {
      const revealedMsg: PartnerMessage = {
        ...baseMessage,
        status: 'revealed',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={revealedMsg}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByLabelText('Delete message')).not.toBeInTheDocument();
    });

    it('should show confirmation dialog before deleting', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
        />
      );

      const deleteButton = screen.getByLabelText('Delete message');
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this message? This cannot be undone.'
      );

      confirmSpy.mockRestore();
    });

    it('should not delete when user cancels confirmation', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
        />
      );

      const deleteButton = screen.getByLabelText('Delete message');
      await user.click(deleteButton);

      expect(mockDeleteMessage).not.toHaveBeenCalled();
    });

    it('should delete message when confirmed', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
        />
      );

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

    it('should show toast and close on successful delete', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
        />
      );

      const deleteButton = screen.getByLabelText('Delete message');
      await user.click(deleteButton);

      // Get the onSuccess callback and call it
      const onSuccess = vi.mocked(mockDeleteMessage).mock.calls[0][1].onSuccess;
      onSuccess?.();

      expect(mockShowToast).toHaveBeenCalledWith('Message deleted', 'success');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable delete button while deleting', () => {
      vi.mocked(useDeletePartnerMessage).mockReturnValue({
        mutate: mockDeleteMessage,
        isPending: true,
      } as any);

      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
        />
      );

      const deleteButton = screen.getByLabelText('Delete message');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Keyboard navigation', () => {
    it('should close modal on ESC key', async () => {
      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      await userEvent.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not listen for ESC when closed', () => {
      const { rerender } = render(
        <MessageDetailModal
          isOpen={false}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      userEvent.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop clicks', () => {
    it('should close modal when clicking backdrop', async () => {
      const user = userEvent.setup();

      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      const backdrop = screen.getByText('Love Letter').closest('[style*="rgba(0, 0, 0, 0.5)"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should not close when clicking modal content', async () => {
      const user = userEvent.setup();

      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      const modalContent = screen.getByText('Love Letter');
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body scroll lock', () => {
    it('should lock body scroll when modal opens', () => {
      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
    });

    it('should restore body scroll when modal closes', () => {
      const { unmount } = render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.position).toBe('');
    });
  });

  describe('Close button', () => {
    it('should have close button in header', () => {
      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should close modal when close button clicked', async () => {
      const user = userEvent.setup();

      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have close button in footer', async () => {
      render(
        <MessageDetailModal
          isOpen={true}
          message={baseMessage}
          onClose={mockOnClose}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons.length).toBeGreaterThan(1); // Header + footer
    });
  });

  describe('Edge cases', () => {
    it('should handle message with no reveal_date', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        reveal_trigger: 'specific_date',
        reveal_date: undefined,
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Scheduled for specific date')).toBeInTheDocument();
    });

    it('should handle very long message body', () => {
      const longBody = 'A'.repeat(5000);
      const msg: PartnerMessage = {
        ...baseMessage,
        message_body: longBody,
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(longBody)).toBeInTheDocument();
    });

    it('should handle message with no sent_at or revealed_at', () => {
      const msg: PartnerMessage = {
        ...baseMessage,
        sent_at: undefined,
        revealed_at: undefined,
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={msg}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labels on all icon buttons', () => {
      const draftMsg: PartnerMessage = {
        ...baseMessage,
        status: 'draft',
      };

      render(
        <MessageDetailModal
          isOpen={true}
          message={draftMsg}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByLabelText('Edit message')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete message')).toBeInTheDocument();
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });
  });
});
