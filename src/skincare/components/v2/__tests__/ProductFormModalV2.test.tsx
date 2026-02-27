/**
 * Unit tests for ProductFormModalV2 component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFormModalV2 } from '../ProductFormModalV2';
import React from 'react';

vi.mock('@/components/v2', () => ({
  FormModalV2: ({ children, defaultData, initialData, onSubmit, validate, isOpen, title, submitText }: any) => {
    const [formState, setFormState] = React.useState(initialData || defaultData);
    if (!isOpen) return null;

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
          <button type="submit">{submitText || 'Submit'}</button>
        </form>
      </div>
    );
  },
}));

describe('ProductFormModalV2', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ProductFormModalV2 {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Product" title in add mode', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'Add Product' })).toBeInTheDocument();
    });

    it('should show "Edit Product" title in edit mode', () => {
      render(<ProductFormModalV2 {...defaultProps} isEditing={true} />);
      expect(screen.getByRole('heading', { name: 'Edit Product' })).toBeInTheDocument();
    });

    it('should show "Add Product" submit button in add mode', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Add Product' })).toBeInTheDocument();
    });

    it('should show "Update Product" submit button in edit mode', () => {
      render(<ProductFormModalV2 {...defaultProps} isEditing={true} />);
      expect(screen.getByRole('button', { name: 'Update Product' })).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render product name input', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByPlaceholderText(/hydrating face cream/i)).toBeInTheDocument();
    });

    it('should render brand input', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByPlaceholderText(/cerave, the ordinary/i)).toBeInTheDocument();
    });

    it('should render use frequency input', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByPlaceholderText(/daily am, 2x per week/i)).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByPlaceholderText(/add any notes about this product/i)).toBeInTheDocument();
    });

    it('should render purchase date input', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByText('Purchase Date')).toBeInTheDocument();
    });

    it('should render expiry date input', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByText('Expiry Date')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should render all 8 category buttons', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByText('Cleanser')).toBeInTheDocument();
      expect(screen.getByText('Toner')).toBeInTheDocument();
      expect(screen.getByText('Serum')).toBeInTheDocument();
      expect(screen.getByText('Moisturizer')).toBeInTheDocument();
      expect(screen.getByText('Sunscreen')).toBeInTheDocument();
      expect(screen.getByText('Mask')).toBeInTheDocument();
      expect(screen.getByText('Exfoliant')).toBeInTheDocument();
      expect(screen.getByText('Eye Cream')).toBeInTheDocument();
    });

    it('should render category emojis', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByText('🧼')).toBeInTheDocument(); // Cleanser
      expect(screen.getByText('💧')).toBeInTheDocument(); // Toner
      expect(screen.getByText('✨')).toBeInTheDocument(); // Serum
      expect(screen.getByText('🧴')).toBeInTheDocument(); // Moisturizer
      expect(screen.getByText('☀️')).toBeInTheDocument(); // Sunscreen
      expect(screen.getByText('🎭')).toBeInTheDocument(); // Mask
      expect(screen.getByText('🔄')).toBeInTheDocument(); // Exfoliant
      expect(screen.getByText('👁️')).toBeInTheDocument(); // Eye Cream
    });

    it('should default to cleanser category', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      const cleanserButton = screen.getByText('Cleanser').closest('button');
      expect(cleanserButton?.className).toContain('bg-terracotta-100');
    });

    it('should select moisturizer category when clicked', async () => {
      const user = userEvent.setup();
      render(<ProductFormModalV2 {...defaultProps} />);

      await user.click(screen.getByText('Moisturizer'));

      const moisturizerButton = screen.getByText('Moisturizer').closest('button');
      expect(moisturizerButton?.className).toContain('bg-terracotta-100');
    });

    it('should deselect previous category when new one selected', async () => {
      const user = userEvent.setup();
      render(<ProductFormModalV2 {...defaultProps} />);

      await user.click(screen.getByText('Serum'));

      const cleanserButton = screen.getByText('Cleanser').closest('button');
      expect(cleanserButton?.className).not.toContain('bg-terracotta-100');
    });
  });

  describe('Star Rating', () => {
    it('should render 5 star buttons', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      const starButtons = screen.getAllByRole('button', { name: /rate \d star/i });
      expect(starButtons).toHaveLength(5);
    });

    it('should have aria-labels for each star', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByLabelText('Rate 1 star')).toBeInTheDocument();
      expect(screen.getByLabelText('Rate 2 stars')).toBeInTheDocument();
      expect(screen.getByLabelText('Rate 3 stars')).toBeInTheDocument();
      expect(screen.getByLabelText('Rate 4 stars')).toBeInTheDocument();
      expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
    });

    it('should select rating when star clicked', async () => {
      const user = userEvent.setup();
      render(<ProductFormModalV2 {...defaultProps} />);

      await user.click(screen.getByLabelText('Rate 4 stars'));

      // Star button should now be terracotta colored (browser converts to rgb)
      const star4 = screen.getByLabelText('Rate 4 stars');
      expect(star4.style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
    });

    it('should color all stars up to selected rating', async () => {
      const user = userEvent.setup();
      render(<ProductFormModalV2 {...defaultProps} />);

      await user.click(screen.getByLabelText('Rate 3 stars'));

      // Stars 1, 2, 3 should be terracotta (browser converts hex to rgb)
      expect(screen.getByLabelText('Rate 1 star').style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
      expect(screen.getByLabelText('Rate 2 stars').style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
      expect(screen.getByLabelText('Rate 3 stars').style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
      // Stars 4, 5 should be unselected (light color)
      expect(screen.getByLabelText('Rate 4 stars').style.color).toMatch(/rgb\(232, 220, 200\)|#E8DCC8/i);
      expect(screen.getByLabelText('Rate 5 stars').style.color).toMatch(/rgb\(232, 220, 200\)|#E8DCC8/i);
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with trimmed name and brand', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), '  Vitamin C Serum  ');
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), '  The Ordinary  ');

      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Vitamin C Serum',
          brand: 'The Ordinary',
        })
      );
    });

    it('should submit with selected category', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), 'Test Product');
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), 'Test Brand');
      await user.click(screen.getByText('Serum'));

      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'serum' })
      );
    });

    it('should submit with rating', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), 'Test Product');
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), 'Test Brand');
      await user.click(screen.getByLabelText('Rate 4 stars'));

      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 4 })
      );
    });

    it('should submit notes', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), 'Test Product');
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), 'Test Brand');
      await user.type(screen.getByPlaceholderText(/add any notes/i), 'Great for dry skin');

      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Great for dry skin' })
      );
    });
  });

  describe('Validation', () => {
    it('should require product name', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn();
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      // Fill only brand (skip name)
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), 'Test Brand');
      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    it('should require brand', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn();
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      // Fill only name (skip brand)
      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), 'Test Product');
      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    it('should allow submission with only name and brand', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), 'Test Product');
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), 'Test Brand');
      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with existing product data', () => {
      const product = {
        id: 'product-1',
        name: 'Vitamin C Serum',
        brand: 'The Ordinary',
        category: 'serum',
        rating: 4,
        useFrequency: 'Daily AM',
        notes: 'Best serum ever',
      };

      render(<ProductFormModalV2 {...defaultProps} product={product} isEditing={true} />);

      expect(screen.getByDisplayValue('Vitamin C Serum')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Ordinary')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Daily AM')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Best serum ever')).toBeInTheDocument();
    });

    it('should show selected category in edit mode', () => {
      const product = {
        id: 'product-1',
        name: 'Test',
        brand: 'Brand',
        category: 'moisturizer',
      };

      render(<ProductFormModalV2 {...defaultProps} product={product} isEditing={true} />);

      const moisturizerButton = screen.getByText('Moisturizer').closest('button');
      expect(moisturizerButton?.className).toContain('bg-terracotta-100');
    });

    it('should show selected rating in edit mode', () => {
      const product = {
        id: 'product-1',
        name: 'Test',
        brand: 'Brand',
        category: 'cleanser',
        rating: 3,
      };

      render(<ProductFormModalV2 {...defaultProps} product={product} isEditing={true} />);

      // First 3 stars should be terracotta (browser converts hex to rgb)
      expect(screen.getByLabelText('Rate 1 star').style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
      expect(screen.getByLabelText('Rate 2 stars').style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
      expect(screen.getByLabelText('Rate 3 stars').style.color).toMatch(/rgb\(212, 165, 116\)|#D4A574/i);
      expect(screen.getByLabelText('Rate 4 stars').style.color).toMatch(/rgb\(232, 220, 200\)|#E8DCC8/i);
    });
  });

  describe('Required Field Labels', () => {
    it('should mark product name as required', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByText('Product Name')).toBeInTheDocument();
      // Check for required asterisk
      expect(screen.getAllByText('*').length).toBeGreaterThan(0);
    });

    it('should mark brand as required', () => {
      render(<ProductFormModalV2 {...defaultProps} />);
      expect(screen.getByText('Brand')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all optional fields empty', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), 'Test');
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), 'Brand');

      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test',
          brand: 'Brand',
          useFrequency: undefined,
          notes: undefined,
        })
      );
    });

    it('should handle whitespace-only name as invalid', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn();
      render(<ProductFormModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText(/hydrating face cream/i), '   ');
      await user.type(screen.getByPlaceholderText(/cerave, the ordinary/i), 'Brand');

      await user.click(screen.getByRole('button', { name: 'Add Product' }));

      expect(onSubmitMock).not.toHaveBeenCalled();
    });
  });
});
