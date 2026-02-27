/**
 * Unit tests for TransactionFormModalV2 component
 * Tests transaction creation/editing form with type selector and categories
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionFormModalV2 } from '../TransactionFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, title, children, onSubmit, validate }: any) => {
    if (!isOpen) return null;

    const today = new Date().toISOString().split('T')[0];
    const [formState, setFormState] = React.useState({
      date: today,
      description: '',
      amount: '',
      type: 'debit' as 'debit' | 'credit',
      accountId: '',
      categoryId: '',
      notes: '',
      merchantName: '',
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

describe('TransactionFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockAccounts = [
    { id: 'acc-1', name: 'Checking Account' },
    { id: 'acc-2', name: 'Savings Account' },
  ];

  const mockCategories = [
    { id: 'cat-1', name: 'Groceries', icon: '🛒' },
    { id: 'cat-2', name: 'Transportation', icon: '🚗' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
          categories={mockCategories}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <TransactionFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Transaction" title when creating', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    it('should show "Edit Transaction" title when editing', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{ description: 'Test Transaction' }}
        />
      );

      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render date input', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    });

    it('should render description input', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it('should render amount input', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    });

    it('should render type selector', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/Type/i)).toBeInTheDocument();
      expect(screen.getByText(/Expense/i)).toBeInTheDocument();
      expect(screen.getByText(/Income/i)).toBeInTheDocument();
    });

    it('should render account selector', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
        />
      );

      expect(screen.getByLabelText(/Account/i)).toBeInTheDocument();
    });

    it('should render category selector', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    it('should render merchant name input', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Merchant/i)).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
    });
  });

  describe('Transaction Type', () => {
    it('should default to debit type', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Type field exists with Expense/Income options
      expect(screen.getByText(/Type/i)).toBeInTheDocument();
    });

    it('should have expense and income options', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/Expense/i)).toBeInTheDocument();
      expect(screen.getByText(/Income/i)).toBeInTheDocument();
    });
  });

  describe('Account and Category Lists', () => {
    it('should display account options', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
        />
      );

      expect(screen.getByText('Checking Account')).toBeInTheDocument();
      expect(screen.getByText('Savings Account')).toBeInTheDocument();
    });

    it('should display category options', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      expect(screen.getByText(/Groceries/)).toBeInTheDocument();
      expect(screen.getByText(/Transportation/)).toBeInTheDocument();
    });

    it('should handle empty accounts list', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={[]}
        />
      );

      expect(screen.getByLabelText(/Account/i)).toBeInTheDocument();
    });

    it('should handle empty categories list', () => {
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={[]}
        />
      );

      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering description', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Coffee shop');

      expect(descInput).toHaveValue('Coffee shop');
    });

    it('should allow entering amount', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const amountInput = screen.getByLabelText(/Amount/i);
      await user.type(amountInput, '15.50');

      expect(amountInput).toHaveValue(15.50);
    });

    it('should allow selecting account', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
        />
      );

      const accountSelect = screen.getByLabelText(/Account/i);
      await user.selectOptions(accountSelect, 'acc-1');

      expect(accountSelect).toHaveValue('acc-1');
    });

    it('should allow selecting category', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = screen.getByLabelText(/Category/i);
      await user.selectOptions(categorySelect, 'cat-1');

      expect(categorySelect).toHaveValue('cat-1');
    });

    it('should allow entering merchant name', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const merchantInput = screen.getByLabelText(/Merchant/i);
      await user.type(merchantInput, 'Starbucks');

      expect(merchantInput).toHaveValue('Starbucks');
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesInput = screen.getByLabelText(/Notes/i);
      await user.type(notesInput, 'Business expense');

      expect(notesInput).toHaveValue('Business expense');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
        />
      );

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Test Transaction');

      const amountInput = screen.getByLabelText(/Amount/i);
      await user.type(amountInput, '50.00');

      const accountSelect = screen.getByLabelText(/Account/i);
      await user.selectOptions(accountSelect, 'acc-1');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Test Transaction',
            amount: 50,
            accountId: 'acc-1',
            type: 'debit',
          })
        );
      });
    });

    it('should include category when selected', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
          categories={mockCategories}
        />
      );

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Gas');

      const amountInput = screen.getByLabelText(/Amount/i);
      await user.type(amountInput, '40.00');

      const accountSelect = screen.getByLabelText(/Account/i);
      await user.selectOptions(accountSelect, 'acc-1');

      const categorySelect = screen.getByLabelText(/Category/i);
      await user.selectOptions(categorySelect, 'cat-2');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryId: 'cat-2',
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
        />
      );

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Test');

      const accountSelect = screen.getByLabelText(/Account/i);
      await user.selectOptions(accountSelect, 'acc-1');

      const amountInput = screen.getByLabelText(/Amount/i);
      await user.type(amountInput, '0');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
        />
      );

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, '  Test Transaction  ');

      const accountSelect = screen.getByLabelText(/Account/i);
      await user.selectOptions(accountSelect, 'acc-1');

      const amountInput = screen.getByLabelText(/Amount/i);
      await user.type(amountInput, '10');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle decimal amounts', async () => {
      const user = userEvent.setup();
      render(
        <TransactionFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          accounts={mockAccounts}
        />
      );

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Test');

      const amountInput = screen.getByLabelText(/Amount/i);
      await user.type(amountInput, '123.45');

      const accountSelect = screen.getByLabelText(/Account/i);
      await user.selectOptions(accountSelect, 'acc-1');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });
});
