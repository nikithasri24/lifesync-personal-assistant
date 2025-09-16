import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import Dashboard from '../Dashboard';
import { useAppStore } from '../../stores/useAppStore';

// Mock the store
vi.mock('../../stores/useAppStore');

const mockStore = {
  todos: [
    {
      id: '1',
      title: 'Test todo',
      description: 'Test description',
      completed: false,
      priority: 'medium',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: new Date()
    }
  ],
  habits: [
    {
      id: '1',
      name: 'Test habit',
      description: 'Test habit description',
      frequency: 'daily',
      targetCount: 1,
      completions: [],
      createdAt: new Date(),
      category: 'health',
      color: '#ef4444'
    }
  ],
  notes: [
    {
      id: '1',
      title: 'Test note',
      content: 'Test note content',
      tags: ['test'],
      category: 'personal',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false
    }
  ],
  journalEntries: [],
  addTodo: vi.fn(),
  completeHabit: vi.fn(),
  setActiveView: vi.fn(),
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue(mockStore);
  });

  it('renders welcome message', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
  });

  it('displays stats cards', () => {
    render(<Dashboard />);
    
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.getByText('Pending Habits')).toBeInTheDocument();
    expect(screen.getByText('Total Notes')).toBeInTheDocument();
    expect(screen.getByText("Week's Progress")).toBeInTheDocument();
  });

  it('shows today\'s tasks section', () => {
    render(<Dashboard />);
    
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  it('shows today\'s habits section', () => {
    render(<Dashboard />);
    
    expect(screen.getByText("Today's Habits")).toBeInTheDocument();
    expect(screen.getByText('Test habit')).toBeInTheDocument();
  });

  it('shows recent notes section', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Recent Notes')).toBeInTheDocument();
    expect(screen.getByText('Test note')).toBeInTheDocument();
  });

  it('navigates to todos when stats card is clicked', () => {
    render(<Dashboard />);
    
    const todosCard = screen.getByText("Today's Tasks").closest('div');
    if (todosCard) {
      fireEvent.click(todosCard);
      expect(mockStore.setActiveView).toHaveBeenCalledWith('todos');
    }
  });

  it('completes habit when button is clicked', () => {
    render(<Dashboard />);
    
    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);
    expect(mockStore.completeHabit).toHaveBeenCalledWith('1');
  });

  it('displays empty state when no data', () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...mockStore,
      todos: [],
      habits: [],
      notes: []
    });

    render(<Dashboard />);
    
    expect(screen.getByText('No tasks for today! 🎉')).toBeInTheDocument();
    expect(screen.getByText('All habits completed! ✨')).toBeInTheDocument();
    expect(screen.getByText('No notes yet. Start writing!')).toBeInTheDocument();
  });
});