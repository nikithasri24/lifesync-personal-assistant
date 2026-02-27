/**
 * Unit tests for FoodLogModalV2 component
 * Tests food logging form modal with meal type, macros, and validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodLogModalV2 } from '../FoodLogModalV2';
import React from 'react';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ children, defaultData, initialData, onSubmit, validate, isOpen }: any) => {
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
        <form onSubmit={handleSubmit}>
          {children(formState, setFormState)}
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  },
}));

describe('FoodLogModalV2', () => {
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
      render(<FoodLogModalV2 {...defaultProps} />);

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<FoodLogModalV2 {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should render food name input', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      expect(screen.getByPlaceholderText('e.g., Grilled Chicken Salad')).toBeInTheDocument();
    });

    it('should render serving size input', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      expect(screen.getByPlaceholderText('e.g., 1 cup, 250g')).toBeInTheDocument();
    });

    it('should render calories input', () => {
      const { container } = render(<FoodLogModalV2 {...defaultProps} />);

      // Find calories input by looking for the label "Calories"
      expect(screen.getByText('Calories')).toBeInTheDocument();

      // Verify there are numeric inputs (calories + macros)
      const numberInputs = container.querySelectorAll('input[type="number"]');
      expect(numberInputs.length).toBeGreaterThan(0);
    });

    it('should render notes textarea', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      expect(screen.getByPlaceholderText('Add any notes about this food...')).toBeInTheDocument();
    });
  });

  describe('Meal Type Selection', () => {
    it('should render all four meal type buttons', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
      expect(screen.getByText('Dinner')).toBeInTheDocument();
      expect(screen.getByText('Snack')).toBeInTheDocument();
    });

    it('should render meal type emojis', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      expect(screen.getByText('🌅')).toBeInTheDocument(); // Breakfast
      expect(screen.getByText('🌞')).toBeInTheDocument(); // Lunch
      expect(screen.getByText('🌙')).toBeInTheDocument(); // Dinner
      expect(screen.getByText('🍎')).toBeInTheDocument(); // Snack
    });

    it('should default to lunch meal type', () => {
      const { container } = render(<FoodLogModalV2 {...defaultProps} />);

      const lunchButton = screen.getByText('Lunch').closest('button');
      expect(lunchButton?.className).toContain('bg-terracotta-100');
    });

    it('should use selectedMealType when provided', () => {
      render(<FoodLogModalV2 {...defaultProps} selectedMealType="breakfast" />);

      const breakfastButton = screen.getByText('Breakfast').closest('button');
      expect(breakfastButton?.className).toContain('bg-terracotta-100');
    });

    it('should allow changing meal type', async () => {
      const user = userEvent.setup();

      render(<FoodLogModalV2 {...defaultProps} />);

      await user.click(screen.getByText('Dinner'));

      const dinnerButton = screen.getByText('Dinner').closest('button');
      expect(dinnerButton?.className).toContain('bg-terracotta-100');
    });

    it('should have aria-label for meal type buttons', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      const breakfastButton = screen.getByLabelText('Select Breakfast meal type');
      expect(breakfastButton).toBeInTheDocument();

      const lunchButton = screen.getByLabelText('Select Lunch meal type');
      expect(lunchButton).toBeInTheDocument();
    });
  });

  describe('Macro Inputs', () => {
    it('should render protein input', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      const proteinLabel = screen.getByText('Protein (g)');
      expect(proteinLabel).toBeInTheDocument();
    });

    it('should render carbs input', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      const carbsLabel = screen.getByText('Carbs (g)');
      expect(carbsLabel).toBeInTheDocument();
    });

    it('should render fat input', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      const fatLabel = screen.getByText('Fat (g)');
      expect(fatLabel).toBeInTheDocument();
    });

    it('should accept numeric values for macros', async () => {
      const user = userEvent.setup();
      const { container } = render(<FoodLogModalV2 {...defaultProps} />);

      // Find macro inputs by looking for number inputs after the calories input
      const numberInputs = container.querySelectorAll('input[type="number"]');

      // First is calories, then protein, carbs, fat
      const proteinInput = numberInputs[1] as HTMLInputElement;
      const carbsInput = numberInputs[2] as HTMLInputElement;
      const fatInput = numberInputs[3] as HTMLInputElement;

      await user.clear(proteinInput);
      await user.type(proteinInput, '25');

      await user.clear(carbsInput);
      await user.type(carbsInput, '30');

      await user.clear(fatInput);
      await user.type(fatInput, '10');

      expect(proteinInput.value).toBe('25');
      expect(carbsInput.value).toBe('30');
      expect(fatInput.value).toBe('10');
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Chicken Salad');

      // Get calories input (first number input with required attribute)
      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          foodName: 'Chicken Salad',
          calories: 350,
          mealType: 'lunch',
        })
      );
    });

    it('should trim whitespace from text fields', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), '  Chicken  ');

      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          foodName: 'Chicken',
        })
      );
    });

    it('should parse numeric values correctly', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Food');

      // Get calories input (first number input with required attribute)
      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      // Get all number inputs
      const numberInputs = container.querySelectorAll('input[type="number"]');
      const proteinInput = numberInputs[1] as HTMLInputElement;

      await user.clear(proteinInput);
      await user.type(proteinInput, '25');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          calories: 350,
          protein: 25,
        })
      );
    });

    it('should default to 0 for empty numeric fields', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Food');

      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          protein: 0,
          carbs: 0,
          fat: 0,
        })
      );
    });

    it('should include all form fields in submission', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Chicken Salad');
      await user.type(screen.getByPlaceholderText('e.g., 1 cup, 250g'), '1 bowl');

      // Get calories input (first number input with required attribute)
      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      const numberInputs = container.querySelectorAll('input[type="number"]');
      await user.clear(numberInputs[1]);
      await user.type(numberInputs[1], '25'); // Protein
      await user.clear(numberInputs[2]);
      await user.type(numberInputs[2], '30'); // Carbs
      await user.clear(numberInputs[3]);
      await user.type(numberInputs[3], '10'); // Fat

      await user.type(screen.getByPlaceholderText('Add any notes about this food...'), 'Delicious');

      await user.click(screen.getByText('Dinner'));
      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith({
        foodName: 'Chicken Salad',
        mealType: 'dinner',
        servingSize: '1 bowl',
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 10,
        notes: 'Delicious',
      });
    });
  });

  describe('Validation', () => {
    it('should require food name', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn();
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      // Don't fill in food name, only fill calories
      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      await user.click(screen.getByText('Submit'));

      // Should not call onSubmit because validation should fail
      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    it('should require calories', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn();

      render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Food');
      // Don't fill in calories (leave empty)
      await user.click(screen.getByText('Submit'));

      // Should not call onSubmit because validation should fail
      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    it('should allow submission with only required fields', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Food');

      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with existing food data', () => {
      const foodEntry = {
        id: 'food-1',
        foodName: 'Grilled Chicken',
        mealType: 'dinner' as const,
        servingSize: '200g',
        calories: 250,
        protein: 40,
        carbs: 0,
        fat: 8,
        notes: 'High protein',
      };

      render(<FoodLogModalV2 {...defaultProps} foodEntry={foodEntry} isEditing={true} />);

      expect(screen.getByDisplayValue('Grilled Chicken')).toBeInTheDocument();
      expect(screen.getByDisplayValue('200g')).toBeInTheDocument();
      expect(screen.getByDisplayValue('250')).toBeInTheDocument();
      expect(screen.getByDisplayValue('40')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('8')).toBeInTheDocument();
      expect(screen.getByDisplayValue('High protein')).toBeInTheDocument();
    });

    it('should select correct meal type in edit mode', () => {
      const foodEntry = {
        id: 'food-1',
        foodName: 'Breakfast Burrito',
        mealType: 'breakfast' as const,
        servingSize: '1 burrito',
        calories: 400,
        protein: 20,
        carbs: 50,
        fat: 15,
      };

      render(<FoodLogModalV2 {...defaultProps} foodEntry={foodEntry} isEditing={true} />);

      const breakfastButton = screen.getByText('Breakfast').closest('button');
      expect(breakfastButton?.className).toContain('bg-terracotta-100');
    });

    it('should handle missing optional fields in edit mode', () => {
      const foodEntry = {
        id: 'food-1',
        foodName: 'Simple Food',
        mealType: 'lunch' as const,
        servingSize: '',
        calories: 100,
        protein: 0,
        carbs: 0,
        fat: 0,
      };

      render(<FoodLogModalV2 {...defaultProps} foodEntry={foodEntry} isEditing={true} />);

      expect(screen.getByDisplayValue('Simple Food')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });
  });

  describe('Form Inputs Styling', () => {
    it('should render food name input field', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      const foodNameInput = screen.getByPlaceholderText('e.g., Grilled Chicken Salad');
      expect(foodNameInput).toBeInTheDocument();
    });

    it('should mark food name as required', () => {
      render(<FoodLogModalV2 {...defaultProps} />);

      const foodNameInput = screen.getByPlaceholderText('e.g., Grilled Chicken Salad');
      expect(foodNameInput).toHaveAttribute('required');
    });

    it('should mark calories as required', () => {
      const { container } = render(<FoodLogModalV2 {...defaultProps} />);

      const caloriesInput = container.querySelector('input[type="number"][required]');
      expect(caloriesInput).toHaveAttribute('required');
    });

    it('should have 3-column grid for macros', () => {
      const { container } = render(<FoodLogModalV2 {...defaultProps} />);

      const macroGrid = container.querySelector('.grid-cols-3');
      expect(macroGrid).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long food names', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      const longName = 'A'.repeat(200);
      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), longName);

      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          foodName: longName,
        })
      );
    });

    it('should handle decimal calorie values', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Food');

      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '350.5');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          calories: 350.5,
        })
      );
    });

    it('should handle zero calories', async () => {
      const user = userEvent.setup();
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { container } = render(<FoodLogModalV2 {...defaultProps} onSubmit={onSubmitMock} />);

      await user.type(screen.getByPlaceholderText('e.g., Grilled Chicken Salad'), 'Water');

      const caloriesInput = container.querySelector('input[type="number"][required]') as HTMLInputElement;
      await user.clear(caloriesInput);
      await user.type(caloriesInput, '0');

      await user.click(screen.getByText('Submit'));

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          calories: 0,
        })
      );
    });
  });
});
