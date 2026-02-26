/**
 * Unit tests for BucketListFormModalV2 component
 * Tests form rendering, category/priority selection, dynamic lists, and validation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BucketListFormModalV2 } from '../BucketListFormModalV2';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: ({ size, className }: any) => <div data-testid="plus-icon" data-size={size} className={className} />,
  X: ({ size }: any) => <div data-testid="x-icon" data-size={size} />,
}));

// Mock FormModalV2
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

describe('BucketListFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <BucketListFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Dream Destination" title when creating', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Add Dream Destination')).toBeInTheDocument();
    });

    it('should show "Edit Destination" title when editing', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          isEditing={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Edit Destination')).toBeInTheDocument();
    });
  });

  describe('Basic Form Fields', () => {
    it('should render destination name input', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Destination Name *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Santorini, Greece')).toBeInTheDocument();
    });

    it('should render description textarea', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What makes this destination special?')).toBeInTheDocument();
    });

    it('should render country and city inputs', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Check for inputs by placeholder instead of labels (City conflicts with category)
      expect(screen.getByPlaceholderText('Greece')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Santorini')).toBeInTheDocument();
    });

    it('should render budget and target year inputs', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Target Year')).toBeInTheDocument();
    });

    it('should render target season selector', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Best Season')).toBeInTheDocument();
    });

    it('should render inspiration URL input', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Inspiration Link')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Additional thoughts or planning notes...')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    const categories = [
      { label: 'Beach', emoji: '🏖️' },
      { label: 'Mountain', emoji: '⛰️' },
      { label: 'City', emoji: '🏙️' },
      { label: 'Cultural', emoji: '🏛️' },
      { label: 'Adventure', emoji: '🎒' },
      { label: 'Relaxation', emoji: '🧘' },
      { label: 'Food', emoji: '🍽️' },
      { label: 'Wildlife', emoji: '🦁' },
      { label: 'Other', emoji: '🌍' },
    ];

    it('should render all category buttons', () => {
      const { container } = render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      categories.forEach(({ label, emoji }) => {
        expect(container.textContent).toContain(label);
        expect(container.textContent).toContain(emoji);
      });
    });

    it('should default to city category', () => {
      const { container } = render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // City category button should have gradient background (selected)
      const buttons = container.querySelectorAll('button');
      const cityButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('City') && btn.textContent?.includes('🏙️')
      );
      expect(cityButton).toBeDefined();
      expect(cityButton?.style.background).toContain('linear-gradient');
    });

    it('should allow selecting different category', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Find and click Beach button
      const buttons = container.querySelectorAll('button');
      const beachButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Beach') && btn.textContent?.includes('🏖️')
      );
      if (beachButton) {
        await user.click(beachButton);
        expect(beachButton.style.background).toContain('linear-gradient');
      }
    });
  });

  describe('Priority Selection', () => {
    it('should render all priority buttons', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Someday')).toBeInTheDocument();
    });

    it('should default to medium priority', () => {
      const { container } = render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Medium button should have gradient background (selected)
      const buttons = container.querySelectorAll('button');
      const mediumButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Medium') && btn.textContent?.includes('📌')
      );
      expect(mediumButton).toBeDefined();
      expect(mediumButton?.style.background).toContain('linear-gradient');
    });

    it('should allow selecting different priority', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Find and click Urgent button
      const buttons = container.querySelectorAll('button');
      const urgentButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Urgent') && btn.textContent?.includes('🔥')
      );
      if (urgentButton) {
        await user.click(urgentButton);
        expect(urgentButton.style.background).toContain('linear-gradient');
      }
    });
  });

  describe('Season Selection', () => {
    it('should list all seasons', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Spring')).toBeInTheDocument();
      expect(screen.getByText('Summer')).toBeInTheDocument();
      expect(screen.getByText('Fall')).toBeInTheDocument();
      expect(screen.getByText('Winter')).toBeInTheDocument();
    });

    it('should have "Any time" option', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Any time')).toBeInTheDocument();
    });
  });

  describe('Must Do List', () => {
    it('should render must-do input field', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Must Do Activities')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Watch sunset at Oia')).toBeInTheDocument();
    });

    it('should have add button for must-do items', () => {
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getAllByTestId('plus-icon').length).toBeGreaterThan(0);
    });

    it('should allow entering must-do item', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('e.g., Watch sunset at Oia');
      await user.type(input, 'Visit blue domes');

      expect(input).toHaveValue('Visit blue domes');
    });

    it('should add item to list when button clicked', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('e.g., Watch sunset at Oia');
      await user.type(input, 'Visit blue domes');

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      expect(screen.getByText('Visit blue domes')).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('should show remove button for added items', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('e.g., Watch sunset at Oia');
      await user.type(input, 'Visit winery');

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      expect(screen.getByLabelText('Remove Visit winery')).toBeInTheDocument();
    });

    it('should remove item when X button clicked', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('e.g., Watch sunset at Oia');
      await user.type(input, 'Test item');

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      const removeButton = screen.getByLabelText('Remove Test item');
      await user.click(removeButton);

      expect(screen.queryByText('Test item')).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering destination name', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('e.g., Santorini, Greece');
      await user.type(input, 'Paris, France');

      expect(input).toHaveValue('Paris, France');
    });

    it('should allow entering budget', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const budgetInput = screen.getByPlaceholderText('3000');
      await user.type(budgetInput, '5000');

      expect(budgetInput).toHaveValue(5000);
    });

    it('should allow entering target year', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const yearInput = screen.getByPlaceholderText('2027');
      await user.type(yearInput, '2025');

      expect(yearInput).toHaveValue(2025);
    });

    it('should allow selecting season', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByDisplayValue('Any time');
      await user.selectOptions(select, 'summer');

      expect(select).toHaveValue('summer');
    });
  });

  describe('Pre-filled Data', () => {
    it('should display pre-filled destination data', () => {
      const destination = {
        id: '1',
        name: 'Bali',
        description: 'Paradise island',
        countryName: 'Indonesia',
        cityName: 'Ubud',
        priority: 'high' as const,
        category: 'beach' as const,
        estimatedBudget: 2500,
        targetYear: 2025,
        targetSeason: 'summer',
        isVisited: false,
      };

      render(
        <BucketListFormModalV2
          isOpen={true}
          isEditing={true}
          destination={destination}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('Bali')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Paradise island')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Indonesia')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ubud')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2500')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Summer')).toBeInTheDocument();
    });

    it('should display pre-filled priority', () => {
      const destination = {
        id: '1',
        name: 'Test',
        priority: 'urgent' as const,
        category: 'city' as const,
        isVisited: false,
      };

      const { container } = render(
        <BucketListFormModalV2
          isOpen={true}
          isEditing={true}
          destination={destination}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Urgent button should have gradient background (selected)
      const buttons = container.querySelectorAll('button');
      const urgentButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Urgent') && btn.textContent?.includes('🔥')
      );
      expect(urgentButton).toBeDefined();
      expect(urgentButton?.style.background).toContain('linear-gradient');
    });

    it('should display pre-filled category', () => {
      const destination = {
        id: '1',
        name: 'Test',
        priority: 'medium' as const,
        category: 'mountain' as const,
        isVisited: false,
      };

      const { container } = render(
        <BucketListFormModalV2
          isOpen={true}
          isEditing={true}
          destination={destination}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Mountain button should have gradient background (selected)
      const buttons = container.querySelectorAll('button');
      const mountainButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Mountain') && btn.textContent?.includes('⛰️')
      );
      expect(mountainButton).toBeDefined();
      expect(mountainButton?.style.background).toContain('linear-gradient');
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit when form submitted', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Santorini, Greece');
      await user.type(nameInput, 'Test Destination');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty must-do input', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      // Should not add empty item
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });

    it('should trim whitespace from must-do items', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('e.g., Watch sunset at Oia');
      await user.type(input, '  Trimmed item  ');

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      expect(screen.getByText('Trimmed item')).toBeInTheDocument();
    });

    it('should handle undefined budget', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Santorini, Greece');
      await user.type(nameInput, 'Test');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            estimatedBudget: undefined,
          })
        );
      });
    });

    it('should handle undefined target year', async () => {
      const user = userEvent.setup();
      render(
        <BucketListFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Santorini, Greece');
      await user.type(nameInput, 'Test');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            targetYear: undefined,
          })
        );
      });
    });
  });
});
