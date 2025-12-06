import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import { act, renderHook } from '@testing-library/react';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      habits: [],
      notes: [],
      todos: [],
      projects: [],
      journalEntries: [],
      shoppingItems: [],
      recipes: [],
      pantryItems: [],
      mealPlans: [],
      moodEntries: [],
      userStats: { level: 1, xp: 0, xpToNextLevel: 100, totalGoalsCompleted: 0 },
      activeView: 'dashboard',
      sidebarCollapsed: false,
    });
  });

  describe('Habits', () => {
    it('should add a habit', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addHabit({
          name: 'Morning Exercise',
          description: 'Daily workout routine',
          frequency: 'daily',
          targetCount: 1,
          categoryId: 'wellness',
          color: '#ef4444',
          currentProgress: 0,
          streak: 0,
        });
      });

      expect(result.current.habits).toHaveLength(1);
      expect(result.current.habits[0].name).toBe('Morning Exercise');
      expect(result.current.habits[0].frequency).toBe('daily');
    });

    it('should update a habit', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addHabit({
          name: 'Morning Exercise',
          description: 'Daily workout routine',
          frequency: 'daily',
          targetCount: 1,
          categoryId: 'wellness',
          color: '#ef4444',
          currentProgress: 0,
          streak: 0,
        });
      });

      const habitId = result.current.habits[0].id;

      act(() => {
        result.current.updateHabit(habitId, { name: 'Evening Exercise' });
      });

      expect(result.current.habits[0].name).toBe('Evening Exercise');
    });

    it('should delete a habit', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addHabit({
          name: 'Morning Exercise',
          description: 'Daily workout routine',
          frequency: 'daily',
          targetCount: 1,
          categoryId: 'wellness',
          color: '#ef4444',
          currentProgress: 0,
          streak: 0,
        });
      });

      const habitId = result.current.habits[0].id;

      act(() => {
        result.current.deleteHabit(habitId);
    });

      expect(result.current.habits).toHaveLength(0);
    });

    it('should update habit details via updateHabit', async () => {
      const { result } = renderHook(() => useAppStore());

      let habitId: string;
      await act(async () => {
        const created = await result.current.addHabit({
          name: 'Morning Exercise',
          description: 'Daily workout routine',
          frequency: 'daily',
          targetCount: 1,
          categoryId: 'wellness',
          color: '#ef4444',
          currentProgress: 0,
          streak: 0,
        });
        habitId = created.id;
      });

      await act(async () => {
        await result.current.updateHabit(habitId!, {
          name: 'Evening Yoga',
          description: 'Relaxing stretch',
          frequency: 'weekly',
          targetCount: 3,
          categoryId: 'movement',
          color: '#10b981',
        });
      });

      const updated = result.current.habits.find((habit) => habit.id === habitId);
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Evening Yoga');
      expect(updated?.description).toBe('Relaxing stretch');
      expect(updated?.frequency).toBe('weekly');
      expect(updated?.targetCount).toBe(3);
      expect(updated?.categoryId).toBe('movement');
      expect(updated?.color).toBe('#10b981');
    });

    it('should accumulate multiple completions in a single day', async () => {
      const { result } = renderHook(() => useAppStore());

      let habitId: string;
      await act(async () => {
        const created = await result.current.addHabit({
          name: 'Water Intake',
          description: 'Drink water throughout the day',
          frequency: 'daily',
          targetCount: 2,
          categoryId: 'health',
          color: '#3b82f6',
          currentProgress: 0,
          streak: 0,
        });
        habitId = created.id;
      });

      await act(async () => {
        await result.current.completeHabit(habitId!);
        await result.current.completeHabit(habitId!);
      });

      const habit = result.current.habits.find((item) => item.id === habitId);
      expect(habit).toBeDefined();
      expect(habit?.currentProgress).toBe(2);
      expect(habit?.streak).toBe(2);
      expect(habit?.completions).toHaveLength(2);

      await act(async () => {
        await result.current.completeHabit(habitId!);
      });

      const updated = result.current.habits.find((item) => item.id === habitId);
      expect(updated?.currentProgress).toBe(3);
      expect(updated?.completions).toHaveLength(3);
    });

    it('should complete a habit', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addHabit({
          name: 'Morning Exercise',
          description: 'Daily workout routine',
          frequency: 'daily',
          targetCount: 1,
          categoryId: 'wellness',
          color: '#ef4444',
          currentProgress: 0,
          streak: 0,
        });
      });

      const habitId = result.current.habits[0].id;

      act(() => {
        result.current.completeHabit(habitId, { notes: 'Great workout today!' });
      });

      expect(result.current.habits[0].completions).toHaveLength(1);
      expect(result.current.habits[0].completions[0].notes).toBe('Great workout today!');
    });
  });

  describe('Todos', () => {
    it('should add a todo', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addTodo({
          title: 'Buy groceries',
          description: 'Get milk, bread, and eggs',
          priority: 'medium',
          completed: false,
           status: 'todo',
          tags: ['shopping'],
          estimatedTime: 30
        });
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('Buy groceries');
      expect(result.current.todos[0].priority).toBe('medium');
    });

    it('should toggle todo completion', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addTodo({
          title: 'Buy groceries',
          description: 'Get milk, bread, and eggs',
          priority: 'medium',
          completed: false,
           status: 'todo',
          tags: ['shopping'],
          estimatedTime: 30
        });
      });

      const todoId = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(todoId);
      });

      expect(result.current.todos[0].completed).toBe(true);

      act(() => {
        result.current.toggleTodo(todoId);
      });

      expect(result.current.todos[0].completed).toBe(false);
    });
  });

  describe('Notes', () => {
    it('should add a note', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addNote({
          title: 'Meeting Notes',
          content: 'Discussed project timeline',
          tags: ['work']
        });
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Meeting Notes');
      expect(result.current.notes[0].tags).toContain('work');
    });

    it('should update a note', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addNote({
          title: 'Meeting Notes',
          content: 'Discussed project timeline',
          tags: ['work']
        });
      });

      const noteId = result.current.notes[0].id;

      act(() => {
        result.current.updateNote(noteId, { title: 'Updated Notes' });
      });

      expect(result.current.notes[0].title).toBe('Updated Notes');
    });
  });

  describe('Shopping Items', () => {
    it('should add a shopping item', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addShoppingItem({
          name: 'Milk',
          quantity: 2,
          category: 'other',
          priority: 'medium',
          purchased: false
        });
      });

      expect(result.current.shoppingItems).toHaveLength(1);
      expect(result.current.shoppingItems[0].name).toBe('Milk');
      expect(result.current.shoppingItems[0].quantity).toBe(2);
    });

    it('should toggle shopping item purchase status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addShoppingItem({
          name: 'Milk',
          quantity: 2,
          category: 'other',
          priority: 'medium',
          purchased: false
        });
      });

      const itemId = result.current.shoppingItems[0].id;

      act(() => {
        result.current.toggleShoppingItem(itemId);
      });

      expect(result.current.shoppingItems[0].purchased).toBe(true);
    });
  });

  describe('UI State', () => {
    it('should set active view', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveView('habits');
      });

      expect(result.current.activeView).toBe('habits');
    });

    it('should toggle sidebar collapsed state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSidebarCollapsed(true);
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });
  });
});
