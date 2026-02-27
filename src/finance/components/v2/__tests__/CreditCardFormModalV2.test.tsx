/**
 * Unit tests for CreditCardFormModalV2 component
 * Tests credit card creation/editing form with rewards types and sign-up bonuses
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditCardFormModalV2 } from '../CreditCardFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, title, children, onSubmit, validate }: any) => {
    if (!isOpen) return null;

    const [formState, setFormState] = React.useState({
      cardName: '',
      issuer: '',
      last4Digits: '',
      creditLimit: '',
      apr: '',
      annualFee: '0',
      rewardsType: 'cashback',
      rewardsRate: '',
      signUpBonus: '',
      signUpBonusRequirement: '',
      bonusDeadline: '',
      benefits: '',
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

describe('CreditCardFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <CreditCardFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Credit Card" title when creating', () => {
      render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add Credit Card')).toBeInTheDocument();
    });

    it('should show "Edit Credit Card" title when editing', () => {
      render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{ cardName: 'Chase Sapphire' }}
        />
      );

      expect(screen.getByText('Edit Credit Card')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all required fields', () => {
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(container.querySelector('#card-name')).toBeInTheDocument();
      expect(container.querySelector('#card-issuer')).toBeInTheDocument();
      expect(container.querySelector('#card-last4')).toBeInTheDocument();
      expect(container.querySelector('#card-limit')).toBeInTheDocument();
      expect(container.querySelector('#card-apr')).toBeInTheDocument();
      expect(container.querySelector('#card-fee')).toBeInTheDocument();
      expect(container.querySelector('#card-rewards')).toBeInTheDocument();
      expect(container.querySelector('#card-rate')).toBeInTheDocument();
      expect(container.querySelector('#card-bonus')).toBeInTheDocument();
      expect(container.querySelector('#card-bonus-req')).toBeInTheDocument();
      expect(container.querySelector('#card-bonus-deadline')).toBeInTheDocument();
      expect(container.querySelector('#card-benefits')).toBeInTheDocument();
      expect(container.querySelector('#card-notes')).toBeInTheDocument();
    });
  });

  describe('Rewards Types', () => {
    const rewardsTypes = ['Cash Back', 'Points', 'Travel Miles', 'No Rewards'];

    it('should list all 4 rewards types', () => {
      render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      rewardsTypes.forEach((type) => {
        expect(screen.getByText(new RegExp(type, 'i'))).toBeInTheDocument();
      });
    });

    it('should default to "Cash Back" rewards type', () => {
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const rewardsSelect = container.querySelector('#card-rewards') as HTMLSelectElement;
      expect(rewardsSelect.value).toBe('cashback');
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering card name', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, 'Chase Sapphire Preferred');

      expect(nameInput).toHaveValue('Chase Sapphire Preferred');
    });

    it('should allow entering issuer', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, 'Chase');

      expect(issuerInput).toHaveValue('Chase');
    });

    it('should allow entering last 4 digits', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const last4Input = container.querySelector('#card-last4') as HTMLInputElement;
      await user.type(last4Input, '1234');

      expect(last4Input).toHaveValue('1234');
    });

    it('should allow entering credit limit', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const limitInput = container.querySelector('#card-limit') as HTMLInputElement;
      await user.type(limitInput, '10000');

      expect(limitInput).toHaveValue(10000);
    });

    it('should allow selecting rewards type', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const rewardsSelect = container.querySelector('#card-rewards') as HTMLSelectElement;
      await user.selectOptions(rewardsSelect, 'points');

      expect(rewardsSelect).toHaveValue('points');
    });

    it('should allow entering sign-up bonus', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const bonusInput = container.querySelector('#card-bonus') as HTMLInputElement;
      await user.type(bonusInput, '60000');

      expect(bonusInput).toHaveValue(60000);
    });

    it('should allow entering benefits', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const benefitsInput = container.querySelector('#card-benefits') as HTMLTextAreaElement;
      await user.type(benefitsInput, 'Airport lounge access');

      expect(benefitsInput).toHaveValue('Airport lounge access');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with required fields', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, 'Chase Freedom');

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, 'Chase');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            cardName: 'Chase Freedom',
            issuer: 'Chase',
            rewardsType: 'cashback',
            annualFee: 0,
          })
        );
      });
    });

    it('should include all optional fields when provided', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, 'Amex Gold');

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, 'American Express');

      const last4Input = container.querySelector('#card-last4') as HTMLInputElement;
      await user.type(last4Input, '5678');

      const limitInput = container.querySelector('#card-limit') as HTMLInputElement;
      await user.type(limitInput, '25000');

      const aprInput = container.querySelector('#card-apr') as HTMLInputElement;
      await user.type(aprInput, '19.99');

      const feeInput = container.querySelector('#card-fee') as HTMLInputElement;
      await user.clear(feeInput);
      await user.type(feeInput, '250');

      const rewardsSelect = container.querySelector('#card-rewards') as HTMLSelectElement;
      await user.selectOptions(rewardsSelect, 'points');

      const rateInput = container.querySelector('#card-rate') as HTMLInputElement;
      await user.type(rateInput, '4');

      const bonusInput = container.querySelector('#card-bonus') as HTMLInputElement;
      await user.type(bonusInput, '60000');

      const bonusReqInput = container.querySelector('#card-bonus-req') as HTMLInputElement;
      await user.type(bonusReqInput, '4000');

      const deadlineInput = container.querySelector('#card-bonus-deadline') as HTMLInputElement;
      await user.type(deadlineInput, '2026-06-30');

      const benefitsInput = container.querySelector('#card-benefits') as HTMLTextAreaElement;
      await user.type(benefitsInput, 'Dining credits, Airport lounge');

      const notesInput = container.querySelector('#card-notes') as HTMLTextAreaElement;
      await user.type(notesInput, 'Great for dining');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            cardName: 'Amex Gold',
            issuer: 'American Express',
            last4Digits: '5678',
            creditLimit: 25000,
            apr: 19.99,
            annualFee: 250,
            rewardsType: 'points',
            rewardsRate: 4,
            signUpBonus: 60000,
            signUpBonusRequirement: 4000,
            bonusDeadline: '2026-06-30',
            benefits: 'Dining credits, Airport lounge',
            notes: 'Great for dining',
          })
        );
      });
    });
  });

  describe('Validation', () => {
    it('should require card name', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, 'Chase');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should require issuer', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, 'Test Card');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle last 4 digits with non-numeric characters', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const last4Input = container.querySelector('#card-last4') as HTMLInputElement;
      // Component strips non-digits via onChange
      await user.type(last4Input, 'abc1234xyz');

      // Should only keep digits
      expect(last4Input.value).toMatch(/^\d*$/);
    });

    it('should handle zero annual fee', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, 'No Fee Card');

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, 'Chase');

      const feeInput = container.querySelector('#card-fee') as HTMLInputElement;
      expect(feeInput).toHaveValue(0);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            annualFee: 0,
          })
        );
      });
    });

    it('should trim whitespace from text inputs', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, '  Chase Sapphire  ');

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, '  Chase  ');

      const benefitsInput = container.querySelector('#card-benefits') as HTMLTextAreaElement;
      await user.type(benefitsInput, '  Travel benefits  ');

      const notesInput = container.querySelector('#card-notes') as HTMLTextAreaElement;
      await user.type(notesInput, '  Great card  ');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            cardName: 'Chase Sapphire',
            issuer: 'Chase',
            benefits: 'Travel benefits',
            notes: 'Great card',
          })
        );
      });
    });

    it('should handle decimal values for financial fields', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, 'Test Card');

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, 'Test');

      const limitInput = container.querySelector('#card-limit') as HTMLInputElement;
      await user.type(limitInput, '5000.50');

      const aprInput = container.querySelector('#card-apr') as HTMLInputElement;
      await user.type(aprInput, '18.99');

      const feeInput = container.querySelector('#card-fee') as HTMLInputElement;
      await user.clear(feeInput);
      await user.type(feeInput, '95.50');

      const rateInput = container.querySelector('#card-rate') as HTMLInputElement;
      await user.type(rateInput, '1.5');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            creditLimit: 5000.50,
            apr: 18.99,
            annualFee: 95.50,
            rewardsRate: 1.5,
          })
        );
      });
    });

    it('should handle large sign-up bonus values', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreditCardFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#card-name') as HTMLInputElement;
      await user.type(nameInput, 'Premium Card');

      const issuerInput = container.querySelector('#card-issuer') as HTMLInputElement;
      await user.type(issuerInput, 'Amex');

      const bonusInput = container.querySelector('#card-bonus') as HTMLInputElement;
      await user.type(bonusInput, '150000');

      const bonusReqInput = container.querySelector('#card-bonus-req') as HTMLInputElement;
      await user.type(bonusReqInput, '15000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            signUpBonus: 150000,
            signUpBonusRequirement: 15000,
          })
        );
      });
    });
  });
});
