/**
 * Unit tests for SendPartnerRequestModal component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendPartnerRequestModal } from '../SendPartnerRequestModal';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, onClose, title, children, validate, onSubmit, defaultData }: any) => {
    if (!isOpen) return null;

    const initialFormState = defaultData || {
      partnerEmail: '',
      anniversaryDate: '',
    };

    const [formState, setFormState] = React.useState(initialFormState);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;
      const emailInput = form.querySelector('input[placeholder="partner@example.com"]') as HTMLInputElement;
      const dateInput = form.querySelector('input[type="date"]') as HTMLInputElement;

      const currentFormState = {
        ...formState,
        partnerEmail: emailInput?.value || '',
        anniversaryDate: dateInput?.value || '',
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
        <form onSubmit={handleSubmit} noValidate>
          {children(formState, setFormState)}
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    );
  },
}));

describe('SendPartnerRequestModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <SendPartnerRequestModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Send Partner Request')).toBeInTheDocument();
    });

    it('should render partner email field', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText("Partner's Email")).toBeInTheDocument();
      expect(screen.getByPlaceholderText('partner@example.com')).toBeInTheDocument();
    });

    it('should render anniversary date field', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Anniversary Date (Optional)')).toBeInTheDocument();
      expect(screen.getByText('The date you started your relationship together')).toBeInTheDocument();
    });

    it('should render info message', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Your partner will receive a notification/)).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(alertSpy).toHaveBeenCalledWith('Partner email is required');
      alertSpy.mockRestore();
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(alertSpy).toHaveBeenCalledWith('Please enter a valid email address');
      alertSpy.mockRestore();
    });

    it('should accept valid email', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner@example.com');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should not show validation error
      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Form submission', () => {
    it('should redirect to /shared on submit', async () => {
      const user = userEvent.setup();

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      await user.type(emailInput, 'partner@example.com');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe('/shared');
      });
    });
  });

  describe('Form fields', () => {
    it('should update email field on input', async () => {
      const user = userEvent.setup();

      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const emailInput = screen.getByPlaceholderText('partner@example.com') as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update anniversary date field on input', async () => {
      const user = userEvent.setup();

      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const dateInput = screen.getByLabelText('Anniversary Date (Optional)') as HTMLInputElement;
      await user.type(dateInput, '2024-01-01');

      expect(dateInput.value).toBe('2024-01-01');
    });

    it('should mark email as required', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should not mark anniversary date as required', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const dateInput = screen.getByLabelText('Anniversary Date (Optional)');
      expect(dateInput).not.toHaveAttribute('required');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText("Partner's Email")).toBeInTheDocument();
      expect(screen.getByLabelText('Anniversary Date (Optional)')).toBeInTheDocument();
    });

    it('should have email type for email input', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const emailInput = screen.getByPlaceholderText('partner@example.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have date type for anniversary input', () => {
      render(
        <SendPartnerRequestModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const dateInput = screen.getByLabelText('Anniversary Date (Optional)');
      expect(dateInput).toHaveAttribute('type', 'date');
    });
  });
});
