import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PantryTable } from '../PantryTable';
import type { PantryItem } from '@/types';

describe('PantryTable', () => {
  const mockItems: PantryItem[] = [
    {
      id: '1',
      name: 'Milk',
      quantity: 1,
      unit: 'L',
      category: 'dairy',
      isLowStock: true,
      lowStockThreshold: 2,
      expirationDate: new Date('2025-12-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Bread',
      quantity: 2,
      unit: 'loaf',
      category: 'bakery',
      isLowStock: false,
      expirationDate: new Date('2024-01-01'), // Expired
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockEditData = {
    qty: '1',
    unit: 'L',
    exp: '2025-12-01',
    low: true,
    threshold: '2',
  };

  const defaultProps = {
    items: mockItems,
    editingItemId: null,
    editData: mockEditData,
    replenishId: null,
    onEditChange: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onStartEdit: vi.fn(),
    onStartReplenish: vi.fn(),
    onReplenish: vi.fn(),
    onCancelReplenish: vi.fn(),
    onAddToShopping: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state when no items', () => {
      render(<PantryTable {...defaultProps} items={[]} />);

      expect(screen.getByText('No pantry items yet.')).toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('renders table headers', () => {
      render(<PantryTable {...defaultProps} />);

      expect(screen.getByText('Item')).toBeInTheDocument();
      expect(screen.getByText('Qty')).toBeInTheDocument();
      expect(screen.getByText('Expires')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Low stock')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders all items', () => {
      render(<PantryTable {...defaultProps} />);

      expect(screen.getByText('Milk')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    it('displays quantity with unit', () => {
      render(<PantryTable {...defaultProps} />);

      expect(screen.getByText(/1 L/)).toBeInTheDocument();
      expect(screen.getByText(/2 loaf/)).toBeInTheDocument();
    });

    it('shows expiration status for expired items', () => {
      render(<PantryTable {...defaultProps} />);

      const expiredElements = screen.getAllByText('Expired');
      expect(expiredElements.length).toBeGreaterThan(0);
    });

    it('shows low stock indicator', () => {
      render(<PantryTable {...defaultProps} />);

      expect(screen.getByText(/Yes \(2\)/)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('calls onStartEdit when Edit button is clicked', () => {
      render(<PantryTable {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(defaultProps.onStartEdit).toHaveBeenCalledWith(mockItems[0]);
    });

    it('calls onStartReplenish when Replenish button is clicked', () => {
      render(<PantryTable {...defaultProps} />);

      const replenishButtons = screen.getAllByText('Replenish');
      fireEvent.click(replenishButtons[0]);

      expect(defaultProps.onStartReplenish).toHaveBeenCalledWith('1');
    });

    it('calls onAddToShopping when Add to Shopping button is clicked', () => {
      render(<PantryTable {...defaultProps} />);

      const addButtons = screen.getAllByText('Add to Shopping');
      fireEvent.click(addButtons[0]);

      expect(defaultProps.onAddToShopping).toHaveBeenCalledWith(mockItems[0]);
    });

    it('calls onDelete when Delete button is clicked', () => {
      render(<PantryTable {...defaultProps} />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('Editing Mode', () => {
    it('shows edit inputs when item is being edited', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      // Should show input fields for editing
      const qtyInput = screen.getByDisplayValue('1');
      const unitInput = screen.getByDisplayValue('L');

      expect(qtyInput).toBeInTheDocument();
      expect(unitInput).toBeInTheDocument();
    });

    it('calls onEditChange when quantity input changes', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      const qtyInput = screen.getByDisplayValue('1');
      fireEvent.change(qtyInput, { target: { value: '5' } });

      expect(defaultProps.onEditChange).toHaveBeenCalledWith({ qty: '5' });
    });

    it('calls onEditChange when unit input changes', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      const unitInput = screen.getByDisplayValue('L');
      fireEvent.change(unitInput, { target: { value: 'ml' } });

      expect(defaultProps.onEditChange).toHaveBeenCalledWith({ unit: 'ml' });
    });

    it('calls onEditChange when expiration date changes', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      const dateInput = screen.getByDisplayValue('2025-12-01');
      fireEvent.change(dateInput, { target: { value: '2025-12-31' } });

      expect(defaultProps.onEditChange).toHaveBeenCalledWith({ exp: '2025-12-31' });
    });

    it('calls onEditChange when low stock checkbox changes', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(defaultProps.onEditChange).toHaveBeenCalledWith({ low: false });
    });

    it('calls onEditChange when threshold changes', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      const thresholdInput = screen.getByDisplayValue('2');
      fireEvent.change(thresholdInput, { target: { value: '5' } });

      expect(defaultProps.onEditChange).toHaveBeenCalledWith({ threshold: '5' });
    });

    it('calls onSaveEdit when Save button is clicked', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(defaultProps.onSaveEdit).toHaveBeenCalledWith('1');
    });

    it('calls onCancelEdit when Cancel button is clicked', () => {
      render(<PantryTable {...defaultProps} editingItemId="1" />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(defaultProps.onCancelEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Replenish Modal', () => {
    it('shows replenish modal when replenishId matches item', () => {
      render(<PantryTable {...defaultProps} replenishId="1" />);

      // The ReplenishModal component should be rendered inline
      // We can check for elements that would be in the modal
      expect(screen.getByText(/Replenish Milk to target quantity/)).toBeInTheDocument();
    });

    it('does not show replenish modal when replenishId is null', () => {
      const { container } = render(<PantryTable {...defaultProps} replenishId={null} />);

      // Should not have the modal inline row
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockItems.length);
    });
  });

  describe('Status Display', () => {
    it('shows "Fresh" status for items expiring in more than 7 days', () => {
      const futureItem: PantryItem = {
        id: '3',
        name: 'Fresh Item',
        quantity: 1,
        unit: 'pcs',
        category: 'other',
        isLowStock: false,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<PantryTable {...defaultProps} items={[futureItem]} />);

      expect(screen.getByText(/Fresh \(\d+d\)/)).toBeInTheDocument();
    });

    it('shows "Expires in" status for items expiring within 7 days', () => {
      const soonExpiringItem: PantryItem = {
        id: '3',
        name: 'Soon Expiring',
        quantity: 1,
        unit: 'pcs',
        category: 'other',
        isLowStock: false,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<PantryTable {...defaultProps} items={[soonExpiringItem]} />);

      expect(screen.getByText(/Expires in/)).toBeInTheDocument();
    });

    it('shows dash when no expiration date', () => {
      const noExpiryItem: PantryItem = {
        id: '3',
        name: 'No Expiry',
        quantity: 1,
        unit: 'pcs',
        category: 'other',
        isLowStock: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<PantryTable {...defaultProps} items={[noExpiryItem]} />);

      const statusCells = screen.getAllByText('—');
      expect(statusCells.length).toBeGreaterThan(0);
    });
  });

  describe('Low Stock Display', () => {
    it('shows "No" when item is not low stock', () => {
      render(<PantryTable {...defaultProps} />);

      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('shows threshold value when item is low stock', () => {
      render(<PantryTable {...defaultProps} />);

      expect(screen.getByText(/Yes \(2\)/)).toBeInTheDocument();
    });
  });
});
