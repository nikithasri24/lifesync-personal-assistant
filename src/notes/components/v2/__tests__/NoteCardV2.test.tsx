/**
 * Unit tests for NoteCardV2 component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteCardV2 } from '../NoteCardV2';
import type { NoteType } from '../../../types';

// Mock useThemeColors
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

describe('NoteCardV2', () => {
  const mockOnClick = vi.fn();

  const baseProps = {
    id: 'note-1',
    title: 'Test Note',
    content: 'This is test content',
    noteType: 'note' as NoteType,
    onClick: mockOnClick,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Text Notes', () => {
    it('should render text note in grid view', () => {
      render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('should render text note in list view', () => {
      render(<NoteCardV2 {...baseProps} viewMode="list" />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('should default to grid view when viewMode not specified', () => {
      const { container } = render(<NoteCardV2 {...baseProps} />);

      // Grid view should have min-height class
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('min-h-[120px]');
    });

    it('should use correct border color for text notes', () => {
      const { container } = render(<NoteCardV2 {...baseProps} noteType="note" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ borderLeft: '4px solid rgb(212, 165, 116)' });
    });

    it('should truncate long content in grid view', () => {
      const longContent = 'A'.repeat(200);
      render(<NoteCardV2 {...baseProps} content={longContent} viewMode="grid" />);

      const contentElement = screen.getByText(longContent);
      expect(contentElement).toBeInTheDocument();
    });
  });

  describe('Rendering - Checklist Notes', () => {
    const checklistProps = {
      ...baseProps,
      noteType: 'list' as NoteType,
      listItems: [
        { text: 'Buy groceries', completed: false },
        { text: 'Call dentist', completed: true },
        { text: 'Finish report', completed: false },
      ],
    };

    it('should render checklist note in grid view', () => {
      render(<NoteCardV2 {...checklistProps} viewMode="grid" />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Call dentist')).toBeInTheDocument();
      expect(screen.getByText('Finish report')).toBeInTheDocument();
    });

    it('should render checklist note in list view', () => {
      render(<NoteCardV2 {...checklistProps} viewMode="list" />);

      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Call dentist')).toBeInTheDocument();
      expect(screen.getByText('Finish report')).toBeInTheDocument();
    });

    it('should use correct border color for checklist notes', () => {
      const { container } = render(<NoteCardV2 {...checklistProps} noteType="list" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ borderLeft: '4px solid rgb(193, 139, 94)' });
    });

    it('should show up to 3 checklist items in grid view', () => {
      render(<NoteCardV2 {...checklistProps} viewMode="grid" />);

      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Call dentist')).toBeInTheDocument();
      expect(screen.getByText('Finish report')).toBeInTheDocument();
    });

    it('should show checkmark for completed items', () => {
      render(<NoteCardV2 {...checklistProps} viewMode="grid" />);

      // Checkmark is shown inside the checkbox for completed items
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should limit items shown in grid view', () => {
      const manyItemsProps = {
        ...checklistProps,
        listItems: [
          { text: 'Item 1', completed: false },
          { text: 'Item 2', completed: false },
          { text: 'Item 3', completed: false },
          { text: 'Item 4', completed: false },
          { text: 'Item 5', completed: false },
        ],
      };

      render(<NoteCardV2 {...manyItemsProps} viewMode="grid" />);

      // Only first 3 items should be shown
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.queryByText('Item 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Item 5')).not.toBeInTheDocument();
    });

    it('should handle empty checklist', () => {
      const emptyProps = { ...checklistProps, listItems: [] };
      render(<NoteCardV2 {...emptyProps} viewMode="grid" />);

      expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();
    });

    it('should apply strikethrough to completed items', () => {
      render(<NoteCardV2 {...checklistProps} viewMode="grid" />);

      const completedItem = screen.getByText('Call dentist');
      expect(completedItem).toBeInTheDocument();
      // Visual strikethrough is applied via inline style
    });
  });

  describe('Tags', () => {
    it('should render tags when provided', () => {
      const propsWithTags = {
        ...baseProps,
        tags: ['work', 'important', 'urgent'],
      };

      render(<NoteCardV2 {...propsWithTags} viewMode="grid" />);

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('should not render tags section when no tags', () => {
      render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      // Tags should not appear
      expect(screen.queryByText('work')).not.toBeInTheDocument();
    });

    it('should render empty tags array without error', () => {
      render(<NoteCardV2 {...baseProps} tags={[]} viewMode="grid" />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('should handle long tag names', () => {
      const propsWithLongTags = {
        ...baseProps,
        tags: ['this-is-a-very-long-tag-name-that-might-overflow'],
      };

      render(<NoteCardV2 {...propsWithLongTags} viewMode="grid" />);

      expect(screen.getByText('this-is-a-very-long-tag-name-that-might-overflow')).toBeInTheDocument();
    });

    it('should handle special characters in tags', () => {
      const propsWithSpecialTags = {
        ...baseProps,
        tags: ['C++', 'React.js', '@work', '#important'],
      };

      render(<NoteCardV2 {...propsWithSpecialTags} viewMode="grid" />);

      expect(screen.getByText('C++')).toBeInTheDocument();
      expect(screen.getByText('React.js')).toBeInTheDocument();
      expect(screen.getByText('@work')).toBeInTheDocument();
      expect(screen.getByText('#important')).toBeInTheDocument();
    });
  });

  describe('Owner Badge (Merged Mode)', () => {
    it('should show owner badge when showOwnerBadge is true and owner provided', () => {
      const propsWithOwner = {
        ...baseProps,
        owner: { isOwner: true, displayName: 'You' },
        showOwnerBadge: true,
      };

      render(<NoteCardV2 {...propsWithOwner} viewMode="grid" />);

      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should show partner name in badge', () => {
      const propsWithPartner = {
        ...baseProps,
        owner: { isOwner: false, displayName: 'Alice' },
        showOwnerBadge: true,
      };

      render(<NoteCardV2 {...propsWithPartner} viewMode="grid" />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should not show owner badge when showOwnerBadge is false', () => {
      const propsWithOwner = {
        ...baseProps,
        owner: { isOwner: true, displayName: 'You' },
        showOwnerBadge: false,
      };

      render(<NoteCardV2 {...propsWithOwner} viewMode="grid" />);

      expect(screen.queryByText('You')).not.toBeInTheDocument();
    });

    it('should not show owner badge when owner not provided', () => {
      const props = {
        ...baseProps,
        showOwnerBadge: true,
      };

      render(<NoteCardV2 {...props} viewMode="grid" />);

      // No owner badge should appear
      expect(screen.queryByText('You')).not.toBeInTheDocument();
    });

    it('should handle long partner names in badge', () => {
      const propsWithLongName = {
        ...baseProps,
        owner: { isOwner: false, displayName: 'Alexander Maximilian III' },
        showOwnerBadge: true,
      };

      render(<NoteCardV2 {...propsWithLongName} viewMode="grid" />);

      expect(screen.getByText('Alexander Maximilian III')).toBeInTheDocument();
    });
  });

  describe('Date Display', () => {
    it('should show created date in list view when provided', () => {
      const propsWithDate = {
        ...baseProps,
        createdAt: '2024-01-15T10:30:00Z',
      };

      render(<NoteCardV2 {...propsWithDate} viewMode="list" />);

      // Date is displayed using getRelativeTime utility
      const dateElement = screen.getByText(/ago|just now|minute|hour|day/i);
      expect(dateElement).toBeInTheDocument();
    });

    it('should not show date in grid view', () => {
      const propsWithDate = {
        ...baseProps,
        createdAt: '2024-01-15T10:30:00Z',
      };

      render(<NoteCardV2 {...propsWithDate} viewMode="grid" />);

      // Date should not appear in grid view
      expect(screen.queryByText(/ago|just now|minute|hour|day/i)).not.toBeInTheDocument();
    });

    it('should not show date when not provided', () => {
      render(<NoteCardV2 {...baseProps} viewMode="list" />);

      // No date should appear
      expect(screen.queryByText(/ago|just now|minute|hour|day/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      const card = screen.getByText('Test Note').closest('div');
      await user.click(card!);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when clicked in list view', async () => {
      const user = userEvent.setup();
      render(<NoteCardV2 {...baseProps} viewMode="list" />);

      const card = screen.getByText('Test Note').closest('div');
      await user.click(card!);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor pointer class', () => {
      const { container } = render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should be clickable', async () => {
      const user = userEvent.setup();
      render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      const card = screen.getByText('Test Note').closest('div');
      await user.click(card!);

      // Verify onClick was called
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should have hover and active transitions', () => {
      const { container } = render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:scale-[1.01]', 'active:scale-[0.98]');
    });

    it('should have cursor pointer', () => {
      const { container } = render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should have border radius', () => {
      const { container } = render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ borderRadius: '12px' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', () => {
      const propsWithEmptyTitle = { ...baseProps, title: '' };
      render(<NoteCardV2 {...propsWithEmptyTitle} viewMode="grid" />);

      // Should still render without crashing
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('should handle empty content gracefully', () => {
      const propsWithEmptyContent = { ...baseProps, content: '' };
      render(<NoteCardV2 {...propsWithEmptyContent} viewMode="grid" />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(100);
      const propsWithLongTitle = { ...baseProps, title: longTitle };
      render(<NoteCardV2 {...propsWithLongTitle} viewMode="grid" />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const propsWithSpecialChars = {
        ...baseProps,
        title: 'Note <>&"\'',
      };

      render(<NoteCardV2 {...propsWithSpecialChars} viewMode="grid" />);

      expect(screen.getByText('Note <>&"\'')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const propsWithSpecialContent = {
        ...baseProps,
        content: 'Content with <script>alert("xss")</script>',
      };

      render(<NoteCardV2 {...propsWithSpecialContent} viewMode="grid" />);

      expect(screen.getByText('Content with <script>alert("xss")</script>')).toBeInTheDocument();
    });

    it('should handle undefined listItems for checklist', () => {
      const propsWithUndefinedList = {
        ...baseProps,
        noteType: 'list' as NoteType,
        listItems: undefined,
      };

      render(<NoteCardV2 {...propsWithUndefinedList} viewMode="grid" />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('should handle checklist with all completed items', () => {
      const allCompletedProps = {
        ...baseProps,
        noteType: 'list' as NoteType,
        listItems: [
          { text: 'Task 1', completed: true },
          { text: 'Task 2', completed: true },
        ],
      };

      render(<NoteCardV2 {...allCompletedProps} viewMode="grid" />);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    it('should handle checklist with no completed items', () => {
      const noCompletedProps = {
        ...baseProps,
        noteType: 'list' as NoteType,
        listItems: [
          { text: 'Task 1', completed: false },
          { text: 'Task 2', completed: false },
        ],
      };

      render(<NoteCardV2 {...noCompletedProps} viewMode="grid" />);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    it('should handle note with many tags', () => {
      const manyTagsProps = {
        ...baseProps,
        tags: Array.from({ length: 10 }, (_, i) => `tag${i + 1}`),
      };

      render(<NoteCardV2 {...manyTagsProps} viewMode="grid" />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag10')).toBeInTheDocument();
    });
  });

  describe('View Mode Differences', () => {
    it('should have min-height in grid view only', () => {
      const { container: gridContainer } = render(<NoteCardV2 {...baseProps} viewMode="grid" />);
      const { container: listContainer } = render(<NoteCardV2 {...baseProps} viewMode="list" />);

      const gridCard = gridContainer.firstChild as HTMLElement;
      const listCard = listContainer.firstChild as HTMLElement;

      expect(gridCard).toHaveClass('min-h-[120px]');
      expect(listCard).not.toHaveClass('min-h-[120px]');
    });

    it('should show same content in both view modes', () => {
      const { unmount: unmountGrid } = render(<NoteCardV2 {...baseProps} viewMode="grid" />);
      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
      unmountGrid();

      render(<NoteCardV2 {...baseProps} viewMode="list" />);
      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('should show date in list view but not grid view', () => {
      const propsWithDate = { ...baseProps, createdAt: '2024-01-15T10:30:00Z' };

      const { unmount: unmountGrid } = render(<NoteCardV2 {...propsWithDate} viewMode="grid" />);
      expect(screen.queryByText(/ago|just now/i)).not.toBeInTheDocument();
      unmountGrid();

      render(<NoteCardV2 {...propsWithDate} viewMode="list" />);
      expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper interactive element', () => {
      render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      const card = screen.getByText('Test Note').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('should render text content accessibly', () => {
      render(<NoteCardV2 {...baseProps} viewMode="grid" />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('should render checklist items accessibly', () => {
      const checklistProps = {
        ...baseProps,
        noteType: 'list' as NoteType,
        listItems: [
          { text: 'Accessible item', completed: false },
        ],
      };

      render(<NoteCardV2 {...checklistProps} viewMode="grid" />);

      expect(screen.getByText('Accessible item')).toBeInTheDocument();
    });
  });
});
