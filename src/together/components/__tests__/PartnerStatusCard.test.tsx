/**
 * Unit tests for PartnerStatusCard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartnerStatusCard } from '../PartnerStatusCard';
import type { PartnerLink } from '../../types';

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
      medium: '#CCCCCC',
    },
  })),
}));

vi.mock('../../hooks', () => ({
  useUpdatePartnerName: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../../utils/dateHelpers', () => ({
  calculateDaysTogether: vi.fn((date: string) => {
    if (date === '2020-06-15') return 1461;
    return 0;
  }),
  formatDateLong: vi.fn((date: string) => 'June 15, 2024'),
}));

describe('PartnerStatusCard', () => {
  const mockOnLinkPartner = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should render skeleton when loading', () => {
      const { container } = render(
        <PartnerStatusCard
          partnerLink={null}
          isLoading={true}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render skeleton with correct styling', () => {
      const { container } = render(
        <PartnerStatusCard
          partnerLink={null}
          isLoading={true}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const skeleton = container.querySelector('.bg-gray-200');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('No partner linked state', () => {
    it('should render connect message when no partner linked', () => {
      render(
        <PartnerStatusCard
          partnerLink={null}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument();
      expect(screen.getByText(/Link your LifeSync account with your partner/)).toBeInTheDocument();
    });

    it('should render heart emoji', () => {
      render(
        <PartnerStatusCard
          partnerLink={null}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.getByText('💝')).toBeInTheDocument();
    });

    it('should render link to Shared page', () => {
      render(
        <PartnerStatusCard
          partnerLink={null}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const link = screen.getByRole('link', { name: /Shared/i });
      expect(link).toHaveAttribute('href', '/shared');
    });

    it('should render instructions text', () => {
      render(
        <PartnerStatusCard
          partnerLink={null}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.getByText(/Go to the/)).toBeInTheDocument();
      expect(screen.getByText(/page to send a connection request/)).toBeInTheDocument();
      expect(screen.getByText(/Once your connection is accepted/)).toBeInTheDocument();
    });
  });

  describe('Partner linked state', () => {
    const partnerLink: PartnerLink = {
      id: 'conn-1',
      partner_id: 'user-456',
      partner_name: 'Alice',
      relationship_start_date: '2020-06-15',
      days_together: 1461,
    };

    it('should render partner name', () => {
      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should render couple emoji', () => {
      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.getByText('💑')).toBeInTheDocument();
    });

    it('should render days together badge when relationship_start_date exists', () => {
      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.getByText('1461 days')).toBeInTheDocument();
    });

    it('should not render days badge when no relationship_start_date', () => {
      const partnerWithoutDate: PartnerLink = {
        ...partnerLink,
        relationship_start_date: null,
      };

      render(
        <PartnerStatusCard
          partnerLink={partnerWithoutDate}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.queryByText(/days/)).not.toBeInTheDocument();
    });

    it('should render default name when partner_name is null', () => {
      const partnerWithoutName: PartnerLink = {
        ...partnerLink,
        partner_name: null,
      };

      render(
        <PartnerStatusCard
          partnerLink={partnerWithoutName}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      expect(screen.getByText('Your Partner')).toBeInTheDocument();
    });
  });

  describe('Edit partner name', () => {
    const partnerLink: PartnerLink = {
      id: 'conn-1',
      partner_id: 'user-456',
      partner_name: 'Alice',
      relationship_start_date: '2020-06-15',
      days_together: 1461,
    };

    it('should enter edit mode when clicking partner name', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      expect(screen.getByRole('textbox', { name: /Edit partner name/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save partner name/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel editing/i })).toBeInTheDocument();
    });

    it('should focus and select input text when entering edit mode', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      expect(input).toHaveFocus();
      expect(input).toHaveValue('Alice');
    });

    it('should update input value when typing', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.clear(input);
      await user.type(input, 'Bob');

      expect(input).toHaveValue('Bob');
    });

    it('should call update mutation when clicking save button', async () => {
      const mockMutate = vi.fn();
      const { useUpdatePartnerName } = await import('../../hooks');
      vi.mocked(useUpdatePartnerName).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.clear(input);
      await user.type(input, 'Bob');

      const saveButton = screen.getByRole('button', { name: /Save partner name/i });
      await user.click(saveButton);

      expect(mockMutate).toHaveBeenCalledWith(
        { connectionId: 'conn-1', name: 'Bob' },
        expect.any(Object)
      );
    });

    it('should save when pressing Enter key', async () => {
      const mockMutate = vi.fn();
      const { useUpdatePartnerName } = await import('../../hooks');
      vi.mocked(useUpdatePartnerName).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.clear(input);
      await user.type(input, 'Bob{Enter}');

      expect(mockMutate).toHaveBeenCalledWith(
        { connectionId: 'conn-1', name: 'Bob' },
        expect.any(Object)
      );
    });

    it('should cancel edit mode when clicking cancel button', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const cancelButton = screen.getByRole('button', { name: /Cancel editing/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should cancel edit mode when pressing Escape key', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.type(input, '{Escape}');

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should disable save button when name is empty', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.clear(input);

      const saveButton = screen.getByRole('button', { name: /Save partner name/i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when name is only whitespace', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.clear(input);
      await user.type(input, '   ');

      const saveButton = screen.getByRole('button', { name: /Save partner name/i });
      expect(saveButton).toBeDisabled();
    });

    it('should trim whitespace when saving', async () => {
      const mockMutate = vi.fn();
      const { useUpdatePartnerName } = await import('../../hooks');
      vi.mocked(useUpdatePartnerName).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.clear(input);
      await user.type(input, '  Bob  {Enter}');

      expect(mockMutate).toHaveBeenCalledWith(
        { connectionId: 'conn-1', name: 'Bob' },
        expect.any(Object)
      );
    });

    it('should disable buttons when update is pending', async () => {
      const { useUpdatePartnerName } = await import('../../hooks');
      vi.mocked(useUpdatePartnerName).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as any);

      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const saveButton = screen.getByRole('button', { name: /Save partner name/i });
      const cancelButton = screen.getByRole('button', { name: /Cancel editing/i });

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should exit edit mode after successful save', async () => {
      const mockMutate = vi.fn((data, { onSuccess }) => {
        onSuccess?.();
      });
      const { useUpdatePartnerName } = await import('../../hooks');
      vi.mocked(useUpdatePartnerName).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      await user.click(nameButton);

      const input = screen.getByRole('textbox', { name: /Edit partner name/i });
      await user.clear(input);
      await user.type(input, 'Bob');

      const saveButton = screen.getByRole('button', { name: /Save partner name/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('should enter edit mode when pressing Enter on partner name', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      nameButton.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('textbox', { name: /Edit partner name/i })).toBeInTheDocument();
    });

    it('should enter edit mode when pressing Space on partner name', async () => {
      const user = userEvent.setup();

      render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Click to edit partner name/i });
      nameButton.focus();
      await user.keyboard(' ');

      expect(screen.getByRole('textbox', { name: /Edit partner name/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply terracotta background when partner linked', () => {
      const partnerLink: PartnerLink = {
        id: 'conn-1',
        partner_id: 'user-456',
        partner_name: 'Alice',
        relationship_start_date: '2020-06-15',
        days_together: 1461,
      };

      const { container } = render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.backgroundColor).toContain('rgba(212, 165, 116');
    });

    it('should apply gradient to days badge', () => {
      const partnerLink: PartnerLink = {
        id: 'conn-1',
        partner_id: 'user-456',
        partner_name: 'Alice',
        relationship_start_date: '2020-06-15',
        days_together: 1461,
      };

      const { container } = render(
        <PartnerStatusCard
          partnerLink={partnerLink}
          isLoading={false}
          onLinkPartner={mockOnLinkPartner}
        />
      );

      const badge = screen.getByText('1461 days').closest('div');
      expect(badge?.getAttribute('style')).toContain('linear-gradient');
    });
  });
});
