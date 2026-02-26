/**
 * Unit tests for JournalEntryCardV2 component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalEntryCardV2 } from '../JournalEntryCardV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF', card: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

vi.mock('@/components/v2', () => ({
  BadgeV2: ({ text, variant }: { text: string; variant: string }) => (
    <div data-testid="badge" data-variant={variant}>
      {text}
    </div>
  ),
}));

describe('JournalEntryCardV2', () => {
  const mockOnClick = vi.fn();

  const baseProps = {
    id: 'entry-1',
    content: '<p>This is my journal entry content</p>',
    createdAt: '2024-01-15T10:30:00Z',
    onClick: mockOnClick,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Basic', () => {
    it('should render entry with title', () => {
      render(<JournalEntryCardV2 {...baseProps} title="My Entry" />);

      expect(screen.getByText('My Entry')).toBeInTheDocument();
    });

    it('should render entry without title', () => {
      render(<JournalEntryCardV2 {...baseProps} />);

      expect(screen.getByText('Untitled Entry')).toBeInTheDocument();
    });

    it('should render content preview', () => {
      render(<JournalEntryCardV2 {...baseProps} />);

      // HTML tags should be stripped
      expect(screen.getByText('This is my journal entry content')).toBeInTheDocument();
    });

    it('should strip HTML tags from content', () => {
      const htmlContent = '<div><h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p></div>';
      render(<JournalEntryCardV2 {...baseProps} content={htmlContent} />);

      // Should render text without HTML tags
      expect(screen.getByText(/Title.*Paragraph with bold text/)).toBeInTheDocument();
    });

    it('should render date', () => {
      render(<JournalEntryCardV2 {...baseProps} />);

      // Date is rendered using getRelativeTime
      expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();
    });
  });

  describe('Attachments', () => {
    it('should not show attachment count when zero', () => {
      render(<JournalEntryCardV2 {...baseProps} attachmentCount={0} />);

      expect(screen.queryByText(/attachment/)).not.toBeInTheDocument();
    });

    it('should show single attachment', () => {
      render(<JournalEntryCardV2 {...baseProps} attachmentCount={1} />);

      expect(screen.getByText('1 attachment')).toBeInTheDocument();
    });

    it('should show multiple attachments', () => {
      render(<JournalEntryCardV2 {...baseProps} attachmentCount={3} />);

      expect(screen.getByText('3 attachments')).toBeInTheDocument();
    });

    it('should pluralize correctly', () => {
      const { rerender } = render(<JournalEntryCardV2 {...baseProps} attachmentCount={1} />);
      expect(screen.getByText('1 attachment')).toBeInTheDocument();

      rerender(<JournalEntryCardV2 {...baseProps} attachmentCount={2} />);
      expect(screen.getByText('2 attachments')).toBeInTheDocument();
    });

    it('should show paperclip icon for attachments', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} attachmentCount={1} />);

      // lucide-react Paperclip is an svg
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Owner Badge (Merged Mode)', () => {
    it('should show owner badge when showOwnerBadge is true', () => {
      const propsWithOwner = {
        ...baseProps,
        owner: { isOwner: true, displayName: 'You' },
        showOwnerBadge: true,
      };

      render(<JournalEntryCardV2 {...propsWithOwner} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('You');
      expect(badge).toHaveAttribute('data-variant', 'accent');
    });

    it('should show partner badge with success variant', () => {
      const propsWithPartner = {
        ...baseProps,
        owner: { isOwner: false, displayName: 'Alice' },
        showOwnerBadge: true,
      };

      render(<JournalEntryCardV2 {...propsWithPartner} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Alice');
      expect(badge).toHaveAttribute('data-variant', 'success');
    });

    it('should not show badge when showOwnerBadge is false', () => {
      const propsWithOwner = {
        ...baseProps,
        owner: { isOwner: true, displayName: 'You' },
        showOwnerBadge: false,
      };

      render(<JournalEntryCardV2 {...propsWithOwner} />);

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should not show badge when owner not provided', () => {
      const props = {
        ...baseProps,
        showOwnerBadge: true,
      };

      render(<JournalEntryCardV2 {...props} />);

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should handle long partner names in badge', () => {
      const propsWithLongName = {
        ...baseProps,
        owner: { isOwner: false, displayName: 'Alexander Maximilian III' },
        showOwnerBadge: true,
      };

      render(<JournalEntryCardV2 {...propsWithLongName} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Alexander Maximilian III');
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<JournalEntryCardV2 {...baseProps} title="Test Entry" />);

      const card = screen.getByText('Test Entry').closest('div');
      await user.click(card!);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor pointer class', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should have hover scale effect', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:scale-[1.005]');
    });

    it('should have active scale effect', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('active:scale-[0.995]');
    });
  });

  describe('Content Preview', () => {
    it('should truncate long content', () => {
      const longContent = `<p>${'A'.repeat(500)}</p>`;
      render(<JournalEntryCardV2 {...baseProps} content={longContent} />);

      const preview = screen.getByText(/AAA/);
      expect(preview).toHaveClass('line-clamp-3');
    });

    it('should handle empty content', () => {
      render(<JournalEntryCardV2 {...baseProps} content="" />);

      // Should render the card without content
      expect(screen.getByText('Untitled Entry')).toBeInTheDocument();
    });

    it('should handle content with only whitespace', () => {
      render(<JournalEntryCardV2 {...baseProps} content="<p>   </p>" />);

      // Empty content after stripping HTML and whitespace
      const { container } = render(<JournalEntryCardV2 {...baseProps} content="<p>   </p>" />);
      expect(container).toBeInTheDocument();
    });

    it('should handle complex HTML structures', () => {
      const complexHtml = `
        <div>
          <h1>Title</h1>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <p>Paragraph <a href="#">link</a></p>
        </div>
      `;
      render(<JournalEntryCardV2 {...baseProps} content={complexHtml} />);

      // Should extract text content
      expect(screen.getByText(/Title.*Item 1.*Item 2.*Paragraph link/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      render(<JournalEntryCardV2 {...baseProps} title="" />);

      expect(screen.getByText('Untitled Entry')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(200);
      render(<JournalEntryCardV2 {...baseProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Entry <>&"\'';
      render(<JournalEntryCardV2 {...baseProps} title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = '<p>Content with <script>alert("xss")</script></p>';
      render(<JournalEntryCardV2 {...baseProps} content={specialContent} />);

      // Should safely render text content
      expect(screen.getByText(/Content with/)).toBeInTheDocument();
    });

    it('should handle large attachment counts', () => {
      render(<JournalEntryCardV2 {...baseProps} attachmentCount={99} />);

      expect(screen.getByText('99 attachments')).toBeInTheDocument();
    });

    it('should handle different date formats', () => {
      const { rerender } = render(<JournalEntryCardV2 {...baseProps} createdAt="2024-01-15T10:30:00Z" />);
      expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();

      rerender(<JournalEntryCardV2 {...baseProps} createdAt="2024-12-31T23:59:59Z" />);
      expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-2xl');
    });

    it('should have padding', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
    });

    it('should have shadow', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-sm');
    });

    it('should have bottom margin', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('mb-4');
    });

    it('should have transition', () => {
      const { container } = render(<JournalEntryCardV2 {...baseProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('transition-transform');
    });
  });

  describe('Accessibility', () => {
    it('should render title as heading', () => {
      render(<JournalEntryCardV2 {...baseProps} title="My Entry" />);

      const title = screen.getByRole('heading', { name: 'My Entry' });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
    });

    it('should render default title as heading', () => {
      render(<JournalEntryCardV2 {...baseProps} />);

      const title = screen.getByRole('heading', { name: 'Untitled Entry' });
      expect(title).toBeInTheDocument();
    });

    it('should have proper text hierarchy', () => {
      render(<JournalEntryCardV2 {...baseProps} title="Test Entry" />);

      const title = screen.getByRole('heading', { name: 'Test Entry' });
      expect(title).toHaveClass('text-lg', 'font-bold');
    });
  });

  describe('Combined Features', () => {
    it('should render entry with all features', () => {
      const fullProps = {
        ...baseProps,
        title: 'Complete Entry',
        tags: ['work', 'important'],
        attachmentCount: 2,
        owner: { isOwner: true, displayName: 'You' },
        showOwnerBadge: true,
      };

      render(<JournalEntryCardV2 {...fullProps} />);

      expect(screen.getByText('Complete Entry')).toBeInTheDocument();
      expect(screen.getByText('This is my journal entry content')).toBeInTheDocument();
      expect(screen.getByText('2 attachments')).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toHaveTextContent('You');
    });

    it('should render minimal entry', () => {
      render(<JournalEntryCardV2 {...baseProps} />);

      expect(screen.getByText('Untitled Entry')).toBeInTheDocument();
      expect(screen.getByText('This is my journal entry content')).toBeInTheDocument();
      expect(screen.queryByText(/attachment/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });
});
