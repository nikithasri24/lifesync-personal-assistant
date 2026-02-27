/**
 * Unit tests for LoanFormModalV2 component
 * Tests loan creation/editing form with 6 loan types and payment details
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoanFormModalV2 } from '../LoanFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, title, children, onSubmit, validate }: any) => {
    if (!isOpen) return null;

    const [formState, setFormState] = React.useState({
      name: '',
      loanType: 'personal',
      principalAmount: '',
      currentBalance: '',
      interestRate: '',
      monthlyPayment: '',
      nextPaymentDate: '',
      loanTerm: '',
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

describe('LoanFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <LoanFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Loan" title when creating', () => {
      render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add Loan')).toBeInTheDocument();
    });

    it('should show "Edit Loan" title when editing', () => {
      render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{ name: 'Home Mortgage' }}
        />
      );

      expect(screen.getByText('Edit Loan')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render loan name input', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name');
      expect(nameInput).toBeInTheDocument();
    });

    it('should render loan type selector', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const typeSelect = container.querySelector('#loan-type');
      expect(typeSelect).toBeInTheDocument();
    });

    it('should render principal amount input', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const principalInput = container.querySelector('#loan-principal');
      expect(principalInput).toBeInTheDocument();
    });

    it('should render current balance input', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const balanceInput = container.querySelector('#loan-balance');
      expect(balanceInput).toBeInTheDocument();
    });

    it('should render interest rate input', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const rateInput = container.querySelector('#loan-rate');
      expect(rateInput).toBeInTheDocument();
    });

    it('should render monthly payment input', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const paymentInput = container.querySelector('#loan-payment');
      expect(paymentInput).toBeInTheDocument();
    });

    it('should render loan term input', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const termInput = container.querySelector('#loan-term');
      expect(termInput).toBeInTheDocument();
    });

    it('should render next payment date input', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const dateInput = container.querySelector('#loan-next-payment');
      expect(dateInput).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesTextarea = container.querySelector('#loan-notes');
      expect(notesTextarea).toBeInTheDocument();
    });
  });

  describe('Loan Types', () => {
    const loanTypes = [
      'Mortgage',
      'Auto Loan',
      'Student Loan',
      'Personal Loan',
      'Business Loan',
      'Other',
    ];

    it('should list all 6 loan types', () => {
      render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      loanTypes.forEach((type) => {
        expect(screen.getByText(new RegExp(type, 'i'))).toBeInTheDocument();
      });
    });

    it('should default to "Personal Loan" type', () => {
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const typeSelect = container.querySelector('#loan-type') as HTMLSelectElement;
      expect(typeSelect.value).toBe('personal');
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering loan name', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Home Mortgage');

      expect(nameInput).toHaveValue('Home Mortgage');
    });

    it('should allow selecting loan type', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const typeSelect = container.querySelector('#loan-type') as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'mortgage');

      expect(typeSelect).toHaveValue('mortgage');
    });

    it('should allow entering principal amount', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '250000');

      expect(principalInput).toHaveValue(250000);
    });

    it('should allow entering current balance', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '200000');

      expect(balanceInput).toHaveValue(200000);
    });

    it('should allow entering interest rate', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const rateInput = container.querySelector('#loan-rate') as HTMLInputElement;
      await user.type(rateInput, '3.75');

      expect(rateInput).toHaveValue(3.75);
    });

    it('should allow entering monthly payment', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '1200');

      expect(paymentInput).toHaveValue(1200);
    });

    it('should allow entering loan term', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const termInput = container.querySelector('#loan-term') as HTMLInputElement;
      await user.type(termInput, '360');

      expect(termInput).toHaveValue(360);
    });

    it('should allow entering next payment date', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const dateInput = container.querySelector('#loan-next-payment') as HTMLInputElement;
      await user.type(dateInput, '2026-03-15');

      expect(dateInput).toHaveValue('2026-03-15');
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesInput = container.querySelector('#loan-notes') as HTMLTextAreaElement;
      await user.type(notesInput, '30-year fixed rate mortgage');

      expect(notesInput).toHaveValue('30-year fixed rate mortgage');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Car Loan');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '25000');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '20000');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '500');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Car Loan',
            principalAmount: 25000,
            currentBalance: 20000,
            monthlyPayment: 500,
            loanType: 'personal',
          })
        );
      });
    });

    it('should include loan type when selected', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Student Loan');

      const typeSelect = container.querySelector('#loan-type') as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'student');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '50000');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '45000');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '400');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            loanType: 'student',
          })
        );
      });
    });

    it('should include optional fields when provided', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Mortgage');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '300000');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '280000');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '1500');

      const rateInput = container.querySelector('#loan-rate') as HTMLInputElement;
      await user.type(rateInput, '3.5');

      const termInput = container.querySelector('#loan-term') as HTMLInputElement;
      await user.type(termInput, '360');

      const dateInput = container.querySelector('#loan-next-payment') as HTMLInputElement;
      await user.type(dateInput, '2026-04-01');

      const notesInput = container.querySelector('#loan-notes') as HTMLTextAreaElement;
      await user.type(notesInput, 'Fixed rate');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            interestRate: 3.5,
            loanTerm: 360,
            nextPaymentDate: '2026-04-01',
            notes: 'Fixed rate',
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero principal amount validation', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Test Loan');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '0');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '0');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '100');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Validation should prevent submission (principal must be > 0)
      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should handle very large loan amounts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Commercial Property');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '5000000');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '4500000');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '25000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            principalAmount: 5000000,
            currentBalance: 4500000,
            monthlyPayment: 25000,
          })
        );
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, '  Home Loan  ');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '100000');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '90000');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '800');

      const notesInput = container.querySelector('#loan-notes') as HTMLTextAreaElement;
      await user.type(notesInput, '  Test notes  ');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Home Loan',
            notes: 'Test notes',
          })
        );
      });
    });

    it('should handle decimal amounts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Test');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '15000.50');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '12500.75');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '350.25');

      const rateInput = container.querySelector('#loan-rate') as HTMLInputElement;
      await user.type(rateInput, '4.25');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            principalAmount: 15000.50,
            currentBalance: 12500.75,
            monthlyPayment: 350.25,
            interestRate: 4.25,
          })
        );
      });
    });

    it('should handle balance exceeding principal', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LoanFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#loan-name') as HTMLInputElement;
      await user.type(nameInput, 'Test Loan');

      const principalInput = container.querySelector('#loan-principal') as HTMLInputElement;
      await user.type(principalInput, '50000');

      const balanceInput = container.querySelector('#loan-balance') as HTMLInputElement;
      await user.type(balanceInput, '60000');

      const paymentInput = container.querySelector('#loan-payment') as HTMLInputElement;
      await user.type(paymentInput, '500');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            principalAmount: 50000,
            currentBalance: 60000,
          })
        );
      });
    });
  });
});
