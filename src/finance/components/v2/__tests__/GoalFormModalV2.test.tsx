/**
 * Unit tests for GoalFormModalV2 component
 * Tests financial goal creation/editing form with 8 category options
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalFormModalV2 } from '../GoalFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, title, children, onSubmit, validate }: any) => {
    if (!isOpen) return null;

    const [formState, setFormState] = React.useState({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      category: 'other',
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

describe('GoalFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <GoalFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Goal" title when creating', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add Goal')).toBeInTheDocument();
    });

    it('should show "Edit Goal" title when editing', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{ name: 'Emergency Fund' }}
        />
      );

      expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render goal name input', () => {
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name');
      expect(nameInput).toBeInTheDocument();
    });

    it('should render target amount input', () => {
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const targetInput = container.querySelector('#goal-target');
      expect(targetInput).toBeInTheDocument();
    });

    it('should render current amount input', () => {
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const currentInput = container.querySelector('#goal-current');
      expect(currentInput).toBeInTheDocument();
    });

    it('should render deadline input', () => {
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deadlineInput = container.querySelector('#goal-deadline');
      expect(deadlineInput).toBeInTheDocument();
    });

    it('should render category selector', () => {
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const categorySelect = container.querySelector('#goal-category');
      expect(categorySelect).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesTextarea = container.querySelector('#goal-notes');
      expect(notesTextarea).toBeInTheDocument();
    });
  });

  describe('Goal Categories', () => {
    const categories = [
      'Vacation',
      'Home Purchase',
      'Car Purchase',
      'Education',
      'Emergency Fund',
      'Retirement',
      'Investment',
      'Other',
    ];

    it('should list all 8 goal categories', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      categories.forEach((category) => {
        expect(screen.getByText(new RegExp(category, 'i'))).toBeInTheDocument();
      });
    });

    it('should default to "Other" category', () => {
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const categorySelect = container.querySelector('#goal-category') as HTMLSelectElement;
      expect(categorySelect.value).toBe('other');
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering goal name', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Emergency Fund');

      expect(nameInput).toHaveValue('Emergency Fund');
    });

    it('should allow entering target amount', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '10000');

      expect(targetInput).toHaveValue(10000);
    });

    it('should allow entering current amount', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const currentInput = container.querySelector('#goal-current') as HTMLInputElement;
      await user.clear(currentInput);
      await user.type(currentInput, '5000');

      expect(currentInput).toHaveValue(5000);
    });

    it('should allow selecting category', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const categorySelect = container.querySelector('#goal-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'vacation');

      expect(categorySelect).toHaveValue('vacation');
    });

    it('should allow setting deadline', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deadlineInput = container.querySelector('#goal-deadline') as HTMLInputElement;
      await user.type(deadlineInput, '2026-12-31');

      expect(deadlineInput).toHaveValue('2026-12-31');
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesInput = container.querySelector('#goal-notes') as HTMLTextAreaElement;
      await user.type(notesInput, 'Save $500 per month');

      expect(notesInput).toHaveValue('Save $500 per month');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Vacation Fund');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '5000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Vacation Fund',
            targetAmount: 5000,
            currentAmount: 0,
            category: 'other',
          })
        );
      });
    });

    it('should include deadline when provided', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'House Down Payment');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '50000');

      const deadlineInput = container.querySelector('#goal-deadline') as HTMLInputElement;
      await user.type(deadlineInput, '2027-06-30');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            deadline: '2027-06-30',
          })
        );
      });
    });

    it('should include selected category', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Emergency Fund');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '10000');

      const categorySelect = container.querySelector('#goal-category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'emergency');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'emergency',
          })
        );
      });
    });

    it('should include current amount when provided', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Retirement');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '1000000');

      const currentInput = container.querySelector('#goal-current') as HTMLInputElement;
      await user.clear(currentInput);
      await user.type(currentInput, '250000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            currentAmount: 250000,
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero target amount', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Test');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '0');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Should validate that target must be > 0
      // The validate function should prevent submission
    });

    it('should handle very large target amounts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Dream Mansion');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '5000000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            targetAmount: 5000000,
          })
        );
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, '  Emergency Fund  ');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '10000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Emergency Fund',
          })
        );
      });
    });

    it('should handle decimal amounts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Savings Goal');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '5000.50');

      const currentInput = container.querySelector('#goal-current') as HTMLInputElement;
      await user.clear(currentInput);
      await user.type(currentInput, '1234.56');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            targetAmount: 5000.50,
            currentAmount: 1234.56,
          })
        );
      });
    });

    it('should handle current amount exceeding target', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#goal-name') as HTMLInputElement;
      await user.type(nameInput, 'Exceeded Goal');

      const targetInput = container.querySelector('#goal-target') as HTMLInputElement;
      await user.type(targetInput, '1000');

      const currentInput = container.querySelector('#goal-current') as HTMLInputElement;
      await user.clear(currentInput);
      await user.type(currentInput, '1500');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            targetAmount: 1000,
            currentAmount: 1500,
          })
        );
      });
    });
  });
});
