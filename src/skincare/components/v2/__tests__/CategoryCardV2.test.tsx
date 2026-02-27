/**
 * Unit tests for CategoryCardV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCardV2 } from '../CategoryCardV2';

const mockItems = [
  { id: 'item-1', name: 'Moisturize', isActive: true, frequency: 'Daily' },
  { id: 'item-2', name: 'Exfoliate', isActive: false, frequency: 'Weekly' },
  { id: 'item-3', name: 'Face Mask', isActive: true },
];

const defaultProps = {
  id: 'cat-1',
  name: 'Skincare',
  icon: '🧴',
  items: mockItems,
  onAddItem: vi.fn(),
  onToggleItem: vi.fn(),
  onEditItem: vi.fn(),
};

describe('CategoryCardV2', () => {
  describe('Basic Rendering', () => {
    it('should render category name', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      expect(screen.getByText('Skincare')).toBeInTheDocument();
    });

    it('should render category icon', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      expect(screen.getByText('🧴')).toBeInTheDocument();
    });

    it('should render correct item count', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('should show singular "item" for one item', () => {
      render(<CategoryCardV2 {...defaultProps} items={[mockItems[0]]} />);
      expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('should show "0 items" for empty items', () => {
      render(<CategoryCardV2 {...defaultProps} items={[]} />);
      expect(screen.getByText('0 items')).toBeInTheDocument();
    });

    it('should render "+ Add" button in header', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      expect(screen.getByText('+ Add')).toBeInTheDocument();
    });
  });

  describe('Items List', () => {
    it('should render all item names', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      expect(screen.getByText('Moisturize')).toBeInTheDocument();
      expect(screen.getByText('Exfoliate')).toBeInTheDocument();
      expect(screen.getByText('Face Mask')).toBeInTheDocument();
    });

    it('should render item frequencies', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });

    it('should not render frequency when not provided', () => {
      const items = [{ id: 'item-1', name: 'Tone', isActive: true }];
      render(<CategoryCardV2 {...defaultProps} items={items} />);
      // Item should render but no frequency text
      expect(screen.getByText('Tone')).toBeInTheDocument();
    });

    it('should render edit button for each item', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons).toHaveLength(3);
    });

    it('should not render items section when items is empty', () => {
      const { container } = render(<CategoryCardV2 {...defaultProps} items={[]} />);
      const itemsSection = container.querySelector('div[style*="border-top"]');
      expect(itemsSection).not.toBeInTheDocument();
    });

    it('should render checkboxes for each item', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });
  });

  describe('Item Active State', () => {
    it('should check checkbox for active items', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // Moisturize - active
    });

    it('should uncheck checkbox for inactive items', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[1]).not.toBeChecked(); // Exfoliate - inactive
    });

    it('should apply line-through to inactive item names', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const exfoliateText = screen.getByText('Exfoliate');
      expect(exfoliateText.style.textDecoration).toBe('line-through');
    });

    it('should NOT apply line-through to active item names', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const moisturizeText = screen.getByText('Moisturize');
      expect(moisturizeText.style.textDecoration).toBe('none');
    });

    it('should show dimmed color for inactive items', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const exfoliateText = screen.getByText('Exfoliate');
      // Browser converts #9B8B7A to rgb
      expect(exfoliateText.style.color).toMatch(/rgb\(155, 139, 122\)|#9B8B7A/i);
    });

    it('should show dark color for active items', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const moisturizeText = screen.getByText('Moisturize');
      // Browser converts #5C4A3A to rgb
      expect(moisturizeText.style.color).toMatch(/rgb\(92, 74, 58\)|#5C4A3A/i);
    });
  });

  describe('Click Handlers', () => {
    it('should call onAddItem when "+ Add" is clicked', async () => {
      const user = userEvent.setup();
      const onAddMock = vi.fn();
      render(<CategoryCardV2 {...defaultProps} onAddItem={onAddMock} />);

      await user.click(screen.getByText('+ Add'));
      expect(onAddMock).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleItem with correct args when checkbox clicked', async () => {
      const user = userEvent.setup();
      const onToggleMock = vi.fn();
      render(<CategoryCardV2 {...defaultProps} onToggleItem={onToggleMock} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Click first checkbox (Moisturize, active)

      expect(onToggleMock).toHaveBeenCalledWith('item-1', true);
    });

    it('should call onToggleItem with inactive state for unchecked item', async () => {
      const user = userEvent.setup();
      const onToggleMock = vi.fn();
      render(<CategoryCardV2 {...defaultProps} onToggleItem={onToggleMock} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Click second checkbox (Exfoliate, inactive)

      expect(onToggleMock).toHaveBeenCalledWith('item-2', false);
    });

    it('should call onEditItem with correct item id when Edit clicked', async () => {
      const user = userEvent.setup();
      const onEditMock = vi.fn();
      render(<CategoryCardV2 {...defaultProps} onEditItem={onEditMock} />);

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]); // Click first Edit button

      expect(onEditMock).toHaveBeenCalledWith('item-1');
    });

    it('should call onEditItem with second item id', async () => {
      const user = userEvent.setup();
      const onEditMock = vi.fn();
      render(<CategoryCardV2 {...defaultProps} onEditItem={onEditMock} />);

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[1]);

      expect(onEditMock).toHaveBeenCalledWith('item-2');
    });
  });

  describe('Styling', () => {
    it('should have white background', () => {
      const { container } = render(<CategoryCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.background).toBe('white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<CategoryCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderRadius).toBe('16px');
    });

    it('should have box shadow', () => {
      const { container } = render(<CategoryCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.boxShadow).toContain('rgba(92, 74, 58, 0.08)');
    });

    it('should have header with terracotta gradient background', () => {
      const { container } = render(<CategoryCardV2 {...defaultProps} />);
      const header = container.querySelector('div[style*="linear-gradient"]') as HTMLElement;
      expect(header).toBeInTheDocument();
      expect(header.style.background).toContain('rgba(212, 165, 116, 0.1)');
    });

    it('icon should have 24px font size', () => {
      render(<CategoryCardV2 {...defaultProps} />);
      const icon = screen.getByText('🧴');
      expect(icon.style.fontSize).toBe('24px');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item', () => {
      const singleItem = [mockItems[0]];
      render(<CategoryCardV2 {...defaultProps} items={singleItem} />);
      expect(screen.getByText('1 item')).toBeInTheDocument();
      expect(screen.getByText('Moisturize')).toBeInTheDocument();
    });

    it('should handle many items', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        isActive: true,
      }));
      render(<CategoryCardV2 {...defaultProps} items={manyItems} />);
      expect(screen.getByText('10 items')).toBeInTheDocument();
    });

    it('should handle category with custom color', () => {
      render(<CategoryCardV2 {...defaultProps} color="#FF5733" />);
      // Component renders but color prop isn't directly applied in current implementation
      expect(screen.getByText('Skincare')).toBeInTheDocument();
    });

    it('should handle items with long names', () => {
      const longNameItem = [
        { id: 'item-1', name: 'Apply Vitamin C Serum and Hyaluronic Acid Moisturizer', isActive: true },
      ];
      render(<CategoryCardV2 {...defaultProps} items={longNameItem} />);
      expect(screen.getByText('Apply Vitamin C Serum and Hyaluronic Acid Moisturizer')).toBeInTheDocument();
    });

    it('should render different emojis correctly', () => {
      const { rerender } = render(<CategoryCardV2 {...defaultProps} icon="💆" />);
      expect(screen.getByText('💆')).toBeInTheDocument();

      rerender(<CategoryCardV2 {...defaultProps} icon="💇" />);
      expect(screen.getByText('💇')).toBeInTheDocument();
    });
  });
});
