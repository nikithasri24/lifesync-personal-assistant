/**
 * Unit tests for MealSectionV2 component
 * Tests meal section with header, food items, and add button
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealSectionV2 } from '../MealSectionV2';

describe('MealSectionV2', () => {
  const mockFoodEntries = [
    {
      id: 'food-1',
      name: 'Scrambled Eggs',
      servingInfo: '2 eggs',
      calories: 180,
      emoji: '🍳',
    },
    {
      id: 'food-2',
      name: 'Toast',
      servingInfo: '2 slices',
      calories: 150,
      photoUrl: 'https://example.com/toast.jpg',
    },
  ];

  const defaultProps = {
    mealType: 'breakfast' as const,
    mealLabel: 'Breakfast',
    mealIcon: '🌅',
    totalCalories: 330,
    foodEntries: mockFoodEntries,
    onAddFood: vi.fn(),
    onFoodClick: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render meal label', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });

    it('should render meal icon', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('🌅')).toBeInTheDocument();
    });

    it('should render total calories', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('330 cal')).toBeInTheDocument();
    });

    it('should round decimal total calories', () => {
      render(<MealSectionV2 {...defaultProps} totalCalories={334.67} />);

      expect(screen.getByText('335 cal')).toBeInTheDocument();
    });

    it('should render add food button', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('+ Add Food')).toBeInTheDocument();
    });
  });

  describe('Food Entries Display', () => {
    it('should render all food entries', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument();
      expect(screen.getByText('Toast')).toBeInTheDocument();
    });

    it('should render food serving info', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('2 eggs')).toBeInTheDocument();
      expect(screen.getByText('2 slices')).toBeInTheDocument();
    });

    it('should render individual food calories', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('180 cal')).toBeInTheDocument();
      expect(screen.getByText('150 cal')).toBeInTheDocument();
    });

    it('should not render food items when foodEntries is empty', () => {
      render(<MealSectionV2 {...defaultProps} foodEntries={[]} />);

      expect(screen.queryByText('Scrambled Eggs')).not.toBeInTheDocument();
      expect(screen.queryByText('Toast')).not.toBeInTheDocument();
    });

    it('should render only add button when no food entries', () => {
      render(<MealSectionV2 {...defaultProps} foodEntries={[]} />);

      expect(screen.getByText('+ Add Food')).toBeInTheDocument();
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onAddFood when add button clicked', async () => {
      const user = userEvent.setup();
      const onAddFoodMock = vi.fn();

      render(<MealSectionV2 {...defaultProps} onAddFood={onAddFoodMock} />);

      await user.click(screen.getByText('+ Add Food'));

      expect(onAddFoodMock).toHaveBeenCalledTimes(1);
    });

    it('should call onFoodClick with food id when food item clicked', async () => {
      const user = userEvent.setup();
      const onFoodClickMock = vi.fn();

      render(<MealSectionV2 {...defaultProps} onFoodClick={onFoodClickMock} />);

      await user.click(screen.getByText('Scrambled Eggs'));

      expect(onFoodClickMock).toHaveBeenCalledWith('food-1');
    });

    it('should call onFoodClick with correct id for different food items', async () => {
      const user = userEvent.setup();
      const onFoodClickMock = vi.fn();

      render(<MealSectionV2 {...defaultProps} onFoodClick={onFoodClickMock} />);

      await user.click(screen.getByText('Toast'));

      expect(onFoodClickMock).toHaveBeenCalledWith('food-2');
    });
  });

  describe('Meal Types', () => {
    it('should render lunch meal type', () => {
      render(
        <MealSectionV2
          {...defaultProps}
          mealType="lunch"
          mealLabel="Lunch"
          mealIcon="🌞"
        />
      );

      expect(screen.getByText('Lunch')).toBeInTheDocument();
      expect(screen.getByText('🌞')).toBeInTheDocument();
    });

    it('should render dinner meal type', () => {
      render(
        <MealSectionV2
          {...defaultProps}
          mealType="dinner"
          mealLabel="Dinner"
          mealIcon="🌙"
        />
      );

      expect(screen.getByText('Dinner')).toBeInTheDocument();
      expect(screen.getByText('🌙')).toBeInTheDocument();
    });

    it('should render snack meal type', () => {
      render(
        <MealSectionV2
          {...defaultProps}
          mealType="snack"
          mealLabel="Snack"
          mealIcon="🍎"
        />
      );

      expect(screen.getByText('Snack')).toBeInTheDocument();
      expect(screen.getByText('🍎')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have white background', () => {
      const { container } = render(<MealSectionV2 {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.background).toBe('white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<MealSectionV2 {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.borderRadius).toBe('16px');
    });

    it('should have box shadow', () => {
      const { container } = render(<MealSectionV2 {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.boxShadow).toContain('rgba(92, 74, 58, 0.08)');
    });

    it('should have hover effect on add button', () => {
      render(<MealSectionV2 {...defaultProps} />);

      const addButton = screen.getByText('+ Add Food');
      expect(addButton.className).toContain('hover:bg-opacity-80');
    });

    it('should have dashed border on add button', () => {
      render(<MealSectionV2 {...defaultProps} />);

      const addButton = screen.getByText('+ Add Food');
      expect(addButton.style.border).toContain('dashed');
      // Browser converts hex to rgb
      expect(addButton.style.border).toContain('rgb(212, 165, 116)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single food entry', () => {
      const singleEntry = [mockFoodEntries[0]];

      render(<MealSectionV2 {...defaultProps} foodEntries={singleEntry} />);

      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument();
      expect(screen.queryByText('Toast')).not.toBeInTheDocument();
    });

    it('should handle many food entries', () => {
      const manyEntries = Array.from({ length: 10 }, (_, i) => ({
        id: `food-${i}`,
        name: `Food ${i}`,
        servingInfo: '1 serving',
        calories: 100,
      }));

      render(<MealSectionV2 {...defaultProps} foodEntries={manyEntries} />);

      expect(screen.getByText('Food 0')).toBeInTheDocument();
      expect(screen.getByText('Food 9')).toBeInTheDocument();
    });

    it('should handle zero total calories', () => {
      render(<MealSectionV2 {...defaultProps} totalCalories={0} />);

      expect(screen.getByText('0 cal')).toBeInTheDocument();
    });

    it('should handle very high total calories', () => {
      render(<MealSectionV2 {...defaultProps} totalCalories={2500} />);

      expect(screen.getByText('2500 cal')).toBeInTheDocument();
    });

    it('should render food with emoji', () => {
      render(<MealSectionV2 {...defaultProps} />);

      expect(screen.getByText('🍳')).toBeInTheDocument();
    });

    it('should handle food with photoUrl', () => {
      const { container } = render(<MealSectionV2 {...defaultProps} />);

      // Verify the second food entry renders correctly (toast has photoUrl)
      expect(screen.getByText('Toast')).toBeInTheDocument();
      expect(screen.getByText('2 slices')).toBeInTheDocument();
      expect(screen.getByText('150 cal')).toBeInTheDocument();
    });
  });
});
