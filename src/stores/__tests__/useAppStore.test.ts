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
      financialRecords: [],
      budgets: [],
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
          category: 'fitness',
          color: '#ef4444'
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
          category: 'fitness',
          color: '#ef4444'
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
          category: 'fitness',
          color: '#ef4444'
        });
      });

      const habitId = result.current.habits[0].id;

      act(() => {
        result.current.deleteHabit(habitId);
      });

      expect(result.current.habits).toHaveLength(0);
    });

    it('should complete a habit', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addHabit({
          name: 'Morning Exercise',
          description: 'Daily workout routine',
          frequency: 'daily',
          targetCount: 1,
          category: 'fitness',
          color: '#ef4444'
        });
      });

      const habitId = result.current.habits[0].id;

      act(() => {
        result.current.completeHabit(habitId, 'Great workout today!');
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
          category: 'meeting',
          tags: ['work'],
          isPinned: false
        });
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Meeting Notes');
      expect(result.current.notes[0].category).toBe('meeting');
    });

    it('should update a note', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addNote({
          title: 'Meeting Notes',
          content: 'Discussed project timeline',
          category: 'meeting',
          tags: ['work'],
          isPinned: false
        });
      });

      const noteId = result.current.notes[0].id;

      act(() => {
        result.current.updateNote(noteId, { isPinned: true });
      });

      expect(result.current.notes[0].isPinned).toBe(true);
    });
  });

  describe('Shopping Items', () => {
    it('should add a shopping item', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addShoppingItem({
          name: 'Milk',
          quantity: 2,
          category: 'groceries',
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
          category: 'groceries',
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