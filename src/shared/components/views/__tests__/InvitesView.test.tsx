/**
 * Unit tests for InvitesView component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitesView } from '../InvitesView';
import type { Invitation } from '../../../types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('../../InvitationCard', () => ({
  InvitationCard: ({ invitation, onAccept, onDecline, onCancel }: any) => (
    <div data-testid={`invitation-card-${invitation.id}`}>
      <div data-testid="from-name">{invitation.from_name}</div>
      <div data-testid="direction">{invitation.direction}</div>
      {invitation.direction === 'received' && (
        <>
          <button onClick={() => onAccept(invitation.id)} data-testid="accept-btn">
            Accept
          </button>
          <button onClick={() => onDecline(invitation.id)} data-testid="decline-btn">
            Decline
          </button>
        </>
      )}
      {invitation.direction === 'sent' && (
        <button onClick={() => onCancel(invitation.id)} data-testid="cancel-btn">
          Cancel
        </button>
      )}
    </div>
  ),
}));

describe('InvitesView', () => {
  const mockOnAccept = vi.fn();
  const mockOnDecline = vi.fn();
  const mockOnCancel = vi.fn();

  const baseInvitation: Invitation = {
    id: 'inv-1',
    from_user_id: 'user-123',
    from_name: 'Alice Smith',
    from_email: 'alice@example.com',
    to_user_id: 'user-456',
    to_email: 'bob@example.com',
    relationship: 'spouse',
    message: 'Join me on LifeSync!',
    permissions: [
      { module: 'meals', permission: 'collaborate' },
      { module: 'shopping', permission: 'view' },
    ],
    status: 'pending',
    direction: 'received',
    created_at: '2024-01-01',
    expires_at: '2024-02-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading message', () => {
      render(
        <InvitesView
          invitations={[]}
          isLoading={true}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Loading invitations...')).toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      render(
        <InvitesView
          invitations={[]}
          isLoading={true}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('No pending invitations')).not.toBeInTheDocument();
    });

    it('should not show invitations when loading', () => {
      render(
        <InvitesView
          invitations={[baseInvitation]}
          isLoading={true}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByTestId('invitation-card-inv-1')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no invitations', () => {
      render(
        <InvitesView
          invitations={[]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('No pending invitations')).toBeInTheDocument();
      expect(screen.getByText(/Invite a partner or check back later/)).toBeInTheDocument();
    });

    it('should show emoji in empty state', () => {
      render(
        <InvitesView
          invitations={[]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('✉️')).toBeInTheDocument();
    });
  });

  describe('Invitations display', () => {
    it('should render single received invitation', () => {
      render(
        <InvitesView
          invitations={[baseInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Partner Invitations')).toBeInTheDocument();
      expect(screen.getByTestId('invitation-card-inv-1')).toBeInTheDocument();
      expect(screen.getByTestId('from-name')).toHaveTextContent('Alice Smith');
      expect(screen.getByTestId('direction')).toHaveTextContent('received');
    });

    it('should render single sent invitation', () => {
      const sentInvitation: Invitation = {
        ...baseInvitation,
        direction: 'sent',
      };

      render(
        <InvitesView
          invitations={[sentInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('invitation-card-inv-1')).toBeInTheDocument();
      expect(screen.getByTestId('direction')).toHaveTextContent('sent');
    });

    it('should render multiple invitations', () => {
      const invitations: Invitation[] = [
        { ...baseInvitation, id: 'inv-1', from_name: 'Alice', direction: 'received' },
        { ...baseInvitation, id: 'inv-2', from_name: 'Bob', direction: 'sent' },
        { ...baseInvitation, id: 'inv-3', from_name: 'Carol', direction: 'received' },
      ];

      render(
        <InvitesView
          invitations={invitations}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('invitation-card-inv-1')).toBeInTheDocument();
      expect(screen.getByTestId('invitation-card-inv-2')).toBeInTheDocument();
      expect(screen.getByTestId('invitation-card-inv-3')).toBeInTheDocument();
    });

    it('should show header when invitations exist', () => {
      render(
        <InvitesView
          invitations={[baseInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Partner Invitations')).toBeInTheDocument();
    });
  });

  describe('Invitation actions', () => {
    it('should call onAccept when accept button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <InvitesView
          invitations={[baseInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      const acceptBtn = screen.getByTestId('accept-btn');
      await user.click(acceptBtn);

      expect(mockOnAccept).toHaveBeenCalledWith('inv-1');
      expect(mockOnAccept).toHaveBeenCalledTimes(1);
    });

    it('should call onDecline when decline button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <InvitesView
          invitations={[baseInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      const declineBtn = screen.getByTestId('decline-btn');
      await user.click(declineBtn);

      expect(mockOnDecline).toHaveBeenCalledWith('inv-1');
      expect(mockOnDecline).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel for sent invitations', async () => {
      const user = userEvent.setup();
      const sentInvitation: Invitation = {
        ...baseInvitation,
        direction: 'sent',
      };

      render(
        <InvitesView
          invitations={[sentInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      const cancelBtn = screen.getByTestId('cancel-btn');
      await user.click(cancelBtn);

      expect(mockOnCancel).toHaveBeenCalledWith('inv-1');
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel for received invitations', async () => {
      render(
        <InvitesView
          invitations={[baseInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByTestId('cancel-btn')).not.toBeInTheDocument();
    });
  });

  describe('Invitation properties', () => {
    it('should render invitation with message', () => {
      const invitation = { ...baseInvitation, message: 'Join me!' };

      render(
        <InvitesView
          invitations={[invitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('invitation-card-inv-1')).toBeInTheDocument();
    });

    it('should render invitation without message', () => {
      const invitation = { ...baseInvitation, message: null };

      render(
        <InvitesView
          invitations={[invitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('invitation-card-inv-1')).toBeInTheDocument();
    });

    it('should render invitation with different relationships', () => {
      const relationships = ['spouse', 'partner', 'friend', 'family'] as const;

      relationships.forEach((relationship) => {
        const invitation = { ...baseInvitation, id: `inv-${relationship}`, relationship };

        const { unmount } = render(
          <InvitesView
            invitations={[invitation]}
            isLoading={false}
            onAccept={mockOnAccept}
            onDecline={mockOnDecline}
            onCancel={mockOnCancel}
          />
        );

        expect(screen.getByTestId(`invitation-card-inv-${relationship}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should render invitation with no permissions', () => {
      const invitation = { ...baseInvitation, permissions: [] };

      render(
        <InvitesView
          invitations={[invitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('invitation-card-inv-1')).toBeInTheDocument();
    });

    it('should render invitation with many permissions', () => {
      const invitation = {
        ...baseInvitation,
        permissions: [
          { module: 'meals' as const, permission: 'collaborate' as const },
          { module: 'shopping' as const, permission: 'view' as const },
          { module: 'todos' as const, permission: 'collaborate' as const },
          { module: 'goals' as const, permission: 'view' as const },
          { module: 'habits' as const, permission: 'merged' as const },
        ],
      };

      render(
        <InvitesView
          invitations={[invitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('invitation-card-inv-1')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle invitation with long sender name', () => {
      const invitation = {
        ...baseInvitation,
        from_name: 'Alexander Maximilian Christopher Wellington III',
      };

      render(
        <InvitesView
          invitations={[invitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('from-name')).toHaveTextContent(
        'Alexander Maximilian Christopher Wellington III'
      );
    });

    it('should handle invitation with special characters in name', () => {
      const invitation = {
        ...baseInvitation,
        from_name: "O'Brien-Smith",
      };

      render(
        <InvitesView
          invitations={[invitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('from-name')).toHaveTextContent("O'Brien-Smith");
    });

    it('should handle mixed received and sent invitations', () => {
      const invitations: Invitation[] = [
        { ...baseInvitation, id: 'inv-1', direction: 'received' },
        { ...baseInvitation, id: 'inv-2', direction: 'sent' },
        { ...baseInvitation, id: 'inv-3', direction: 'received' },
      ];

      render(
        <InvitesView
          invitations={invitations}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getAllByTestId(/^invitation-card-/)).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <InvitesView
          invitations={[baseInvitation]}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      const heading = screen.getByRole('heading', { name: 'Partner Invitations' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should render invitation cards in order', () => {
      const invitations: Invitation[] = [
        { ...baseInvitation, id: 'inv-1', from_name: 'Alice' },
        { ...baseInvitation, id: 'inv-2', from_name: 'Bob' },
      ];

      const { container } = render(
        <InvitesView
          invitations={invitations}
          isLoading={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onCancel={mockOnCancel}
        />
      );

      const cards = container.querySelectorAll('[data-testid^="invitation-card-"]');
      expect(cards[0]).toHaveAttribute('data-testid', 'invitation-card-inv-1');
      expect(cards[1]).toHaveAttribute('data-testid', 'invitation-card-inv-2');
    });
  });
});
