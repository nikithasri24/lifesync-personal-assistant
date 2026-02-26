/**
 * Unit tests for InvitePartnerModalV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitePartnerModalV2 } from '../InvitePartnerModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, onClose, title, children, validate, onSubmit }: any) => {
    if (!isOpen) return null;

    const [formState, setFormState] = React.useState({
      email: '',
      name: '',
      relationshipType: 'partner',
      message: '',
      permissions: {},
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Get the latest form state from the form
      const currentEmail = (e.target as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
      const currentFormState = {
        ...formState,
        email: currentEmail?.value || '',
      };

      const error = validate?.(currentFormState);
      if (error) {
        alert(error);
        return;
      }
      await onSubmit(currentFormState);
    };

    return (
      <div data-testid="form-modal">
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          {children(formState, setFormState)}
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    );
  },
}));

// Mock useCreateInvitationMutation
vi.mock('@/hooks/useConnectionsQuery', () => ({
  useCreateInvitationMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock PermissionToggles
vi.mock('../PermissionToggles', () => ({
  PermissionToggles: ({ permissions, onChange }: any) => (
    <div data-testid="permission-toggles">
      <button
        type="button"
        onClick={() => onChange({ ...permissions, meals: 'collaborate' })}
        data-testid="toggle-meals"
      >
        Toggle Meals
      </button>
      <button
        type="button"
        onClick={() => onChange({ ...permissions, shopping: 'view' })}
        data-testid="toggle-shopping"
      >
        Toggle Shopping
      </button>
    </div>
  ),
}));

describe('InvitePartnerModalV2', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <InvitePartnerModalV2 isOpen={false} onClose={mockOnClose} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Invite Partner')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText("Partner's Email Address *")).toBeInTheDocument();
      expect(screen.getByPlaceholderText('partner@example.com')).toBeInTheDocument();

      expect(screen.getByText("Partner's Name (Optional)")).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What do you call them?')).toBeInTheDocument();

      expect(screen.getByText('Relationship')).toBeInTheDocument();
      expect(screen.getByText('Personal Message (Optional)')).toBeInTheDocument();
    });

    it('should render permission toggles section', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Choose What to Share')).toBeInTheDocument();
      expect(screen.getByTestId('permission-toggles')).toBeInTheDocument();
    });

    it('should render relationship options', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('💍 Spouse')).toBeInTheDocument();
      expect(screen.getByText('💕 Partner')).toBeInTheDocument();
      expect(screen.getByText('👥 Friend')).toBeInTheDocument();
      expect(screen.getByText('👨‍👩‍👧‍👦 Family')).toBeInTheDocument();
      expect(screen.getByText('🏠 Roommate')).toBeInTheDocument();
      expect(screen.getByText('💼 Colleague')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should require email field', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should have email type for email field', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should accept email input', async () => {
      const user = userEvent.setup();

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText(
        'partner@example.com'
      ) as HTMLInputElement;
      await user.type(emailInput, 'partner@example.com');

      expect(emailInput.value).toBe('partner@example.com');
    });

    it('should accept email with special characters', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner.name+tag@example.co.uk');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Form submission', () => {
    it('should call mutation with correct data on submit', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      const { useCreateInvitationMutation } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useCreateInvitationMutation).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const { container } = render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner@example.com');

      const nameInput = screen.getByPlaceholderText('What do you call them?');
      await user.type(nameInput, 'My Partner');

      const relationshipSelect = container.querySelector('select') as HTMLSelectElement;
      await user.selectOptions(relationshipSelect, 'spouse');

      const messageInput = screen.getByPlaceholderText('Add a personal message...');
      await user.type(messageInput, 'Join me!');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            receiverEmail: 'partner@example.com',
            relationship: 'spouse',
            label: 'My Partner',
            message: 'Join me!',
          }),
          expect.any(Object)
        );
      });
    });

    it('should handle submission without optional fields', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      const { useCreateInvitationMutation } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useCreateInvitationMutation).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner@example.com');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            receiverEmail: 'partner@example.com',
            relationship: 'partner',
            label: undefined,
            message: undefined,
          }),
          expect.any(Object)
        );
      });
    });

    it('should include permissions in submission', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      const { useCreateInvitationMutation } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useCreateInvitationMutation).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner@example.com');

      // Toggle permissions
      const mealsToggle = screen.getByTestId('toggle-meals');
      await user.click(mealsToggle);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            proposedPermissions: { meals: 'collaborate' },
          }),
          expect.any(Object)
        );
      });
    });

    it('should not include empty permissions object', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      const { useCreateInvitationMutation } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useCreateInvitationMutation).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner@example.com');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            proposedPermissions: undefined,
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Form fields', () => {
    it('should update email field on input', async () => {
      const user = userEvent.setup();

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText(
        'partner@example.com'
      ) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update name field on input', async () => {
      const user = userEvent.setup();

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const nameInput = screen.getByPlaceholderText(
        'What do you call them?'
      ) as HTMLInputElement;
      await user.type(nameInput, 'My Partner');

      expect(nameInput.value).toBe('My Partner');
    });

    it('should update relationship field on selection', async () => {
      const user = userEvent.setup();

      const { container } = render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const relationshipSelect = container.querySelector('select') as HTMLSelectElement;
      await user.selectOptions(relationshipSelect, 'spouse');

      expect(relationshipSelect.value).toBe('spouse');
    });

    it('should update message field on input', async () => {
      const user = userEvent.setup();

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const messageInput = screen.getByPlaceholderText(
        'Add a personal message...'
      ) as HTMLTextAreaElement;
      await user.type(messageInput, 'Join me on LifeSync!');

      expect(messageInput.value).toBe('Join me on LifeSync!');
    });

    it('should mark email as required', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should not mark optional fields as required', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const nameInput = screen.getByPlaceholderText('What do you call them?');
      const messageInput = screen.getByPlaceholderText('Add a personal message...');

      expect(nameInput).not.toHaveAttribute('required');
      expect(messageInput).not.toHaveAttribute('required');
    });
  });

  describe('Permission toggles integration', () => {
    it('should update form state when permissions change', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      const { useCreateInvitationMutation } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useCreateInvitationMutation).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner@example.com');

      // Toggle multiple permissions
      const mealsToggle = screen.getByTestId('toggle-meals');
      const shoppingToggle = screen.getByTestId('toggle-shopping');

      await user.click(mealsToggle);
      await user.click(shoppingToggle);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            proposedPermissions: {
              meals: 'collaborate',
              shopping: 'view',
            },
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText("Partner's Email Address *")).toBeInTheDocument();
      expect(screen.getByText("Partner's Name (Optional)")).toBeInTheDocument();
      expect(screen.getByText('Relationship')).toBeInTheDocument();
      expect(screen.getByText('Personal Message (Optional)')).toBeInTheDocument();
    });

    it('should have email type for email input', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have text type for name input', () => {
      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const nameInput = screen.getByPlaceholderText('What do you call them?');
      expect(nameInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Modal behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<InvitePartnerModalV2 isOpen={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
