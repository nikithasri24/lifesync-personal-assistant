/**
 * RecipeCard Component Tests
 * Tests for recipe display card with actions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecipeCard } from '../RecipeCard';
import type { Recipe } from '../../../../types';

// Mock the mutation hook
vi.mock('../../../hooks/useMealPlanningQuery', () => ({
  useUpdateRecipeMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('RecipeCard', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-1',
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish with eggs, cheese, and pancetta',
    ingredients: [
      { name: 'Spaghetti', amount: '400g' },
      { name: 'Eggs', amount: '4' },
      { name: 'Parmesan cheese', amount: '100g' },
    ],
    instructions: [
      'Cook pasta according to package directions',
      'Whisk eggs and cheese together',
      'Combine everything while pasta is hot',
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: 'medium',
    tags: ['italian', 'pasta', 'dinner'],
    image: 'https://example.com/carbonara.jpg',
    isFavorite: false,
    sourceUrl: 'https://www.example.com/carbonara-recipe',
    createdAt: new Date('2024-01-01'),
  };

  const defaultProps = {
    recipe: mockRecipe,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recipe name and description', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    expect(screen.getByText(/Classic Italian pasta dish/)).toBeInTheDocument();
  });

  it('displays recipe image when provided', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const image = screen.getByAltText('Spaghetti Carbonara');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/carbonara.jpg');
  });

  it('shows gradient fallback when no image is provided', () => {
    const recipeWithoutImage = { ...mockRecipe, image: undefined };
    render(<RecipeCard {...defaultProps} recipe={recipeWithoutImage} />, { wrapper: createWrapper() });

    // Check for ChefHat icon (fallback)
    const fallback = screen.getByRole('listitem').querySelector('.from-indigo-500');
    expect(fallback).toBeInTheDocument();
  });

  it('displays total time (prep + cook)', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('25 min')).toBeInTheDocument(); // 10 + 15
  });

  it('displays servings count', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays tags (limited to first 3)', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('pasta')).toBeInTheDocument();
    expect(screen.getByText('dinner')).toBeInTheDocument();
  });

  it('shows +N indicator when more than 3 tags', () => {
    const recipeWithManyTags = {
      ...mockRecipe,
      tags: ['italian', 'pasta', 'dinner', 'quick', 'easy'],
    };
    render(<RecipeCard {...defaultProps} recipe={recipeWithManyTags} />, { wrapper: createWrapper() });

    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('extracts and displays domain from sourceUrl', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('handles sourceUrl with www prefix', () => {
    const recipeWithWWW = {
      ...mockRecipe,
      sourceUrl: 'https://www.foodnetwork.com/recipe',
    };
    render(<RecipeCard {...defaultProps} recipe={recipeWithWWW} />, { wrapper: createWrapper() });

    expect(screen.getByText('foodnetwork.com')).toBeInTheDocument();
  });

  it('calls onView when card is clicked', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const card = screen.getByRole('listitem');
    fireEvent.click(card);

    expect(defaultProps.onView).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const editButton = screen.getByLabelText('Edit recipe');
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
    expect(defaultProps.onView).not.toHaveBeenCalled(); // Should not trigger card click
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const deleteButton = screen.getByLabelText('Delete recipe');
    fireEvent.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onView).not.toHaveBeenCalled(); // Should not trigger card click
  });

  it('displays unfavorited heart icon by default', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const favoriteButton = screen.getByLabelText('Add to favorites');
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveClass('bg-white');
  });

  it('displays favorited heart icon when isFavorite is true', () => {
    const favoriteRecipe = { ...mockRecipe, isFavorite: true };
    render(<RecipeCard {...defaultProps} recipe={favoriteRecipe} />, { wrapper: createWrapper() });

    const favoriteButton = screen.getByLabelText('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveClass('bg-pink-500');
  });

  it('does not toggle favorite when recipe has no id', () => {
    const recipeWithoutId = { ...mockRecipe, id: undefined } as Recipe;
    const { container } = render(<RecipeCard {...defaultProps} recipe={recipeWithoutId} />, { wrapper: createWrapper() });

    const favoriteButton = screen.getByRole('button', { name: /favorites/ });
    fireEvent.click(favoriteButton);

    // Should not throw or cause issues
    expect(container).toBeInTheDocument();
  });

  it('opens source URL in new tab when domain link is clicked', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const sourceLink = screen.getByText('example.com').closest('a');
    expect(sourceLink).toHaveAttribute('href', 'https://www.example.com/carbonara-recipe');
    expect(sourceLink).toHaveAttribute('target', '_blank');
    expect(sourceLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('stops propagation when source link is clicked', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const sourceLink = screen.getByText('example.com').closest('a')!;
    fireEvent.click(sourceLink);

    expect(defaultProps.onView).not.toHaveBeenCalled();
  });

  it('handles recipes without description', () => {
    const recipeWithoutDesc = { ...mockRecipe, description: undefined };
    render(<RecipeCard {...defaultProps} recipe={recipeWithoutDesc} />, { wrapper: createWrapper() });

    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    // Description section should not render
    expect(screen.queryByText(/Classic Italian/)).not.toBeInTheDocument();
  });

  it('handles recipes without tags', () => {
    const recipeWithoutTags = { ...mockRecipe, tags: undefined };
    render(<RecipeCard {...defaultProps} recipe={recipeWithoutTags} />, { wrapper: createWrapper() });

    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    // Should not crash
  });

  it('handles recipes without prepTime or cookTime', () => {
    const recipeWithoutTimes = { ...mockRecipe, prepTime: undefined, cookTime: undefined };
    render(<RecipeCard {...defaultProps} recipe={recipeWithoutTimes} />, { wrapper: createWrapper() });

    // Time badge should not display
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('applies hover effects on card', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const card = screen.getByRole('listitem');
    expect(card).toHaveClass('hover:-translate-y-0.5');
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('has proper accessibility attributes', () => {
    render(<RecipeCard {...defaultProps} />, { wrapper: createWrapper() });

    const editButton = screen.getByLabelText('Edit recipe');
    expect(editButton).toHaveAttribute('aria-label', 'Edit recipe');

    const deleteButton = screen.getByLabelText('Delete recipe');
    expect(deleteButton).toHaveAttribute('aria-label', 'Delete recipe');

    const favoriteButton = screen.getByRole('button', { name: /favorites/ });
    expect(favoriteButton).toHaveAttribute('aria-label');
  });
});
