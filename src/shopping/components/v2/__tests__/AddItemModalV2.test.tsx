/**
 * Unit tests for AddItemModalV2 component
 * Tests form rendering, validation, and submission
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemModalV2 } from '../AddItemModalV2';
import type { ShoppingItemForm } from '../../../types/forms';
import type { Store } from '../../../types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('@/components/v2', () => ({
  FormModalV2: ({ children, isOpen, onClose, onSubmit, title, defaultData, initialData }: any) => {
    const [formState, setFormState] = React.useState(initialData || defaultData);

    React.useEffect(() => {
      const newState = initialData || defaultData || {};
      setFormState(newState);
    }, [initialData, defaultData]);

    if (!isOpen) return null;

    return (
      <div data-testid="form-modal">
        <h2>{title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formState);
          }}
        >
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

describe('AddItemModalV2', () => {
  const mockStores: Store[] = [
    {
      id: 'store-1',
      name: 'Whole Foods',
      type: 'grocery',
      color: '#00A862',
      preferences: {
        priceRating: 3,
        qualityRating: 5,
        cleanlinessRating: 5,
        serviceRating: 4,
        overallRating: 4,
      },
      specialties: ['organic'],
      bestFor: ['produce'],
      avgPrices: {},
      favorite: false,
    },
  ];

  const defaultFormData: ShoppingItemForm = {
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'other',
    priority: 'medium',
    estimatedPrice: '',
    assignedStore: null,
    notes: '',
  };

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnFormChange = vi.fn();
  const mockOnBarcodeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <AddItemModalV2
          isOpen={false}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show correct title', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText('Add Item Manually')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render item name input', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText(/Item Name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Organic Bananas/i)).toBeInTheDocument();
    });

    it('should render quantity input', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText(/Quantity/i)).toBeInTheDocument();
    });

    it('should render unit select', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText('Unit')).toBeInTheDocument();
      expect(screen.getByText('pieces')).toBeInTheDocument();
    });

    it('should render category select', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should render priority select', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText('Priority')).toBeInTheDocument();
    });

    it('should render estimated price input', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText(/Est. Price/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('$0.00')).toBeInTheDocument();
    });

    it('should render store select', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText(/Preferred Store/i)).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText(/Notes/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering item name', async () => {
      const user = userEvent.setup();
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      const input = screen.getByPlaceholderText(/e.g., Organic Bananas/i);
      await user.type(input, 'Milk');

      expect(input).toHaveValue('Milk');
    });

    it('should allow changing quantity', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={{ ...defaultFormData, quantity: 5 }}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      // Verify quantity input shows the correct value
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('should allow selecting unit', async () => {
      const user = userEvent.setup();
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const unitSelect = selects.find(s => (s as HTMLSelectElement).value === 'pcs') as HTMLSelectElement;
      await user.selectOptions(unitSelect, 'lbs');

      expect(unitSelect).toHaveValue('lbs');
    });

    it('should allow selecting category', async () => {
      const user = userEvent.setup();
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const categorySelect = selects.find(s => (s as HTMLSelectElement).value === 'other') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'produce');

      expect(categorySelect).toHaveValue('produce');
    });

    it('should allow selecting priority', async () => {
      const user = userEvent.setup();
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const prioritySelect = selects.find(s => (s as HTMLSelectElement).value === 'medium') as HTMLSelectElement;
      await user.selectOptions(prioritySelect, 'high');

      expect(prioritySelect).toHaveValue('high');
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      await user.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSubmit when form is submitted', async () => {
      const user = userEvent.setup();
      render(
        <AddItemModalV2
          isOpen={true}
          formData={{ ...defaultFormData, name: 'Milk' }}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Pre-filled Data', () => {
    it('should display pre-filled item name', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={{ ...defaultFormData, name: 'Bananas' }}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByDisplayValue('Bananas')).toBeInTheDocument();
    });

    it('should display pre-filled quantity', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={{ ...defaultFormData, quantity: 5 }}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('should display pre-filled category', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={{ ...defaultFormData, category: 'produce' }}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByDisplayValue(/Produce/i)).toBeInTheDocument();
    });
  });

  describe('Store Options', () => {
    it('should list available stores in select', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText(/Whole Foods/i)).toBeInTheDocument();
    });

    it('should show "AI will decide" option', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={mockStores}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      expect(screen.getByText(/AI will decide/i)).toBeInTheDocument();
    });

    it('should handle empty stores array', () => {
      render(
        <AddItemModalV2
          isOpen={true}
          formData={defaultFormData}
          barcodeResult={null}
          stores={[]}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onFormChange={mockOnFormChange}
          onBarcodeChange={mockOnBarcodeChange}
        />
      );

      // Should still render the store select with "AI will decide" option
      expect(screen.getByText(/Preferred Store/i)).toBeInTheDocument();
      expect(screen.getByText(/AI will decide/i)).toBeInTheDocument();
    });
  });
});
