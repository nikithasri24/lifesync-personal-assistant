/**
 * Unit tests for ActivityView component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityView } from '../ActivityView';
import type { ActivityItem as ActivityItemType } from '../../../types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('../../ActivityItem', () => ({
  ActivityItem: ({ item, currentUserId }: { item: ActivityItemType; currentUserId: string }) => (
    <div data-testid={`activity-item-${item.id}`}>
      <div data-testid="user-name">{item.user_name}</div>
      <div data-testid="action">{item.action}</div>
      <div data-testid="module">{item.module}</div>
      <div data-testid="current-user">{currentUserId}</div>
    </div>
  ),
}));

describe('ActivityView', () => {
  const baseActivity: ActivityItemType = {
    id: 'activity-1',
    user_id: 'user-123',
    user_name: 'Alice Smith',
    user_avatar: null,
    module: 'meals',
    action: 'created',
    resource_type: 'meal_plan',
    resource_id: 'meal-1',
    description: 'Created weekly meal plan',
    timestamp: '2024-01-01T12:00:00Z',
    metadata: { planType: 'weekly' },
  };

  describe('Loading state', () => {
    it('should show loading message', () => {
      render(<ActivityView activities={[]} isLoading={true} currentUserId="user-123" />);

      expect(screen.getByText('Loading activity...')).toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      render(<ActivityView activities={[]} isLoading={true} currentUserId="user-123" />);

      expect(screen.queryByText('No recent activity')).not.toBeInTheDocument();
    });

    it('should not show activities when loading', () => {
      render(
        <ActivityView
          activities={[baseActivity]}
          isLoading={true}
          currentUserId="user-123"
        />
      );

      expect(screen.queryByTestId('activity-item-activity-1')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no activities', () => {
      render(<ActivityView activities={[]} isLoading={false} currentUserId="user-123" />);

      expect(screen.getByText('No recent activity')).toBeInTheDocument();
      expect(
        screen.getByText(/Start collaborating with your partner/)
      ).toBeInTheDocument();
    });

    it('should show emoji in empty state', () => {
      render(<ActivityView activities={[]} isLoading={false} currentUserId="user-123" />);

      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('should show descriptive text in empty state', () => {
      render(<ActivityView activities={[]} isLoading={false} currentUserId="user-123" />);

      expect(
        screen.getByText(/Start collaborating with your partner and activity will appear here/)
      ).toBeInTheDocument();
    });
  });

  describe('Activities display', () => {
    it('should render single activity', () => {
      render(
        <ActivityView
          activities={[baseActivity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByTestId('activity-item-activity-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Alice Smith');
      expect(screen.getByTestId('action')).toHaveTextContent('created');
    });

    it('should render multiple activities', () => {
      const activities: ActivityItemType[] = [
        {
          ...baseActivity,
          id: 'activity-1',
          action: 'created',
          module: 'meals',
        },
        {
          ...baseActivity,
          id: 'activity-2',
          action: 'updated',
          module: 'shopping',
        },
        {
          ...baseActivity,
          id: 'activity-3',
          action: 'deleted',
          module: 'todos',
        },
      ];

      render(
        <ActivityView
          activities={activities}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('activity-item-activity-1')).toBeInTheDocument();
      expect(screen.getByTestId('activity-item-activity-2')).toBeInTheDocument();
      expect(screen.getByTestId('activity-item-activity-3')).toBeInTheDocument();
    });

    it('should show header when activities exist', () => {
      render(
        <ActivityView
          activities={[baseActivity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should not show empty state when activities exist', () => {
      render(
        <ActivityView
          activities={[baseActivity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.queryByText('No recent activity')).not.toBeInTheDocument();
    });
  });

  describe('Activity properties', () => {
    it('should pass current user ID to activity items', () => {
      render(
        <ActivityView
          activities={[baseActivity]}
          isLoading={false}
          currentUserId="user-456"
        />
      );

      expect(screen.getByTestId('current-user')).toHaveTextContent('user-456');
    });

    it('should render activity with different modules', () => {
      const modules: Array<ActivityItemType['module']> = [
        'meals',
        'shopping',
        'todos',
        'goals',
        'habits',
      ];

      modules.forEach((module, index) => {
        const activity = { ...baseActivity, id: `activity-${index}`, module };

        const { unmount } = render(
          <ActivityView
            activities={[activity]}
            isLoading={false}
            currentUserId="user-123"
          />
        );

        expect(screen.getByTestId('module')).toHaveTextContent(module);
        unmount();
      });
    });

    it('should render activity with different actions', () => {
      const actions: Array<ActivityItemType['action']> = [
        'created',
        'updated',
        'deleted',
        'completed',
      ];

      actions.forEach((action, index) => {
        const activity = { ...baseActivity, id: `activity-${index}`, action };

        const { unmount } = render(
          <ActivityView
            activities={[activity]}
            isLoading={false}
            currentUserId="user-123"
          />
        );

        expect(screen.getByTestId('action')).toHaveTextContent(action);
        unmount();
      });
    });

    it('should render activity with metadata', () => {
      const activity = {
        ...baseActivity,
        metadata: { priority: 'high', tags: ['work', 'urgent'] },
      };

      render(
        <ActivityView
          activities={[activity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('activity-item-activity-1')).toBeInTheDocument();
    });

    it('should render activity without metadata', () => {
      const activity = {
        ...baseActivity,
        metadata: null,
      };

      render(
        <ActivityView
          activities={[activity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('activity-item-activity-1')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle activity with long user name', () => {
      const activity = {
        ...baseActivity,
        user_name: 'Alexander Maximilian Christopher Wellington III',
      };

      render(
        <ActivityView
          activities={[activity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent(
        'Alexander Maximilian Christopher Wellington III'
      );
    });

    it('should handle activity with special characters in name', () => {
      const activity = {
        ...baseActivity,
        user_name: "O'Brien-Smith",
      };

      render(
        <ActivityView
          activities={[activity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent("O'Brien-Smith");
    });

    it('should handle activity with long description', () => {
      const activity = {
        ...baseActivity,
        description:
          'This is a very long description that contains a lot of details about what happened in this particular activity event',
      };

      render(
        <ActivityView
          activities={[activity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('activity-item-activity-1')).toBeInTheDocument();
    });

    it('should handle many activities', () => {
      const activities = Array.from({ length: 20 }, (_, i) => ({
        ...baseActivity,
        id: `activity-${i}`,
      }));

      render(
        <ActivityView
          activities={activities}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getAllByTestId(/^activity-item-/)).toHaveLength(20);
    });

    it('should handle different current user IDs', () => {
      const { rerender } = render(
        <ActivityView
          activities={[baseActivity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('current-user')).toHaveTextContent('user-123');

      rerender(
        <ActivityView
          activities={[baseActivity]}
          isLoading={false}
          currentUserId="user-456"
        />
      );

      expect(screen.getByTestId('current-user')).toHaveTextContent('user-456');
    });
  });

  describe('Activity ordering', () => {
    it('should render activities in order', () => {
      const activities: ActivityItemType[] = [
        { ...baseActivity, id: 'activity-1', timestamp: '2024-01-01T12:00:00Z' },
        { ...baseActivity, id: 'activity-2', timestamp: '2024-01-01T11:00:00Z' },
        { ...baseActivity, id: 'activity-3', timestamp: '2024-01-01T10:00:00Z' },
      ];

      const { container } = render(
        <ActivityView
          activities={activities}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      const items = container.querySelectorAll('[data-testid^="activity-item-"]');
      expect(items[0]).toHaveAttribute('data-testid', 'activity-item-activity-1');
      expect(items[1]).toHaveAttribute('data-testid', 'activity-item-activity-2');
      expect(items[2]).toHaveAttribute('data-testid', 'activity-item-activity-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <ActivityView
          activities={[baseActivity]}
          isLoading={false}
          currentUserId="user-123"
        />
      );

      const heading = screen.getByRole('heading', { name: 'Recent Activity' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });
  });
});
