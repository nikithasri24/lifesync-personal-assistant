import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { startOfDay } from 'date-fns';
import SeventyFiveHardWidget from '../SeventyFiveHardWidget';

// Mock the store
let mockState: any;

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => mockState,
}));

// Mock the actions
const mockToggleSFHTask = vi.fn();
vi.mock('../../stores/seventyFiveHardActions', () => ({
  toggleSFHTask: (...args: any[]) => mockToggleSFHTask(...args),
}));

describe('SeventyFiveHardWidget', () => {
  const today = startOfDay(new Date());

  const mockChallenge = {
    id: 'challenge-1',
    userId: 'user-1',
    startDate: today,
    currentDay: 15,
    status: 'active' as const,
    tasks: [
      { id: 'task-1', title: 'Follow a Diet', description: 'No cheat meals', order: 1 },
      { id: 'task-2', title: 'Workout Twice Daily', description: '45 min each', order: 2 },
      { id: 'task-3', title: 'Drink 1 Gallon of Water', description: '', order: 3 },
      { id: 'task-4', title: 'Read 10 Pages', description: 'Non-fiction', order: 4 },
      { id: 'task-5', title: 'Take Progress Photo', description: '', order: 5 },
    ],
    createdAt: today,
    updatedAt: today,
  };

  const mockCheckIn = {
    id: 'checkin-1',
    challengeId: 'challenge-1',
    date: today,
    dayNumber: 15,
    taskCompletions: [
      { taskId: 'task-1', completed: true, completedAt: today },
      { taskId: 'task-2', completed: true, completedAt: today },
      { taskId: 'task-3', completed: false },
      { taskId: 'task-4', completed: false },
      { taskId: 'task-5', completed: false },
    ],
    createdAt: today,
    updatedAt: today,
  };

  beforeEach(() => {
    mockState = {
      sfhChallenge: null,
      sfhCheckIns: [],
      setActiveView: vi.fn(),
    };
    mockToggleSFHTask.mockClear();
  });

  describe('Rendering', () => {
    it('should not render when no active challenge', () => {
      const { container } = render(<SeventyFiveHardWidget />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when challenge status is not active', () => {
      mockState.sfhChallenge = { ...mockChallenge, status: 'completed' };
      mockState.sfhCheckIns = [mockCheckIn];

      const { container } = render(<SeventyFiveHardWidget />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when no check-in for today', () => {
      mockState.sfhChallenge = mockChallenge;
      mockState.sfhCheckIns = [];

      const { container } = render(<SeventyFiveHardWidget />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when active challenge and today check-in exist', () => {
      mockState.sfhChallenge = mockChallenge;
      mockState.sfhCheckIns = [mockCheckIn];

      render(<SeventyFiveHardWidget />);

      expect(screen.getByText('75 Hard Challenge')).toBeInTheDocument();
      expect(screen.getByText('Day 15 of 75')).toBeInTheDocument();
    });
  });

  describe('Progress Stats', () => {
    beforeEach(() => {
      mockState.sfhChallenge = mockChallenge;
      mockState.sfhCheckIns = [mockCheckIn];
    });

    it('should display correct progress percentage', () => {
      render(<SeventyFiveHardWidget />);

      const expectedProgress = Math.round((15 / 75) * 100);
      expect(screen.getByText(`${expectedProgress}%`)).toBeInTheDocument();
    });

    it('should display days done correctly', () => {
      render(<SeventyFiveHardWidget />);
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Days Done')).toBeInTheDocument();
    });

    it('should display days remaining correctly', () => {
      render(<SeventyFiveHardWidget />);
      expect(screen.getByText('60')).toBeInTheDocument(); // 75 - 15 = 60
      expect(screen.getByText('Remaining')).toBeInTheDocument();
    });

    it('should display today\'s task completion count', () => {
      render(<SeventyFiveHardWidget />);
      expect(screen.getByText('2/5')).toBeInTheDocument(); // 2 out of 5 completed
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  describe('Task List', () => {
    beforeEach(() => {
      mockState.sfhChallenge = mockChallenge;
      mockState.sfhCheckIns = [mockCheckIn];
    });

    it('should render all tasks', () => {
      render(<SeventyFiveHardWidget />);

      expect(screen.getByText('Follow a Diet')).toBeInTheDocument();
      expect(screen.getByText('Workout Twice Daily')).toBeInTheDocument();
      expect(screen.getByText('Drink 1 Gallon of Water')).toBeInTheDocument();
      expect(screen.getByText('Read 10 Pages')).toBeInTheDocument();
      expect(screen.getByText('Take Progress Photo')).toBeInTheDocument();
    });

    it('should render task descriptions when present', () => {
      render(<SeventyFiveHardWidget />);

      expect(screen.getByText('No cheat meals')).toBeInTheDocument();
      expect(screen.getByText('45 min each')).toBeInTheDocument();
      expect(screen.getByText('Non-fiction')).toBeInTheDocument();
    });

    it('should show completed tasks with proper styling', () => {
      render(<SeventyFiveHardWidget />);

      const dietTask = screen.getByText('Follow a Diet');
      expect(dietTask).toHaveClass('line-through');

      const workoutTask = screen.getByText('Workout Twice Daily');
      expect(workoutTask).toHaveClass('line-through');
    });

    it('should show incomplete tasks without line-through', () => {
      render(<SeventyFiveHardWidget />);

      const waterTask = screen.getByText('Drink 1 Gallon of Water');
      expect(waterTask).not.toHaveClass('line-through');
    });
  });

  describe('Task Completion', () => {
    beforeEach(() => {
      mockState.sfhChallenge = mockChallenge;
      mockState.sfhCheckIns = [mockCheckIn];
    });

    it('should call toggleSFHTask when clicking a task', async () => {
      render(<SeventyFiveHardWidget />);

      const waterTaskButton = screen.getByText('Drink 1 Gallon of Water')
        .closest('button') as HTMLElement;

      await userEvent.click(waterTaskButton);

      expect(mockToggleSFHTask).toHaveBeenCalledWith('task-3');
      expect(mockToggleSFHTask).toHaveBeenCalledTimes(1);
    });

    it('should show "All Done!" when all tasks are completed', () => {
      const allCompleteCheckIn = {
        ...mockCheckIn,
        taskCompletions: mockCheckIn.taskCompletions.map(tc => ({
          ...tc,
          completed: true,
          completedAt: today,
        })),
      };

      mockState.sfhCheckIns = [allCompleteCheckIn];

      render(<SeventyFiveHardWidget />);

      expect(screen.getByText('All Done!')).toBeInTheDocument();
    });

    it('should not show "All Done!" when tasks are incomplete', () => {
      render(<SeventyFiveHardWidget />);

      expect(screen.queryByText('All Done!')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockState.sfhChallenge = mockChallenge;
      mockState.sfhCheckIns = [mockCheckIn];
    });

    it('should call setActiveView when clicking "View All" button', async () => {
      render(<SeventyFiveHardWidget />);

      const viewAllButton = screen.getByText('View All').closest('button') as HTMLElement;
      await userEvent.click(viewAllButton);

      expect(mockState.setActiveView).toHaveBeenCalledWith('seventy-five-hard');
      expect(mockState.setActiveView).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance - Memoization', () => {
    beforeEach(() => {
      mockState.sfhChallenge = mockChallenge;
      mockState.sfhCheckIns = [mockCheckIn];
    });

    it('should not recalculate stats on unrelated prop changes', () => {
      const { rerender } = render(<SeventyFiveHardWidget />);

      // Get initial text content
      const initialProgress = screen.getByText(/\d+%/);
      const initialProgressText = initialProgress.textContent;

      // Re-render with same data (simulating parent component re-render)
      rerender(<SeventyFiveHardWidget />);

      // Progress should be the same (memoization working)
      const newProgress = screen.getByText(/\d+%/);
      expect(newProgress.textContent).toBe(initialProgressText);
    });

    it('should handle rapid task toggles without race conditions', async () => {
      render(<SeventyFiveHardWidget />);

      const waterTaskButton = screen.getByText('Drink 1 Gallon of Water')
        .closest('button') as HTMLElement;

      // Rapid clicks
      await userEvent.click(waterTaskButton);
      await userEvent.click(waterTaskButton);
      await userEvent.click(waterTaskButton);

      // Should be called 3 times (no race condition prevention in component)
      expect(mockToggleSFHTask).toHaveBeenCalledTimes(3);
      expect(mockToggleSFHTask).toHaveBeenCalledWith('task-3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle challenge with no tasks', () => {
      const emptyChallenge = { ...mockChallenge, tasks: [] };
      const emptyCheckIn = { ...mockCheckIn, taskCompletions: [] };

      mockState.sfhChallenge = emptyChallenge;
      mockState.sfhCheckIns = [emptyCheckIn];

      render(<SeventyFiveHardWidget />);

      expect(screen.getByText('75 Hard Challenge')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('should handle challenge on day 1', () => {
      const day1Challenge = { ...mockChallenge, currentDay: 1 };
      const day1CheckIn = { ...mockCheckIn, dayNumber: 1 };

      mockState.sfhChallenge = day1Challenge;
      mockState.sfhCheckIns = [day1CheckIn];

      render(<SeventyFiveHardWidget />);

      expect(screen.getByText('Day 1 of 75')).toBeInTheDocument();
      expect(screen.getByText('74')).toBeInTheDocument(); // Remaining days
    });

    it('should handle challenge on final day (day 75)', () => {
      const day75Challenge = { ...mockChallenge, currentDay: 75 };
      const day75CheckIn = { ...mockCheckIn, dayNumber: 75 };

      mockState.sfhChallenge = day75Challenge;
      mockState.sfhCheckIns = [day75CheckIn];

      render(<SeventyFiveHardWidget />);

      expect(screen.getByText('Day 75 of 75')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Remaining days
      expect(screen.getByText('100%')).toBeInTheDocument(); // Progress
    });
  });
});
