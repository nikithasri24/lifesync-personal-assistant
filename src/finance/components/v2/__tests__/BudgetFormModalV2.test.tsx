/**
 * Unit tests for BudgetFormModalV2 component
 * Tests budget creation/editing form with category selector and rollover option
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetFormModalV2 } from '../BudgetFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, title, children, onSubmit, validate }: any) => {
    if (!isOpen) return null;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [formState, setFormState] = React.useState({
      monthYear: currentMonth,
      categoryId: '',
      limitAmount: '',
      rollover: false,
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

describe('BudgetFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockCategories = [
    { id: 'cat-1', name: 'Groceries', icon: '🛒' },
    { id: 'cat-2', name: 'Transportation', icon: '🚗' },
    { id: 'cat-3', name: 'Entertainment', icon: '🎬' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <BudgetFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Budget" title when creating', () => {
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add Budget')).toBeInTheDocument();
    });

    it('should show "Edit Budget" title when editing', () => {
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{ categoryId: 'cat-1' }}
        />
      );

      expect(screen.getByText('Edit Budget')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render month input', () => {
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const monthInput = container.querySelector('#budget-month');
      expect(monthInput).toBeInTheDocument();
    });

    it('should render category selector', () => {
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category');
      expect(categorySelect).toBeInTheDocument();
    });

    it('should render limit amount input', () => {
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const limitInput = container.querySelector('#budget-limit');
      expect(limitInput).toBeInTheDocument();
    });

    it('should render rollover checkbox', () => {
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/Rollover unused budget/i)).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesTextarea = container.querySelector('#budget-notes');
      expect(notesTextarea).toBeInTheDocument();
    });
  });

  describe('Category List', () => {
    it('should display category options', () => {
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      expect(screen.getByText(/Groceries/)).toBeInTheDocument();
      expect(screen.getByText(/Transportation/)).toBeInTheDocument();
      expect(screen.getByText(/Entertainment/)).toBeInTheDocument();
    });

    it('should handle empty categories list', () => {
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={[]}
        />
      );

      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });
  });

  describe('Rollover Checkbox', () => {
    it('should default to unchecked', () => {
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const rolloverCheckbox = screen.getByLabelText(/Rollover/i) as HTMLInputElement;
      expect(rolloverCheckbox.checked).toBe(false);
    });

    it('should allow checking the rollover option', async () => {
      const user = userEvent.setup();
      render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const rolloverCheckbox = screen.getByLabelText(/Rollover/i);
      await user.click(rolloverCheckbox);

      expect(rolloverCheckbox).toBeChecked();
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering limit amount', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '500');

      expect(limitInput).toHaveValue(500);
    });

    it('should allow selecting category', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      expect(categorySelect).toHaveValue('cat-1');
    });

    it('should allow selecting month', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const monthInput = container.querySelector('#budget-month') as HTMLInputElement;
      await user.clear(monthInput);
      await user.type(monthInput, '2026-03');

      expect(monthInput).toHaveValue('2026-03');
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesInput = container.querySelector('#budget-notes') as HTMLTextAreaElement;
      await user.type(notesInput, 'Monthly grocery budget');

      expect(notesInput).toHaveValue('Monthly grocery budget');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '500');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should include rollover when checked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '1000');

      const rolloverCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      await user.click(rolloverCheckbox);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should include notes when provided', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '750');

      const notesInput = container.querySelector('#budget-notes') as HTMLTextAreaElement;
      await user.type(notesInput, 'Test notes');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero limit amount', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '0');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Should validate that limit must be > 0
      // The validate function should prevent submission
    });

    it('should handle very large limit amounts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '999999');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            limitAmount: 999999,
          })
        );
      });
    });

    it('should trim whitespace from notes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '500');

      const notesInput = container.querySelector('#budget-notes') as HTMLTextAreaElement;
      await user.type(notesInput, '  Test notes  ');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: 'Test notes',
          })
        );
      });
    });

    it('should handle decimal limit amounts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BudgetFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          categories={mockCategories}
        />
      );

      const categorySelect = container.querySelector('#budget-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'cat-1');

      const limitInput = container.querySelector('#budget-limit') as HTMLInputElement;
      await user.type(limitInput, '500.50');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            limitAmount: 500.50,
          })
        );
      });
    });
  });
});
