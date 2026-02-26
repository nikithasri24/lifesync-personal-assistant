/**
 * Unit tests for RecipeCardV2 component
 * Tests rendering, difficulty display, favorite toggle, and metadata
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeCardV2 } from '../RecipeCardV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF', tertiary: '#FAFAFA' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('lucide-react', () => ({
  Clock: ({ className, style }: any) => <div data-testid="clock-icon" className={className} style={style} />,
  Users: ({ className, style }: any) => <div data-testid="users-icon" className={className} style={style} />,
  Heart: ({ className, style, fill }: any) => (
    <div data-testid="heart-icon" className={className} style={style} data-fill={fill} />
  ),
}));

describe('RecipeCardV2', () => {
  const mockOnClick = vi.fn();
  const mockOnFavoriteToggle = vi.fn();

  const baseRecipe = {
    id: '1',
    name: 'Grilled Chicken',
    cuisine: 'American',
    difficulty: 'medium' as const,
    prepTime: 15,
    cookTime: 25,
    servings: 4,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render recipe name', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
    });

    it('should render cuisine badge', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.getByText('American')).toBeInTheDocument();
    });

    it('should render difficulty badge', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should not render cuisine badge when not provided', () => {
      const recipe = { ...baseRecipe, cuisine: undefined };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      // Only difficulty should be shown
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.queryByText('American')).not.toBeInTheDocument();
    });

    it('should not render difficulty badge when not provided', () => {
      const recipe = { ...baseRecipe, difficulty: undefined };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(screen.getByText('American')).toBeInTheDocument();
      expect(screen.queryByText(/easy|medium|hard/i)).not.toBeInTheDocument();
    });
  });

  describe('Difficulty Colors', () => {
    it('should apply easy difficulty color', () => {
      const recipe = { ...baseRecipe, difficulty: 'easy' as const };
      const { container } = render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      // Green for easy - match either format
      expect(card.style.borderLeft).toMatch(/#10B981|rgb\(16,\s*185,\s*129\)/i);
    });

    it('should apply medium difficulty color', () => {
      const recipe = { ...baseRecipe, difficulty: 'medium' as const };
      const { container } = render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      // Orange for medium - match either format
      expect(card.style.borderLeft).toMatch(/#F59E0B|rgb\(245,\s*158,\s*11\)/i);
    });

    it('should apply hard difficulty color', () => {
      const recipe = { ...baseRecipe, difficulty: 'hard' as const };
      const { container } = render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      // Red for hard - match either format
      expect(card.style.borderLeft).toMatch(/#EF4444|rgb\(239,\s*68,\s*68\)/i);
    });
  });

  describe('Time Display', () => {
    it('should display total time when both prep and cook provided', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.getByText('40 min')).toBeInTheDocument(); // 15 + 25
    });

    it('should display time when only prep time provided', () => {
      const recipe = { ...baseRecipe, cookTime: undefined };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(screen.getByText('15 min')).toBeInTheDocument();
    });

    it('should display time when only cook time provided', () => {
      const recipe = { ...baseRecipe, prepTime: undefined };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(screen.getByText('25 min')).toBeInTheDocument();
    });

    it('should not display time when neither provided', () => {
      const recipe = { ...baseRecipe, prepTime: undefined, cookTime: undefined };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(screen.queryByText(/min/i)).not.toBeInTheDocument();
    });

    it('should show clock icon when time is displayed', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });
  });

  describe('Servings Display', () => {
    it('should display servings when provided', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.getByText('4 servings')).toBeInTheDocument();
    });

    it('should not display servings when not provided', () => {
      const recipe = { ...baseRecipe, servings: undefined };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(screen.queryByText(/servings/i)).not.toBeInTheDocument();
    });

    it('should show users icon when servings displayed', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });
  });

  describe('Nutrition Display', () => {
    it('should display calories when provided', () => {
      const recipe = {
        ...baseRecipe,
        nutritionInfo: { calories: 450 },
      };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(screen.getByText('450 cal')).toBeInTheDocument();
    });

    it('should not display calories when not provided', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.queryByText(/cal/i)).not.toBeInTheDocument();
    });

    it('should not display calories when nutritionInfo is undefined', () => {
      const recipe = { ...baseRecipe, nutritionInfo: undefined };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(screen.queryByText(/cal/i)).not.toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    it('should render image when imageUrl provided', () => {
      const recipe = {
        ...baseRecipe,
        imageUrl: 'https://example.com/image.jpg',
      };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      const img = screen.getByAltText('Grilled Chicken');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should not render image when imageUrl not provided', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Favorite Toggle', () => {
    it('should render favorite button when onFavoriteToggle provided', () => {
      render(
        <RecipeCardV2
          recipe={baseRecipe}
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    });

    it('should not render favorite button when onFavoriteToggle not provided', () => {
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      expect(screen.queryByLabelText(/favorites/i)).not.toBeInTheDocument();
    });

    it('should show filled heart when recipe is favorite', () => {
      const recipe = { ...baseRecipe, isFavorite: true };
      render(
        <RecipeCardV2
          recipe={recipe}
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
      const heart = screen.getByTestId('heart-icon');
      expect(heart).toHaveAttribute('data-fill', '#EF4444');
    });

    it('should show unfilled heart when recipe is not favorite', () => {
      const recipe = { ...baseRecipe, isFavorite: false };
      render(
        <RecipeCardV2
          recipe={recipe}
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
      const heart = screen.getByTestId('heart-icon');
      expect(heart).toHaveAttribute('data-fill', 'none');
    });

    it('should call onFavoriteToggle when favorite button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RecipeCardV2
          recipe={baseRecipe}
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      await user.click(screen.getByLabelText('Add to favorites'));

      expect(mockOnFavoriteToggle).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when favorite button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RecipeCardV2
          recipe={baseRecipe}
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      await user.click(screen.getByLabelText('Add to favorites'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      await user.click(screen.getByText('Grilled Chicken'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<RecipeCardV2 recipe={baseRecipe} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal recipe data', () => {
      const minimalRecipe = {
        id: '1',
        name: 'Simple Recipe',
      };

      render(<RecipeCardV2 recipe={minimalRecipe} onClick={mockOnClick} />);

      expect(screen.getByText('Simple Recipe')).toBeInTheDocument();
      // No errors should occur
    });

    it('should handle very long recipe names', () => {
      const recipe = {
        ...baseRecipe,
        name: 'Super Delicious Extra Long Recipe Name That Goes On And On',
      };

      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      expect(
        screen.getByText('Super Delicious Extra Long Recipe Name That Goes On And On')
      ).toBeInTheDocument();
    });

    it('should handle zero prep and cook time', () => {
      const recipe = { ...baseRecipe, prepTime: 0, cookTime: 0 };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      // Zero total time should not display
      expect(screen.queryByText(/min/i)).not.toBeInTheDocument();
    });

    it('should handle zero servings', () => {
      const recipe = { ...baseRecipe, servings: 0 };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      // Zero servings should not display
      expect(screen.queryByText(/servings/i)).not.toBeInTheDocument();
    });

    it('should handle zero calories', () => {
      const recipe = {
        ...baseRecipe,
        nutritionInfo: { calories: 0 },
      };
      render(<RecipeCardV2 recipe={recipe} onClick={mockOnClick} />);

      // Zero calories is falsy, should not display
      expect(screen.queryByText(/cal/i)).not.toBeInTheDocument();
    });
  });
});
