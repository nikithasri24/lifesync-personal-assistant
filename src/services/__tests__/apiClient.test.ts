import { describe, it, expect } from 'vitest';
import { apiClient } from '../apiClient';

describe('ApiClient', () => {
  describe('API Structure', () => {
    it('should be a singleton instance', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient).toBe('object');
    });

    it('should have setAuthContext method', () => {
      expect(typeof apiClient.setAuthContext).toBe('function');
      // Should not throw when called
      expect(() => apiClient.setAuthContext('test-user')).not.toThrow();
      expect(() => apiClient.setAuthContext(null)).not.toThrow();
    });
  });

  describe('Task Operations', () => {
    it('should have all task methods', () => {
      expect(typeof apiClient.getTasks).toBe('function');
      expect(typeof apiClient.createTask).toBe('function');
      expect(typeof apiClient.updateTask).toBe('function');
      expect(typeof apiClient.deleteTask).toBe('function');
      expect(typeof apiClient.restoreTask).toBe('function');
      expect(typeof apiClient.permanentlyDeleteTask).toBe('function');
      expect(typeof apiClient.reorderTasks).toBe('function');
    });
  });

  describe('Project Operations', () => {
    it('should have all project methods', () => {
      expect(typeof apiClient.getProjects).toBe('function');
      expect(typeof apiClient.createProject).toBe('function');
      expect(typeof apiClient.updateProject).toBe('function');
      expect(typeof apiClient.deleteProject).toBe('function');
    });
  });

  describe('Habit Operations', () => {
    it('should have all habit methods', () => {
      expect(typeof apiClient.getHabits).toBe('function');
      expect(typeof apiClient.createHabit).toBe('function');
      expect(typeof apiClient.updateHabit).toBe('function');
      expect(typeof apiClient.deleteHabit).toBe('function');
      expect(typeof apiClient.addHabitEntry).toBe('function');
      expect(typeof apiClient.deleteHabitEntryForDate).toBe('function');
      expect(typeof apiClient.getHabitEntryForDate).toBe('function');
      expect(typeof apiClient.deleteAllHabitEntries).toBe('function');
    });
  });

  describe('Financial Operations', () => {
    it('should have all financial methods', () => {
      expect(typeof apiClient.getFinancialAccounts).toBe('function');
      expect(typeof apiClient.getFinancialTransactions).toBe('function');
      expect(typeof apiClient.createFinancialTransaction).toBe('function');
    });
  });

  describe('Shopping Operations', () => {
    it('should have all shopping methods', () => {
      expect(typeof apiClient.getShoppingLists).toBe('function');
      expect(typeof apiClient.createShoppingList).toBe('function');
      expect(typeof apiClient.getShoppingListItems).toBe('function');
      expect(typeof apiClient.addShoppingItem).toBe('function');
      expect(typeof apiClient.updateShoppingItem).toBe('function');
      expect(typeof apiClient.deleteShoppingItem).toBe('function');
    });
  });

  describe('Pantry Operations', () => {
    it('should have all pantry methods', () => {
      expect(typeof apiClient.getPantryItems).toBe('function');
      expect(typeof apiClient.createPantryItem).toBe('function');
      expect(typeof apiClient.updatePantryItem).toBe('function');
      expect(typeof apiClient.deletePantryItem).toBe('function');
    });
  });

  describe('Meal Planning Operations', () => {
    it('should have all meal planning methods', () => {
      expect(typeof apiClient.getMealPlans).toBe('function');
      expect(typeof apiClient.createMealPlan).toBe('function');
      expect(typeof apiClient.updateMealPlan).toBe('function');
      expect(typeof apiClient.deleteMealPlan).toBe('function');
      expect(typeof apiClient.createPlannedMeal).toBe('function');
      expect(typeof apiClient.updatePlannedMeal).toBe('function');
      expect(typeof apiClient.deletePlannedMeal).toBe('function');
    });
  });

  describe('Focus Session Operations', () => {
    it('should have all focus session methods', () => {
      expect(typeof apiClient.getFocusSessions).toBe('function');
      expect(typeof apiClient.createFocusSession).toBe('function');
      expect(typeof apiClient.updateFocusSession).toBe('function');
    });
  });

  describe('Recipe Operations', () => {
    it('should have all recipe methods', () => {
      expect(typeof apiClient.getRecipes).toBe('function');
      expect(typeof apiClient.createRecipe).toBe('function');
      expect(typeof apiClient.updateRecipe).toBe('function');
      expect(typeof apiClient.deleteRecipe).toBe('function');
    });
  });

  describe('Analytics Operations', () => {
    it('should have getAnalytics method', () => {
      expect(typeof apiClient.getAnalytics).toBe('function');
    });
  });

  describe('Health Check', () => {
    it('should have healthCheck method', () => {
      expect(typeof apiClient.healthCheck).toBe('function');
    });
  });
});
