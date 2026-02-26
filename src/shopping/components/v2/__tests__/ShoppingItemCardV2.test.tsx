/**
 * Unit tests for ShoppingItemCardV2 component
 * Tests rendering, interactions, and display logic
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingItemCardV2 } from '../ShoppingItemCardV2';
import type { ShoppingItem, Store } from '../../../types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
    ios: { lightGray: '#C7C7CC' },
  }),
}));

vi.mock('@/components/v2/CheckboxV2', () => ({
  CheckboxV2: ({ checked, onChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      data-testid="checkbox"
    />
  ),
}));

vi.mock('@/components/v2/BadgeV2', () => ({
  BadgeV2: ({ text, variant }: any) => (
    <span data-testid={`badge-${variant}`}>{text}</span>
  ),
}));

describe('ShoppingItemCardV2', () => {
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
    {
      id: 'store-2',
      name: 'Trader Joes',
      type: 'grocery',
      color: '#D50032',
      preferences: {
        priceRating: 4,
        qualityRating: 4,
        cleanlinessRating: 4,
        serviceRating: 5,
        overallRating: 4,
      },
      specialties: ['prepared foods'],
      bestFor: ['snacks'],
      avgPrices: {},
      favorite: true,
    },
  ];

  const mockItem: ShoppingItem = {
    id: 'item-1',
    name: 'Bananas',
    quantity: 6,
    unit: 'pieces',
    category: 'produce',
    priority: 'medium',
    purchased: false,
    estimatedPrice: 3.99,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockOnToggle = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render item name', () => {
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Bananas')).toBeInTheDocument();
    });

    it('should render quantity and unit', () => {
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/6 pieces/i)).toBeInTheDocument();
    });

    it('should render category emoji', () => {
      const { container } = render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      // Category icon should be present (🍎 for produce)
      const emoji = container.querySelector('span[aria-hidden="true"]');
      expect(emoji).toBeInTheDocument();
    });

    it('should render checkbox', () => {
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });

    it('should render chevron icon', () => {
      const { container } = render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      const chevron = container.querySelector('svg[aria-hidden="true"]');
      expect(chevron).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('should display estimated price when present', () => {
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('$3.99')).toBeInTheDocument();
    });

    it('should not display price when not present', () => {
      const itemWithoutPrice = { ...mockItem, estimatedPrice: undefined };
      render(
        <ShoppingItemCardV2
          item={itemWithoutPrice}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('should not display price when zero', () => {
      const itemWithZeroPrice = { ...mockItem, estimatedPrice: 0 };
      render(
        <ShoppingItemCardV2
          item={itemWithZeroPrice}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe('Store Display', () => {
    it('should display assigned store', () => {
      const itemWithStore = { ...mockItem, assignedStore: 'store-1' };
      render(
        <ShoppingItemCardV2
          item={itemWithStore}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Whole Foods')).toBeInTheDocument();
    });

    it('should display best store when no assigned store', () => {
      const itemWithBestStore = { ...mockItem, bestStores: ['store-2'] };
      render(
        <ShoppingItemCardV2
          item={itemWithBestStore}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Trader Joes')).toBeInTheDocument();
    });

    it('should prefer assigned store over best store', () => {
      const itemWithBothStores = {
        ...mockItem,
        assignedStore: 'store-1',
        bestStores: ['store-2'],
      };
      render(
        <ShoppingItemCardV2
          item={itemWithBothStores}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Whole Foods')).toBeInTheDocument();
      expect(screen.queryByText('Trader Joes')).not.toBeInTheDocument();
    });

    it('should not display store when none assigned', () => {
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByTestId('badge-accent')).not.toBeInTheDocument();
    });
  });

  describe('Purchased State', () => {
    it('should show line-through when purchased', () => {
      const purchasedItem = { ...mockItem, purchased: true };
      const { container } = render(
        <ShoppingItemCardV2
          item={purchasedItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      const itemName = screen.getByText('Bananas');
      expect(itemName.className).toContain('line-through');
    });

    it('should not show line-through when not purchased', () => {
      const { container } = render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      const itemName = screen.getByText('Bananas');
      expect(itemName.className).not.toContain('line-through');
    });

    it('should pass purchased state to checkbox', () => {
      const purchasedItem = { ...mockItem, purchased: true };
      render(
        <ShoppingItemCardV2
          item={purchasedItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      const checkbox = screen.getByTestId('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Owner Badge', () => {
    it('should show owner name when item is from partner', () => {
      const partnerItem = {
        ...mockItem,
        ownerName: 'Sarah',
        isOwnedByCurrentUser: false,
      };
      render(
        <ShoppingItemCardV2
          item={partnerItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Sarah')).toBeInTheDocument();
      expect(screen.getByTestId('badge-success')).toBeInTheDocument();
    });

    it('should not show owner badge for current user items', () => {
      const ownItem = {
        ...mockItem,
        ownerName: 'Me',
        isOwnedByCurrentUser: true,
      };
      render(
        <ShoppingItemCardV2
          item={ownItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByTestId('badge-success')).not.toBeInTheDocument();
    });

    it('should not show owner badge when no owner', () => {
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByTestId('badge-success')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onEdit when card is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      await user.click(screen.getByText('Bananas'));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      await user.click(screen.getByTestId('checkbox'));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should not call onEdit when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      await user.click(screen.getByTestId('checkbox'));
      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ShoppingItemCardV2
          item={mockItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          className="custom-class"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });
  });

  describe('Different Categories', () => {
    it.each([
      ['produce', 'Apples'],
      ['dairy', 'Milk'],
      ['meat', 'Chicken'],
      ['pantry', 'Rice'],
      ['frozen', 'Ice Cream'],
    ])('should render %s category correctly', (category, name) => {
      const categoryItem = {
        ...mockItem,
        name,
        category: category as ShoppingItem['category'],
      };
      render(
        <ShoppingItemCardV2
          item={categoryItem}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing unit', () => {
      const itemWithoutUnit = { ...mockItem, unit: undefined };
      render(
        <ShoppingItemCardV2
          item={itemWithoutUnit}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      // Should show quantity without unit
      expect(screen.getByText(/6/)).toBeInTheDocument();
    });

    it('should handle store not found', () => {
      const itemWithInvalidStore = { ...mockItem, assignedStore: 'store-999' };
      render(
        <ShoppingItemCardV2
          item={itemWithInvalidStore}
          stores={mockStores}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      // Should not crash and not show store badge
      expect(screen.queryByTestId('badge-accent')).not.toBeInTheDocument();
    });

    it('should handle empty stores array', () => {
      const itemWithStore = { ...mockItem, assignedStore: 'store-1' };
      render(
        <ShoppingItemCardV2
          item={itemWithStore}
          stores={[]}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
        />
      );

      // Should not crash and not show store badge
      expect(screen.queryByTestId('badge-accent')).not.toBeInTheDocument();
    });
  });
});
