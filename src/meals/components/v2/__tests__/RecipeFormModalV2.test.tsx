/**
 * Unit tests for RecipeFormModalV2 component
 * Tests form rendering, dynamic arrays, nutrition fields, and validation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeFormModalV2 } from '../RecipeFormModalV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('lucide-react', () => ({
  Plus: ({ className }: any) => <div data-testid="plus-icon" className={className} />,
  Trash2: ({ className }: any) => <div data-testid="trash-icon" className={className} />,
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

describe('RecipeFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <RecipeFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Add Recipe" title when creating', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Add Recipe')).toBeInTheDocument();
    });

    it('should show "Edit Recipe" title when editing', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          recipeId="1"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
  });

  describe('Basic Form Fields', () => {
    it('should render recipe name input', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Recipe Name *')).toBeInTheDocument();
    });

    it('should render cuisine input', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Cuisine')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Italian, Mexican, etc.')).toBeInTheDocument();
    });

    it('should render difficulty selector', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      const select = screen.getByDisplayValue('Medium');
      expect(select).toBeInTheDocument();
    });

    it('should render time inputs', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Prep (min)')).toBeInTheDocument();
      expect(screen.getByText('Cook (min)')).toBeInTheDocument();
    });

    it('should render servings input', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Servings')).toBeInTheDocument();
    });
  });

  describe('Basic Field Interactions', () => {
    it('should allow entering recipe name', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      const nameInput = inputs[0]; // First textbox is recipe name
      await user.type(nameInput, 'Grilled Chicken');

      expect(nameInput).toHaveValue('Grilled Chicken');
    });

    it('should allow selecting difficulty', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByDisplayValue('Medium');
      await user.selectOptions(select, 'hard');

      expect(select).toHaveValue('hard');
    });
  });

  describe('Ingredients Section', () => {
    it('should render ingredients section', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Ingredients')).toBeInTheDocument();
    });

    it('should show one ingredient row by default', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInputs = screen.getAllByPlaceholderText('Name');
      expect(nameInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Add button for ingredients', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const addButtons = screen.getAllByText('Add');
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it('should add new ingredient row when Add clicked', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const initialCount = screen.getAllByPlaceholderText('Name').length;
      const addButtons = screen.getAllByText('Add');
      const ingredientAddButton = addButtons[0]; // First Add button is for ingredients

      await user.click(ingredientAddButton);

      const newCount = screen.getAllByPlaceholderText('Name').length;
      expect(newCount).toBe(initialCount + 1);
    });

    it('should render remove buttons for ingredients', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const removeButtons = screen.getAllByLabelText('Remove ingredient');
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should have unit selector with options', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('cup')).toBeInTheDocument();
      expect(screen.getByText('tbsp')).toBeInTheDocument();
      expect(screen.getByText('tsp')).toBeInTheDocument();
    });
  });

  describe('Instructions Section', () => {
    it('should render instructions section', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Instructions')).toBeInTheDocument();
    });

    it('should show one instruction row by default', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const stepInputs = screen.getAllByPlaceholderText(/Step/i);
      expect(stepInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should show step numbers', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should add new instruction when Add clicked', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const initialCount = screen.getAllByPlaceholderText(/Step/i).length;
      const addButtons = screen.getAllByText('Add');
      const instructionAddButton = addButtons[1]; // Second Add button is for instructions

      await user.click(instructionAddButton);

      const newCount = screen.getAllByPlaceholderText(/Step/i).length;
      expect(newCount).toBe(initialCount + 1);
    });

    it('should show step 2 after adding instruction', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const addButtons = screen.getAllByText('Add');
      const instructionAddButton = addButtons[1];

      await user.click(instructionAddButton);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render remove buttons for instructions', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const removeButtons = screen.getAllByLabelText('Remove instruction');
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Nutrition Info Section', () => {
    it('should render nutrition info section', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Nutrition Info (optional)')).toBeInTheDocument();
    });

    it('should render all nutrition fields', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByPlaceholderText('Calories')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Protein (g)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Carbs (g)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Fat (g)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Fiber (g)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Sugar (g)')).toBeInTheDocument();
    });
  });

  describe('Additional Fields', () => {
    it('should render image URL field', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Image URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com/image.jpg')).toBeInTheDocument();
    });

    it('should render tags field', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Tags (comma-separated)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('vegetarian, quick, healthy')).toBeInTheDocument();
    });

    it('should render favorite checkbox', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should allow toggling favorite checkbox', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Pre-filled Data', () => {
    it('should display pre-filled recipe name', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          recipeId="1"
          initialData={{ name: 'Pasta Carbonara' } as any}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument();
    });

    it('should display pre-filled difficulty', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          recipeId="1"
          initialData={{ difficulty: 'hard' } as any}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('Hard')).toBeInTheDocument();
    });

    it('should display pre-filled favorite status', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          recipeId="1"
          initialData={{ isFavorite: true } as any}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
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
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      const nameInput = inputs[0];
      await user.type(nameInput, 'Test Recipe');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should submit with default values for empty fields', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      const nameInput = inputs[0];
      await user.type(nameInput, 'Simple Recipe');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Simple Recipe',
            difficulty: 'medium', // Default
            isFavorite: false, // Default
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long recipe names', async () => {
      const user = userEvent.setup();
      const longName = 'A'.repeat(200);

      render(
        <RecipeFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      const nameInput = inputs[0];
      await user.type(nameInput, longName);

      expect(nameInput).toHaveValue(longName);
    });

    it('should handle zero prep and cook time', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          initialData={{ prepTime: '0', cookTime: '0' } as any}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Multiple inputs may have value "0", use getAllByDisplayValue
      const zeroInputs = screen.getAllByDisplayValue('0');
      expect(zeroInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty ingredients array in initial data', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          initialData={{ name: 'Test', ingredients: [] } as any}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Should not crash - empty arrays should be handled
      // Component will either show nothing or fall back to defaults
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    it('should handle empty instructions array in initial data', () => {
      render(
        <RecipeFormModalV2
          isOpen={true}
          initialData={{ name: 'Test', instructions: [] } as any}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Should not crash - empty arrays should be handled
      // Component will either show nothing or fall back to defaults
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });
  });
});
