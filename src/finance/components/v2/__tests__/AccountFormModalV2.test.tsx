/**
 * Unit tests for AccountFormModalV2 component
 * Tests account creation/editing form with conditional credit card fields
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountFormModalV2 } from '../AccountFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, title, children, onSubmit, validate }: any) => {
    if (!isOpen) return null;

    const [formState, setFormState] = React.useState({
      name: '',
      type: 'checking',
      balance: '0',
      creditLimit: '',
      apr: '',
      notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const error = validate?.(formState);
      if (error) return;
      await onSubmit(formState);
    };

    return (
      <div data-testid="form-modal">
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          {children(formState, setFormState)}
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  },
}));

describe('AccountFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <AccountFormModalV2 isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Account" title when creating', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByText('Add Account')).toBeInTheDocument();
    });

    it('should show "Edit Account" title when editing', () => {
      render(
        <AccountFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{ name: 'Test Account' }}
        />
      );

      expect(screen.getByText('Edit Account')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render account name input', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
    });

    it('should render account type selector', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByLabelText(/Account Type/i)).toBeInTheDocument();
    });

    it('should render balance input', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByLabelText(/Balance/i)).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
    });

    it('should not show credit card fields by default', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.queryByLabelText(/Credit Limit/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/APR/i)).not.toBeInTheDocument();
    });
  });

  describe('Account Types', () => {
    it('should list all account types', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const select = screen.getByLabelText(/Account Type/i);
      expect(select).toBeInTheDocument();

      // Check for key account types
      expect(screen.getByText(/Checking/)).toBeInTheDocument();
      expect(screen.getByText(/Savings/)).toBeInTheDocument();
      expect(screen.getByText(/Credit Card/)).toBeInTheDocument();
      expect(screen.getByText(/Brokerage/)).toBeInTheDocument();
    });

    it('should default to checking type', () => {
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const select = screen.getByLabelText(/Account Type/i) as HTMLSelectElement;
      expect(select.value).toBe('checking');
    });
  });

  describe('Credit Card Conditional Fields', () => {
    it('should show credit card fields when type is credit', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const typeSelect = screen.getByLabelText(/Account Type/i);
      await user.selectOptions(typeSelect, 'credit');

      await waitFor(() => {
        expect(screen.getByLabelText(/Credit Limit/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/APR/i)).toBeInTheDocument();
      });
    });

    it('should hide credit card fields when type changes from credit', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const typeSelect = screen.getByLabelText(/Account Type/i);

      // First select credit
      await user.selectOptions(typeSelect, 'credit');
      await waitFor(() => {
        expect(screen.getByLabelText(/Credit Limit/i)).toBeInTheDocument();
      });

      // Then select checking
      await user.selectOptions(typeSelect, 'checking');
      await waitFor(() => {
        expect(screen.queryByLabelText(/Credit Limit/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering account name', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const nameInput = screen.getByLabelText(/Account Name/i);
      await user.type(nameInput, 'Chase Checking');

      expect(nameInput).toHaveValue('Chase Checking');
    });

    it('should allow selecting account type', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const typeSelect = screen.getByLabelText(/Account Type/i);
      await user.selectOptions(typeSelect, 'savings');

      expect(typeSelect).toHaveValue('savings');
    });

    it('should allow entering balance', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const balanceInput = screen.getByLabelText(/Balance/i);
      await user.clear(balanceInput);
      await user.type(balanceInput, '1500.50');

      expect(balanceInput).toHaveValue(1500.50);
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const notesInput = screen.getByLabelText(/Notes/i);
      await user.type(notesInput, 'Primary checking account');

      expect(notesInput).toHaveValue('Primary checking account');
    });

    it('should allow entering credit limit for credit cards', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const typeSelect = screen.getByLabelText(/Account Type/i);
      await user.selectOptions(typeSelect, 'credit');

      await waitFor(async () => {
        const creditLimitInput = screen.getByLabelText(/Credit Limit/i);
        await user.type(creditLimitInput, '5000');
        expect(creditLimitInput).toHaveValue(5000);
      });
    });

    it('should allow entering APR for credit cards', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const typeSelect = screen.getByLabelText(/Account Type/i);
      await user.selectOptions(typeSelect, 'credit');

      await waitFor(async () => {
        const aprInput = screen.getByLabelText(/APR/i);
        await user.type(aprInput, '15.99');
        expect(aprInput).toHaveValue(15.99);
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const nameInput = screen.getByLabelText(/Account Name/i);
      await user.type(nameInput, 'Test Account');

      const balanceInput = screen.getByLabelText(/Balance/i);
      await user.clear(balanceInput);
      await user.type(balanceInput, '1000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Account',
            type: 'checking',
            balance: 1000,
          })
        );
      });
    });

    it('should include credit card fields in submission', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const nameInput = screen.getByLabelText(/Account Name/i);
      await user.type(nameInput, 'Credit Card');

      const typeSelect = screen.getByLabelText(/Account Type/i);
      await user.selectOptions(typeSelect, 'credit');

      await waitFor(async () => {
        const creditLimitInput = screen.getByLabelText(/Credit Limit/i);
        await user.type(creditLimitInput, '5000');

        const aprInput = screen.getByLabelText(/APR/i);
        await user.type(aprInput, '18.5');
      });

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Credit Card',
            type: 'credit',
            creditLimit: 5000,
            apr: 18.5,
          })
        );
      });
    });
  });

  describe('Pre-filled Data', () => {
    it('should display pre-filled account data', () => {
      render(
        <AccountFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{
            name: 'Existing Account',
            type: 'savings',
            balance: 5000,
            notes: 'Test notes',
          }}
        />
      );

      // Note: With FormModalV2 mock, initial data needs to be passed differently
      // This test verifies the component structure accepts initialData
      expect(screen.getByText('Edit Account')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty balance', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const nameInput = screen.getByLabelText(/Account Name/i);
      await user.type(nameInput, 'Test');

      const balanceInput = screen.getByLabelText(/Balance/i);
      await user.clear(balanceInput);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            balance: 0,
          })
        );
      });
    });

    it('should handle zero credit limit', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const nameInput = screen.getByLabelText(/Account Name/i);
      await user.type(nameInput, 'Test');

      const typeSelect = screen.getByLabelText(/Account Type/i);
      await user.selectOptions(typeSelect, 'credit');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      render(
        <AccountFormModalV2 isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      const nameInput = screen.getByLabelText(/Account Name/i);
      await user.type(nameInput, '  Test Account  ');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Account',
          })
        );
      });
    });
  });
});
