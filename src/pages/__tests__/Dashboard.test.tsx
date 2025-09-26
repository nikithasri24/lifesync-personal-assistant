import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dashboard from '../Dashboard';
import { useAppStore } from '../../stores/useAppStore';

vi.mock('../../stores/useAppStore');

function createStore(overrides: Record<string, unknown> = {}) {
  const now = new Date();

  return {
    tasks: [
      {
        id: 'task-1',
        title: 'Prepare quarterly report',
        description: 'Collect financial metrics',
        status: 'todo' as const,
        deleted: false,
        priority: 'medium',
        dueDate: now,
        createdAt: now,
        updatedAt: now,
        completedAt: undefined,
        tags: ['finance'],
      },
    ],
    habits: [
      {
        id: 'habit-1',
        name: 'Morning stretch',
        description: 'Quick routine to start the day',
        frequency: 'daily',
        targetCount: 1,
        completions: [],
        category: 'wellness',
        color: '#6366f1',
        createdAt: now,
      },
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Budget review agenda',
        content: 'Discuss cost optimisations',
        tags: ['budget', 'team'],
        category: 'work',
        createdAt: now,
        updatedAt: now,
        isPinned: false,
      },
    ],
    journalEntries: [
      {
        id: 'journal-1',
        title: 'Weekly reflection',
        content: 'Felt productive',
        createdAt: now.toISOString(),
      },
    ],
    completeHabit: vi.fn().mockResolvedValue(undefined),
    toggleTodo: vi.fn().mockResolvedValue(undefined),
    setActiveView: vi.fn(),
    tasksLoading: false,
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
    ...overrides,
  };
}

function renderDashboard(overrides: Record<string, unknown> = {}) {
  const store = createStore(overrides);
  vi.mocked(useAppStore).mockReturnValue(store as any);

  render(<Dashboard />);
  act(() => {
    vi.runAllTimers();
  });

  return store;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('Dashboard', () => {
  it('renders the welcome hero once loading finishes', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('shows the primary stats cards with counts', () => {
    renderDashboard();

    // The cards include a small label and a heading with the same text.
    // Query the card labels specifically to avoid duplication errors.
    expect(screen.getAllByText(/today's tasks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/pending habits/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/total notes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/week's progress/i).length).toBeGreaterThan(0);
  });

  it('lists today’s tasks and allows completing one', () => {
    const store = renderDashboard();

    expect(screen.getByText('Prepare quarterly report')).toBeInTheDocument();

    const completeButton = screen.getByTitle('Mark as complete');
    fireEvent.click(completeButton);

    expect(store.toggleTodo).toHaveBeenCalledWith('task-1');
  });

  it('shows today’s habits and allows recording a completion', async () => {
    const store = renderDashboard({ habits: [
      {
        id: 'habit-1',
        name: 'Morning stretch',
        description: 'Quick routine to start the day',
        frequency: 'daily',
        targetCount: 1,
        completions: [],
        category: 'wellness',
        color: '#6366f1',
        createdAt: new Date(),
      },
    ]});

    expect(screen.getByText(/today's habits/i)).toBeInTheDocument();
    expect(screen.getByText('Morning stretch')).toBeInTheDocument();

    const completeButtons = screen.getAllByRole('button', { name: /^complete$/i });
    const completeButton = completeButtons.find(btn => !(btn as HTMLButtonElement).disabled) as HTMLButtonElement;
    expect(completeButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(completeButton);
      await Promise.resolve();
    });
    expect(store.completeHabit).toHaveBeenCalledWith('habit-1');
  });

  it('navigates when a stats card is clicked', () => {
    const store = renderDashboard();

    const statsGrid = screen.getByRole('heading', { name: /welcome back/i }).parentElement?.parentElement?.nextElementSibling;
    expect(statsGrid).toBeTruthy();
    if (statsGrid) {
      const firstCard = within(statsGrid).getByText("Today's Tasks").closest('div');
      expect(firstCard).not.toBeNull();
      if (firstCard) {
        fireEvent.click(firstCard);
      }
    }

    expect(store.setActiveView).toHaveBeenCalledWith('todos');
  });

  it('renders empty states when there is no data', () => {
    renderDashboard({
      tasks: [],
      habits: [],
      notes: [],
      journalEntries: [],
    });

    expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    expect(screen.getByText(/all habits completed/i)).toBeInTheDocument();
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });
});
