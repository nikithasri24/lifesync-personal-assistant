/**
 * Unit tests for MessageRevealNotification component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageRevealNotification } from '../MessageRevealNotification';
import { useRevealMessage } from '../../hooks/usePartnerMessagesQuery';
import type { PartnerMessage } from '../../types';

// Mock dependencies
vi.mock('../../hooks/usePartnerMessagesQuery');
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
vi.mock('../../utils/dateHelpers', () => ({
  formatDateLong: vi.fn((date: string) => {
    if (date === '2024-06-15') return 'June 15, 2024';
    if (date === '2024-01-01') return 'January 1, 2024';
    return 'Today';
  }),
}));

describe('MessageRevealNotification', () => {
  const mockOnClose = vi.fn();
  const mockRevealMessage = vi.fn();

  const baseMessage: PartnerMessage = {
    id: 'message-1',
    user_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Love Letter',
    message_body: 'This is a heartfelt message\nWith multiple paragraphs\nFull of love',
    status: 'pending',
    reveal_trigger: 'first_login',
    is_sent: true,
    is_received: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(useRevealMessage).mockReturnValue({
      mutate: mockRevealMessage,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial reveal animation', () => {
    it('should show initial celebration screen', () => {
      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      expect(screen.getByText('💌 You have a message')).toBeInTheDocument();
      expect(screen.getByText('from your love')).toBeInTheDocument();
      expect(screen.getByText('Open Message ❤️')).toBeInTheDocument();
    });

    it('should animate reveal icon after 500ms', async () => {
      const { container } = render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      // Initially not bouncing
      const celebrationIcons = container.querySelectorAll('.inline-flex');
      const heartIcon = Array.from(celebrationIcons).find(el => el.className.includes('w-32'));
      expect(heartIcon?.className).not.toContain('animate-bounce');

      // After 500ms should start bouncing
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        const icons = container.querySelectorAll('.inline-flex');
        const heart = Array.from(icons).find(el => el.className.includes('w-32'));
        expect(heart?.className).toContain('animate-bounce');
      });
    });

    it('should render sparkles animation', () => {
      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      // Should have 5 sparkles
      const sparkles = document.querySelectorAll('.animate-pulse');
      expect(sparkles.length).toBeGreaterThanOrEqual(5);
    });

    it('should have celebration gradient background', () => {
      const { container } = render(
        <MessageRevealNotification message={baseMessage} onClose={mockOnClose} />
      );

      const overlay = container.firstChild as HTMLElement;
      expect(overlay.style.backgroundColor).toContain('rgba(0, 0, 0, 0.7)');
      expect(overlay.style.backdropFilter).toBe('blur(12px)');
    });
  });

  describe('Opening message', () => {
    it('should call revealMessage mutation when opening', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      const openButton = screen.getByText('Open Message ❤️');
      await user.click(openButton);

      expect(mockRevealMessage).toHaveBeenCalledWith('message-1');
    });

    it('should transition to full message view when opened', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      const openButton = screen.getByText('Open Message ❤️');
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText('Love Letter')).toBeInTheDocument();
        expect(screen.getByText('This is a heartfelt message')).toBeInTheDocument();
      });
    });
  });

  describe('Full message view', () => {
    it('should render message title and date', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        revealed_at: '2024-06-15T12:00:00Z',
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('Love Letter')).toBeInTheDocument();
        expect(screen.getByText('June 15, 2024')).toBeInTheDocument();
      });
    });

    it('should show "Today" when no revealed_at date', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        revealed_at: undefined,
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('should render message body with paragraphs', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('This is a heartfelt message')).toBeInTheDocument();
        expect(screen.getByText('With multiple paragraphs')).toBeInTheDocument();
        expect(screen.getByText('Full of love')).toBeInTheDocument();
      });
    });

    it('should render single paragraph message', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        message_body: 'Single line message',
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('Single line message')).toBeInTheDocument();
      });
    });

    it('should render photo gallery when photos exist', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        photo_urls: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('📷')).toBeInTheDocument();
        expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
        expect(screen.getByText('3 photos attached')).toBeInTheDocument();
      });
    });

    it('should show "photo" singular for single photo', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        photo_urls: ['photo1.jpg'],
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('1 photo attached')).toBeInTheDocument();
      });
    });

    it('should not render photo gallery when no photos', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        photo_urls: [],
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.queryByText('📷')).not.toBeInTheDocument();
        expect(screen.queryByText('Photo Gallery')).not.toBeInTheDocument();
      });
    });

    it('should not render photo gallery when photo_urls is undefined', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        photo_urls: undefined,
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.queryByText('Photo Gallery')).not.toBeInTheDocument();
      });
    });

    it('should render Heart icon with gradient', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        const heartContainer = screen.getByText('Love Letter').closest('div')?.querySelector('.animate-pulse');
        expect(heartContainer).toBeInTheDocument();
      });
    });

    it('should have scrollable content area', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        // Find the scrollable container, not the prose div
        const contentArea = screen.getByText('This is a heartfelt message')
          .closest('.prose')
          ?.parentElement;
        expect(contentArea?.className).toContain('overflow-y-auto');
      });
    });
  });

  describe('Closing message', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      // Open message first
      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      // Click close
      await user.click(screen.getByText('Close'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close without errors when onClose is called', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should use terracotta gradient for open button', () => {
      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      const openButton = screen.getByText('Open Message ❤️') as HTMLElement;
      expect(openButton.style.background).toContain('linear-gradient');
      expect(openButton.style.background).toContain('#D4A574');
      expect(openButton.style.background).toContain('#C18B5E');
    });

    it('should use terracotta gradient for close button', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        const closeButton = screen.getByText('Close') as HTMLElement;
        expect(closeButton.style.background).toContain('linear-gradient');
        expect(closeButton.style.background).toContain('#D4A574');
      });
    });

    it('should use pink-to-terracotta gradient for celebration icon', () => {
      const { container } = render(
        <MessageRevealNotification message={baseMessage} onClose={mockOnClose} />
      );

      const celebrationIcon = container.querySelector('.inline-flex') as HTMLElement;
      expect(celebrationIcon.style.background).toContain('linear-gradient');
      expect(celebrationIcon.style.background).toContain('#FF6B9D');
      expect(celebrationIcon.style.background).toContain('#D4A574');
    });

    it('should have max-width constraint on message modal', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        const modal = screen.getByText('Love Letter').closest('.max-w-3xl');
        expect(modal).toBeInTheDocument();
      });
    });

    it('should have warm background gradient in message view', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        const modal = screen.getByText('Love Letter').closest('div')?.parentElement as HTMLElement;
        expect(modal.style.background).toContain('linear-gradient');
        expect(modal.style.background).toContain('#FFFBF7');
        expect(modal.style.background).toContain('#FFFFFF');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very long message body', async () => {
      const user = userEvent.setup({ delay: null });
      const longBody = 'A'.repeat(5000);
      const message: PartnerMessage = {
        ...baseMessage,
        message_body: longBody,
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText(longBody)).toBeInTheDocument();
      });
    });

    it('should handle empty message body', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        message_body: '',
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('Love Letter')).toBeInTheDocument();
      });
    });

    it('should handle message with newlines only', async () => {
      const user = userEvent.setup({ delay: null });
      const message: PartnerMessage = {
        ...baseMessage,
        message_body: '\n\n\n',
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText('Love Letter')).toBeInTheDocument();
      });
    });

    it('should handle very long title', async () => {
      const user = userEvent.setup({ delay: null });
      const longTitle = 'A'.repeat(200);
      const message: PartnerMessage = {
        ...baseMessage,
        title: longTitle,
      };

      render(<MessageRevealNotification message={message} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        expect(screen.getByText(longTitle)).toBeInTheDocument();
      });
    });

    it('should cleanup timer on unmount', () => {
      const { unmount } = render(
        <MessageRevealNotification message={baseMessage} onClose={mockOnClose} />
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button type', () => {
      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      const button = screen.getByText('Open Message ❤️');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have proper button type for close', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageRevealNotification message={baseMessage} onClose={mockOnClose} />);

      await user.click(screen.getByText('Open Message ❤️'));

      await waitFor(() => {
        const closeButton = screen.getByText('Close');
        expect(closeButton.tagName).toBe('BUTTON');
        expect(closeButton.getAttribute('type')).toBe('button');
      });
    });
  });
});
