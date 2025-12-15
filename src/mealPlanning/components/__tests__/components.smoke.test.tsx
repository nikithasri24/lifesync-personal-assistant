/**
 * MealPlanning Components Smoke Tests
 * Basic rendering tests to ensure components don't crash
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MealItem } from '../mealPlan/MealItem';
// import { MealCell } from '../mealPlan/MealCell'; // Component doesn't exist
import { CellWithMeals } from '../mealPlan/CellWithMeals';
import { AddMealControl } from '../mealPlan/AddMealControl';
import type { PlannedMeal, Recipe } from '../../../types';

// Mock the hooks
vi.mock('../../hooks/useMealPlanningQuery', () => ({
  useRecipesQuery: () => ({ data: [], isLoading: false }),
  useMealPlansQuery: () => ({ data: [], isLoading: false }),
  useUpdatePlannedMealMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePlannedMealMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCreatePlannedMealMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateRecipeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRecipeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateMealPlanMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../stores', () => ({
  useAppStore: () => ({
    mealOptions: {
      breakfast: ['Oatmeal', 'Toast'],
      lunch: ['Sandwich', 'Salad'],
      dinner: ['Pasta', 'Chicken'],
      snack: ['Apple', 'Nuts'],
    },
    weekStartsOn: 0,
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

describe('MealPlanning Components - Smoke Tests', () => {
  const mockMeal: PlannedMeal = {
    id: 'meal-1',
    mealPlanId: 'plan-1',
    date: new Date('2024-01-15'),
    mealType: 'breakfast',
    customMeal: 'Oatmeal',
    servings: 2,
    peopleCount: 2,
    status: 'planned',
    createdAt: new Date('2024-01-10'),
  };

  const mockRecipe: Recipe = {
    id: 'recipe-1',
    name: 'Pancakes',
    description: 'Fluffy pancakes',
    ingredients: [{ name: 'Flour', amount: '2 cups' }],
    instructions: ['Mix ingredients', 'Cook on griddle'],
    servings: 4,
    createdAt: new Date('2024-01-01'),
  };

  describe('MealItem', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <MealItem
          meal={mockMeal}
          recipes={[mockRecipe]}
          onShowRecipeForm={vi.fn()}
          onShowSimpleEdit={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );
      expect(container).toBeInTheDocument();
    });
  });

  // describe('MealCell', () => {
  //   it('renders without crashing', () => {
  //     const { container } = render(
  //       <MealCell
  //         dateKey="2024-01-15"
  //         date={new Date('2024-01-15')}
  //         mealType="breakfast"
  //         dayMeals={[mockMeal]}
  //         recipes={[mockRecipe]}
  //         plannedMeals={[mockMeal]}
  //         activePlan={null}
  //         isSelected={false}
  //         onClick={vi.fn()}
  //       >
  //         <div>Cell content</div>
  //       </MealCell>,
  //       { wrapper: createWrapper() }
  //     );
  //     expect(container).toBeInTheDocument();
  //   });
  // });

  describe('CellWithMeals', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <CellWithMeals
          dateKey="2024-01-15"
          mealType="breakfast"
          dayMeals={[mockMeal]}
          recipes={[mockRecipe]}
          onShowRecipeForm={vi.fn()}
          onShowSimpleEdit={vi.fn()}
          renderAddControl={() => <div>Add control</div>}
        />,
        { wrapper: createWrapper() }
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('AddMealControl', () => {
    it('renders without crashing (full mode)', () => {
      const { container } = render(
        <AddMealControl
          dateKey="2024-01-15"
          mealType="breakfast"
          showByDefault={true}
          compact={false}
        />,
        { wrapper: createWrapper() }
      );
      expect(container).toBeInTheDocument();
    });

    it('renders without crashing (compact mode)', () => {
      const { container } = render(
        <AddMealControl
          dateKey="2024-01-15"
          mealType="lunch"
          showByDefault={false}
          compact={true}
        />,
        { wrapper: createWrapper() }
      );
      expect(container).toBeInTheDocument();
    });
  });
});
