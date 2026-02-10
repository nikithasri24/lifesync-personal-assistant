import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SavedRecipesSection } from '../SavedRecipesSection';
import { UndoRedoProvider } from '../../../../contexts/UndoRedoContext';
import type { Recipe } from '../../../../types';

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    measureElement: vi.fn(),
  })),
}));

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <UndoRedoProvider>{children}</UndoRedoProvider>;
}

function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

const createMockRecipe = (id: string, name: string, isFavorite = false): Recipe => ({
  id,
  name,
  isFavorite,
  description: `Description for ${name}`,
  ingredients: ['ingredient 1', 'ingredient 2'],
  instructions: ['step 1', 'step 2'],
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  tags: ['tag1', 'tag2'],
  sourceUrl: 'https://example.com',
  image: undefined,
  notes: undefined,
  difficulty: undefined,
  cuisine: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'user-123',
});

describe('SavedRecipesSection', () => {
  const defaultProps = {
    recipes: [],
    allRecipesCount: 0,
    showFavoritesOnly: false,
    onToggleFavorites: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    onDeleteAll: vi.fn(),
    onViewRecipe: vi.fn(),
    onEditRecipe: vi.fn(),
    onDeleteRecipe: vi.fn(),
  };

  it('should render empty state when no recipes exist', () => {
    renderWithProviders(<SavedRecipesSection {...defaultProps} />);

    expect(screen.getByText('Clip a recipe above to get started.')).toBeInTheDocument();
  });

  it('should render search empty state when search returns no results', () => {
    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        allRecipesCount={10}
        recipes={[]}
        searchQuery="nonexistent"
      />
    );

    expect(screen.getByText('No recipes match your search. Try different keywords.')).toBeInTheDocument();
  });

  it('should render small recipe list without virtualization', () => {
    const recipes = Array.from({ length: 5 }, (_, i) =>
      createMockRecipe(`recipe-${i}`, `Recipe ${i}`)
    );

    renderWithProviders(<SavedRecipesSection {...defaultProps} recipes={recipes} allRecipesCount={5} />);

    // Should render all recipes
    recipes.forEach((recipe) => {
      expect(screen.getByText(recipe.name)).toBeInTheDocument();
    });

    // Should show count
    expect(screen.getByText('5 of 5 recipes')).toBeInTheDocument();
  });

  it('should enable virtualization for 100+ recipes', () => {
    const recipes = Array.from({ length: 150 }, (_, i) =>
      createMockRecipe(`recipe-${i}`, `Recipe ${i}`)
    );

    const { container } = renderWithProviders(
      <SavedRecipesSection {...defaultProps} recipes={recipes} allRecipesCount={150} />
    );

    // Should have scroll container with fixed height
    const scrollContainer = container.querySelector('[style*="height: 600px"]');
    expect(scrollContainer).toBeInTheDocument();

    // Should show count
    expect(screen.getByText('150 of 150 recipes')).toBeInTheDocument();
  });

  it('should render search input when recipes exist', () => {
    const recipes = [createMockRecipe('1', 'Test Recipe')];

    renderWithProviders(<SavedRecipesSection {...defaultProps} recipes={recipes} allRecipesCount={1} />);

    const searchInput = screen.getByPlaceholderText(
      'Search recipes by name, tags, cuisine, or difficulty...'
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('should call onSearchChange when typing in search', async () => {
    const user = userEvent.setup();
    const recipes = [createMockRecipe('1', 'Test Recipe')];
    const onSearchChange = vi.fn();

    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        recipes={recipes}
        allRecipesCount={1}
        onSearchChange={onSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search recipes by name, tags, cuisine, or difficulty...'
    );

    await user.type(searchInput, 'pasta');

    expect(onSearchChange).toHaveBeenCalledTimes(5); // p, a, s, t, a
  });

  it('should clear search when clicking clear button', async () => {
    const user = userEvent.setup();
    const recipes = [createMockRecipe('1', 'Test Recipe')];
    const onSearchChange = vi.fn();

    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        recipes={recipes}
        allRecipesCount={1}
        searchQuery="pasta"
        onSearchChange={onSearchChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('should toggle favorites filter', async () => {
    const user = userEvent.setup();
    const recipes = [createMockRecipe('1', 'Test Recipe', true)];
    const onToggleFavorites = vi.fn();

    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        recipes={recipes}
        allRecipesCount={10}
        onToggleFavorites={onToggleFavorites}
      />
    );

    const favoritesButton = screen.getByText('All');
    await user.click(favoritesButton);

    expect(onToggleFavorites).toHaveBeenCalledTimes(1);
  });

  it('should show favorites count when filter is active', () => {
    const recipes = [createMockRecipe('1', 'Test Recipe', true)];

    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        recipes={recipes}
        allRecipesCount={10}
        showFavoritesOnly={true}
      />
    );

    expect(screen.getByText('1 of 10 recipes (favorites)')).toBeInTheDocument();
  });

  it('should confirm before deleting all recipes', async () => {
    const user = userEvent.setup();
    const recipes = [createMockRecipe('1', 'Test Recipe')];
    const onDeleteAll = vi.fn().mockResolvedValue(undefined);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        recipes={recipes}
        allRecipesCount={1}
        onDeleteAll={onDeleteAll}
      />
    );

    const deleteAllButton = screen.getByText('Delete all');
    await user.click(deleteAllButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('Delete ALL saved recipes? This cannot be undone.');
      expect(onDeleteAll).toHaveBeenCalledTimes(1);
    });

    confirmSpy.mockRestore();
  });

  it('should not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const recipes = [createMockRecipe('1', 'Test Recipe')];
    const onDeleteAll = vi.fn();

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        recipes={recipes}
        allRecipesCount={1}
        onDeleteAll={onDeleteAll}
      />
    );

    const deleteAllButton = screen.getByText('Delete all');
    await user.click(deleteAllButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteAll).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should call onViewRecipe when recipe card is clicked', async () => {
    const user = userEvent.setup();
    const recipes = [createMockRecipe('1', 'Test Recipe')];
    const onViewRecipe = vi.fn();

    renderWithProviders(
      <SavedRecipesSection
        {...defaultProps}
        recipes={recipes}
        allRecipesCount={1}
        onViewRecipe={onViewRecipe}
      />
    );

    const recipeCard = screen.getByText('Test Recipe').closest('li');
    if (recipeCard) {
      await user.click(recipeCard);
      expect(onViewRecipe).toHaveBeenCalledWith('1');
    }
  });

  it('should render all recipes in grid for non-virtualized list', () => {
    const recipes = Array.from({ length: 50 }, (_, i) =>
      createMockRecipe(`recipe-${i}`, `Recipe ${i}`)
    );

    renderWithProviders(<SavedRecipesSection {...defaultProps} recipes={recipes} allRecipesCount={50} />);

    // All recipes should be rendered (no virtualization for < 100)
    recipes.forEach((recipe) => {
      expect(screen.getByText(recipe.name)).toBeInTheDocument();
    });
  });

  it('should maintain responsive grid layout', () => {
    const recipes = [
      createMockRecipe('1', 'Recipe 1'),
      createMockRecipe('2', 'Recipe 2'),
      createMockRecipe('3', 'Recipe 3'),
    ];

    const { container } = renderWithProviders(
      <SavedRecipesSection {...defaultProps} recipes={recipes} allRecipesCount={3} />
    );

    // Should have grid with responsive classes
    const grid = container.querySelector('.grid.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });
});
