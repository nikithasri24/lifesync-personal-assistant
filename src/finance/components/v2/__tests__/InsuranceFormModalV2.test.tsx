/**
 * Unit tests for InsuranceFormModalV2 component
 * Tests insurance policy creation/editing form with 10 policy types and premium frequencies
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsuranceFormModalV2 } from '../InsuranceFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, title, children, onSubmit, validate }: any) => {
    if (!isOpen) return null;

    const [formState, setFormState] = React.useState({
      policyName: '',
      policyType: 'health',
      provider: '',
      policyNumber: '',
      coverageAmount: '',
      premium: '',
      premiumFrequency: 'monthly',
      deductible: '',
      renewalDate: '',
      beneficiaries: '',
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

describe('InsuranceFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <InsuranceFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Insurance Policy" title when creating', () => {
      render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add Insurance Policy')).toBeInTheDocument();
    });

    it('should show "Edit Insurance Policy" title when editing', () => {
      render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialData={{ policyName: 'Health Plan' }}
        />
      );

      expect(screen.getByText('Edit Insurance Policy')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(container.querySelector('#policy-name')).toBeInTheDocument();
      expect(container.querySelector('#policy-type')).toBeInTheDocument();
      expect(container.querySelector('#policy-provider')).toBeInTheDocument();
      expect(container.querySelector('#policy-number')).toBeInTheDocument();
      expect(container.querySelector('#policy-coverage')).toBeInTheDocument();
      expect(container.querySelector('#policy-premium')).toBeInTheDocument();
      expect(container.querySelector('#policy-frequency')).toBeInTheDocument();
      expect(container.querySelector('#policy-deductible')).toBeInTheDocument();
      expect(container.querySelector('#policy-renewal')).toBeInTheDocument();
      expect(container.querySelector('#policy-beneficiaries')).toBeInTheDocument();
      expect(container.querySelector('#policy-notes')).toBeInTheDocument();
    });
  });

  describe('Policy Types', () => {
    const policyTypes = [
      'Health Insurance',
      'Life Insurance',
      'Auto Insurance',
      'Home Insurance',
      'Renters Insurance',
      'Disability Insurance',
      'Dental Insurance',
      'Vision Insurance',
      'Umbrella Insurance',
      'Other',
    ];

    it('should list all 10 policy types', () => {
      render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      policyTypes.forEach((type) => {
        expect(screen.getByText(new RegExp(type, 'i'))).toBeInTheDocument();
      });
    });

    it('should default to "Health Insurance" type', () => {
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const typeSelect = container.querySelector('#policy-type') as HTMLSelectElement;
      expect(typeSelect.value).toBe('health');
    });
  });

  describe('Premium Frequencies', () => {
    const frequencies = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];

    it('should list all 4 premium frequencies', () => {
      render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      frequencies.forEach((freq) => {
        expect(screen.getByText(freq)).toBeInTheDocument();
      });
    });

    it('should default to "Monthly" frequency', () => {
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const freqSelect = container.querySelector('#policy-frequency') as HTMLSelectElement;
      expect(freqSelect.value).toBe('monthly');
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering policy name', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Family Health Plan');

      expect(nameInput).toHaveValue('Family Health Plan');
    });

    it('should allow selecting policy type', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const typeSelect = container.querySelector('#policy-type') as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'life');

      expect(typeSelect).toHaveValue('life');
    });

    it('should allow entering provider', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'Blue Cross Blue Shield');

      expect(providerInput).toHaveValue('Blue Cross Blue Shield');
    });

    it('should allow entering premium', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '250.50');

      expect(premiumInput).toHaveValue(250.50);
    });

    it('should allow selecting premium frequency', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const freqSelect = container.querySelector('#policy-frequency') as HTMLSelectElement;
      await user.selectOptions(freqSelect, 'annual');

      expect(freqSelect).toHaveValue('annual');
    });

    it('should allow entering beneficiaries', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const beneficiariesInput = container.querySelector('#policy-beneficiaries') as HTMLInputElement;
      await user.type(beneficiariesInput, 'Spouse, Children');

      expect(beneficiariesInput).toHaveValue('Spouse, Children');
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesInput = container.querySelector('#policy-notes') as HTMLTextAreaElement;
      await user.type(notesInput, 'Comprehensive coverage');

      expect(notesInput).toHaveValue('Comprehensive coverage');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with required fields', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Auto Policy');

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'State Farm');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '150');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            policyName: 'Auto Policy',
            provider: 'State Farm',
            premium: 150,
            policyType: 'health',
            premiumFrequency: 'monthly',
          })
        );
      });
    });

    it('should include all optional fields when provided', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Life Insurance');

      const typeSelect = container.querySelector('#policy-type') as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'life');

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'MetLife');

      const policyNumberInput = container.querySelector('#policy-number') as HTMLInputElement;
      await user.type(policyNumberInput, 'POL-123456');

      const coverageInput = container.querySelector('#policy-coverage') as HTMLInputElement;
      await user.type(coverageInput, '500000');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '100');

      const freqSelect = container.querySelector('#policy-frequency') as HTMLSelectElement;
      await user.selectOptions(freqSelect, 'annual');

      const deductibleInput = container.querySelector('#policy-deductible') as HTMLInputElement;
      await user.type(deductibleInput, '500');

      const renewalInput = container.querySelector('#policy-renewal') as HTMLInputElement;
      await user.type(renewalInput, '2027-01-01');

      const beneficiariesInput = container.querySelector('#policy-beneficiaries') as HTMLInputElement;
      await user.type(beneficiariesInput, 'Spouse');

      const notesInput = container.querySelector('#policy-notes') as HTMLTextAreaElement;
      await user.type(notesInput, 'Term life insurance');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            policyName: 'Life Insurance',
            policyType: 'life',
            provider: 'MetLife',
            policyNumber: 'POL-123456',
            coverageAmount: 500000,
            premium: 100,
            premiumFrequency: 'annual',
            deductible: 500,
            renewalDate: '2027-01-01',
            beneficiaries: 'Spouse',
            notes: 'Term life insurance',
          })
        );
      });
    });
  });

  describe('Validation', () => {
    it('should require policy name', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'Test Provider');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '100');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should require provider', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Test Policy');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '100');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should require premium greater than 0', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Test Policy');

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'Test Provider');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '0');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large coverage amounts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Life Insurance');

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'Provider');

      const coverageInput = container.querySelector('#policy-coverage') as HTMLInputElement;
      await user.type(coverageInput, '10000000');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '1000');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            coverageAmount: 10000000,
          })
        );
      });
    });

    it('should trim whitespace from text inputs', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, '  Health Plan  ');

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, '  BlueCross  ');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '200');

      const beneficiariesInput = container.querySelector('#policy-beneficiaries') as HTMLInputElement;
      await user.type(beneficiariesInput, '  Spouse  ');

      const notesInput = container.querySelector('#policy-notes') as HTMLTextAreaElement;
      await user.type(notesInput, '  Good coverage  ');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            policyName: 'Health Plan',
            provider: 'BlueCross',
            beneficiaries: 'Spouse',
            notes: 'Good coverage',
          })
        );
      });
    });

    it('should handle decimal values for financial fields', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Test Policy');

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'Provider');

      const coverageInput = container.querySelector('#policy-coverage') as HTMLInputElement;
      await user.type(coverageInput, '250000.50');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '125.75');

      const deductibleInput = container.querySelector('#policy-deductible') as HTMLInputElement;
      await user.type(deductibleInput, '500.25');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            coverageAmount: 250000.50,
            premium: 125.75,
            deductible: 500.25,
          })
        );
      });
    });

    it('should handle policy number with special characters', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InsuranceFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = container.querySelector('#policy-name') as HTMLInputElement;
      await user.type(nameInput, 'Test');

      const providerInput = container.querySelector('#policy-provider') as HTMLInputElement;
      await user.type(providerInput, 'Provider');

      const policyNumberInput = container.querySelector('#policy-number') as HTMLInputElement;
      await user.type(policyNumberInput, 'POL-2024-ABC-123');

      const premiumInput = container.querySelector('#policy-premium') as HTMLInputElement;
      await user.type(premiumInput, '100');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            policyNumber: 'POL-2024-ABC-123',
          })
        );
      });
    });
  });
});
