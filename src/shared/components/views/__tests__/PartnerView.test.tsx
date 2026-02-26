/**
 * Unit tests for PartnerView component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartnerView } from '../PartnerView';
import type { PartnerConnection } from '../../../types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('../../ConnectionCard', () => ({
  ConnectionCard: ({ connection }: { connection: PartnerConnection }) => (
    <div data-testid={`connection-card-${connection.id}`}>
      <div data-testid="partner-name">{connection.partner_name}</div>
      <div data-testid="relationship">{connection.relationship}</div>
    </div>
  ),
}));

describe('PartnerView', () => {
  const baseConnection: PartnerConnection = {
    id: 'conn-1',
    partner_id: 'partner-123',
    partner_name: 'Alice Smith',
    partner_email: 'alice@example.com',
    relationship: 'spouse',
    permissions: [
      { module: 'meals', permission: 'collaborate' },
      { module: 'shopping', permission: 'view' },
    ],
    connected_at: '2024-01-01',
    status: 'active',
  };

  describe('Loading state', () => {
    it('should show loading message', () => {
      render(<PartnerView connections={[]} isLoading={true} />);

      expect(screen.getByText('Loading connections...')).toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      render(<PartnerView connections={[]} isLoading={true} />);

      expect(screen.queryByText('No partner connected')).not.toBeInTheDocument();
    });

    it('should not show connections when loading', () => {
      render(<PartnerView connections={[baseConnection]} isLoading={true} />);

      expect(screen.queryByTestId('connection-card-conn-1')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no connections', () => {
      render(<PartnerView connections={[]} isLoading={false} />);

      expect(screen.getByText('No partner connected')).toBeInTheDocument();
      expect(screen.getByText(/Invite your spouse or partner/)).toBeInTheDocument();
    });

    it('should show emoji in empty state', () => {
      render(<PartnerView connections={[]} isLoading={false} />);

      expect(screen.getByText('💑')).toBeInTheDocument();
    });

    it('should show descriptive text in empty state', () => {
      render(<PartnerView connections={[]} isLoading={false} />);

      expect(
        screen.getByText(/Invite your spouse or partner to share meal plans, shopping lists/)
      ).toBeInTheDocument();
    });
  });

  describe('Connections display', () => {
    it('should render single connection', () => {
      render(<PartnerView connections={[baseConnection]} isLoading={false} />);

      expect(screen.getByText('Partner Connection')).toBeInTheDocument();
      expect(screen.getByTestId('connection-card-conn-1')).toBeInTheDocument();
      expect(screen.getByTestId('partner-name')).toHaveTextContent('Alice Smith');
    });

    it('should render multiple connections', () => {
      const connections: PartnerConnection[] = [
        { ...baseConnection, id: 'conn-1', partner_name: 'Alice' },
        { ...baseConnection, id: 'conn-2', partner_name: 'Bob' },
        { ...baseConnection, id: 'conn-3', partner_name: 'Carol' },
      ];

      render(<PartnerView connections={connections} isLoading={false} />);

      expect(screen.getByTestId('connection-card-conn-1')).toBeInTheDocument();
      expect(screen.getByTestId('connection-card-conn-2')).toBeInTheDocument();
      expect(screen.getByTestId('connection-card-conn-3')).toBeInTheDocument();
    });

    it('should show header when connections exist', () => {
      render(<PartnerView connections={[baseConnection]} isLoading={false} />);

      expect(screen.getByText('Partner Connection')).toBeInTheDocument();
    });

    it('should not show empty state when connections exist', () => {
      render(<PartnerView connections={[baseConnection]} isLoading={false} />);

      expect(screen.queryByText('No partner connected')).not.toBeInTheDocument();
    });
  });

  describe('Connection properties', () => {
    it('should render connection with spouse relationship', () => {
      const connection = { ...baseConnection, relationship: 'spouse' as const };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('relationship')).toHaveTextContent('spouse');
    });

    it('should render connection with partner relationship', () => {
      const connection = { ...baseConnection, relationship: 'partner' as const };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('relationship')).toHaveTextContent('partner');
    });

    it('should render connection with friend relationship', () => {
      const connection = { ...baseConnection, relationship: 'friend' as const };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('relationship')).toHaveTextContent('friend');
    });

    it('should render connection with family relationship', () => {
      const connection = { ...baseConnection, relationship: 'family' as const };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('relationship')).toHaveTextContent('family');
    });
  });

  describe('Edge cases', () => {
    it('should handle connection with no permissions', () => {
      const connection = { ...baseConnection, permissions: [] };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('connection-card-conn-1')).toBeInTheDocument();
    });

    it('should handle connection with many permissions', () => {
      const connection = {
        ...baseConnection,
        permissions: [
          { module: 'meals' as const, permission: 'collaborate' as const },
          { module: 'shopping' as const, permission: 'view' as const },
          { module: 'todos' as const, permission: 'collaborate' as const },
          { module: 'goals' as const, permission: 'view' as const },
          { module: 'habits' as const, permission: 'merged' as const },
        ],
      };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('connection-card-conn-1')).toBeInTheDocument();
    });

    it('should handle connection with long partner name', () => {
      const connection = {
        ...baseConnection,
        partner_name: 'Alexander Maximilian Christopher Wellington III',
      };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('partner-name')).toHaveTextContent(
        'Alexander Maximilian Christopher Wellington III'
      );
    });

    it('should handle connection with special characters in name', () => {
      const connection = {
        ...baseConnection,
        partner_name: "O'Brien-Smith",
      };

      render(<PartnerView connections={[connection]} isLoading={false} />);

      expect(screen.getByTestId('partner-name')).toHaveTextContent("O'Brien-Smith");
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<PartnerView connections={[baseConnection]} isLoading={false} />);

      const heading = screen.getByRole('heading', { name: 'Partner Connection' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should render connection cards in order', () => {
      const connections: PartnerConnection[] = [
        { ...baseConnection, id: 'conn-1', partner_name: 'Alice' },
        { ...baseConnection, id: 'conn-2', partner_name: 'Bob' },
      ];

      const { container } = render(
        <PartnerView connections={connections} isLoading={false} />
      );

      const cards = container.querySelectorAll('[data-testid^="connection-card-"]');
      expect(cards[0]).toHaveAttribute('data-testid', 'connection-card-conn-1');
      expect(cards[1]).toHaveAttribute('data-testid', 'connection-card-conn-2');
    });
  });
});
