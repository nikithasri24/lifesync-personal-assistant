/**
 * Unit tests for MealFormModalV2 component
 * Tests form rendering, mode switching, recipe selection, and validation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealFormModalV2 } from '../MealFormModalV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('@/components/v2', () => ({
  FormModalV2: ({ children, isOpen, onClose, onSubmit, title, defaultData }: any) => {
    const [formState, setFormState] = React.useState(defaultData);

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

describe('MealFormModalV2', () => {
  const mockDate = new Date('2024-12-25');
  const mockRecipes = [
    {
      id: '1',
      name: 'Grilled Chicken',
      servings: 4,
      prepTime: 15,
      cookTime: 25,
    },
    {
      id: '2',
      name: 'Pasta Carbonara',
      servings: 2,
      prepTime: 10,
      cookTime: 15,
    },
    {
      id: '3',
      name: 'Caesar Salad',
      isFavorite: true,
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <MealFormModalV2
          isOpen={false}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show correct title', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Plan Meal')).toBeInTheDocument();
    });
  });

  describe('Date and Meal Type Display', () => {
    it('should display formatted date', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Date formatting may vary based on timezone, check for Dec 2024
      expect(screen.getByDisplayValue(/Dec \d+, 2024/)).toBeInTheDocument();
    });

    it('should display capitalized meal type', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="breakfast"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('Breakfast')).toBeInTheDocument();
    });

    it('should have disabled date input', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="lunch"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const dateInput = screen.getByDisplayValue(/Dec \d+, 2024/);
      expect(dateInput).toBeDisabled();
    });

    it('should have disabled meal type input', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const mealTypeInput = screen.getByDisplayValue('Dinner');
      expect(mealTypeInput).toBeDisabled();
    });
  });

  describe('Mode Selector', () => {
    it('should render both mode buttons', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('From Recipe')).toBeInTheDocument();
      expect(screen.getByText('Custom Meal')).toBeInTheDocument();
    });

    it('should default to recipe mode', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Recipe selector should be visible
      expect(screen.getByText('Select Recipe')).toBeInTheDocument();
    });

    it('should switch to custom mode when button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Custom Meal'));

      // Custom meal name input should be visible
      expect(screen.getByText('Meal Name')).toBeInTheDocument();
    });

    it('should switch back to recipe mode', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Custom Meal'));
      await user.click(screen.getByText('From Recipe'));

      // Recipe selector should be visible again
      expect(screen.getByText('Select Recipe')).toBeInTheDocument();
    });
  });

  describe('Recipe Mode', () => {
    it('should render recipe selector', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Select a recipe...')).toBeInTheDocument();
    });

    it('should list all recipes', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      // Caesar Salad appears twice (favorites + all recipes), use getAllByText
      const caesarOptions = screen.getAllByText('Caesar Salad');
      expect(caesarOptions.length).toBeGreaterThanOrEqual(1);
    });

    it('should show favorites section when favorites exist', () => {
      const { container } = render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Favorites optgroup exists - check for optgroup element
      const optgroup = container.querySelector('optgroup[label*="Favorites"]');
      expect(optgroup).toBeInTheDocument();
    });

    it('should show recipe details when recipe selected', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');

      // Should show servings and time
      expect(screen.getByText(/4 servings/i)).toBeInTheDocument();
      expect(screen.getByText(/40 min/i)).toBeInTheDocument(); // 15 + 25
    });

    it('should handle recipes without time info', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '3');

      // Should not crash when recipe has no time
      expect(screen.queryByText(/min/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom Mode', () => {
    it('should render custom meal name input', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Custom Meal'));

      expect(screen.getByText('Meal Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Grilled chicken with veggies/i)).toBeInTheDocument();
    });

    it('should allow entering custom meal name', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Custom Meal'));

      const input = screen.getByPlaceholderText(/e.g., Grilled chicken with veggies/i);
      await user.type(input, 'Leftover Pizza');

      expect(input).toHaveValue('Leftover Pizza');
    });
  });

  describe('Servings Field', () => {
    it('should render servings input', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Servings')).toBeInTheDocument();
    });

    it('should default to 2 servings', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });

    it('should allow changing servings', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const inputs = screen.getAllByDisplayValue('2');
      const servingsInput = inputs.find(input => input.getAttribute('type') === 'number') as HTMLInputElement;

      await user.clear(servingsInput);
      await user.type(servingsInput, '4');

      expect(servingsInput).toHaveValue(4);
    });
  });

  describe('Notes Field', () => {
    it('should render notes textarea', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Notes (optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Any special notes...')).toBeInTheDocument();
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText('Any special notes...');
      await user.type(textarea, 'Make extra for leftovers');

      expect(textarea).toHaveValue('Make extra for leftovers');
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit with recipe data when submitted', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            date: mockDate,
            mealType: 'dinner',
            recipeId: '1',
            servings: 2,
          })
        );
      });
    });

    it('should call onSubmit with custom meal data when submitted', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="breakfast"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Custom Meal'));

      const input = screen.getByPlaceholderText(/e.g., Grilled chicken with veggies/i);
      await user.type(input, 'Scrambled Eggs');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            date: mockDate,
            mealType: 'breakfast',
            customName: 'Scrambled Eggs',
            servings: 2,
          })
        );
      });
    });

    it('should include notes in submission when provided', async () => {
      const user = userEvent.setup();
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="lunch"
          recipes={mockRecipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');

      const textarea = screen.getByPlaceholderText('Any special notes...');
      await user.type(textarea, 'Add extra garlic');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: 'Add extra garlic',
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty recipes array', () => {
      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={[]}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Select a recipe...')).toBeInTheDocument();
      // Should still render but with empty list
    });

    it('should handle recipes without servings', async () => {
      const user = userEvent.setup();
      const recipes = [{ id: '1', name: 'Simple Recipe' }];

      render(
        <MealFormModalV2
          isOpen={true}
          date={mockDate}
          mealType="dinner"
          recipes={recipes}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');

      // Should not crash when recipe has no servings
      // Note: The "Servings" label is always shown (form label), but recipe details won't show servings
      // Just verify it didn't crash
      expect(screen.getByText('Simple Recipe')).toBeInTheDocument();
    });
  });
});
