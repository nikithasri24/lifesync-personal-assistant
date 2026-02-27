/**
 * Unit tests for NoteCardV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteCardV2 } from '../NoteCardV2';

const baseNote = {
  id: 'note-1',
  title: 'My First Note',
  content: 'Some content',
  updatedAt: '2026-02-15T10:00:00Z',
  tags: [],
};

describe('NoteCardV2', () => {
  describe('Basic Rendering', () => {
    it('should render note title', () => {
      render(<NoteCardV2 note={baseNote as any} />);
      expect(screen.getByText('My First Note')).toBeInTheDocument();
    });

    it('should render formatted date', () => {
      render(<NoteCardV2 note={baseNote as any} />);
      expect(screen.getByText('Feb 15, 2026')).toBeInTheDocument();
    });

    it('should render without tags when tags is empty', () => {
      render(<NoteCardV2 note={baseNote as any} />);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('should render tags when present', () => {
      const noteWithTags = { ...baseNote, tags: ['work', 'ideas'] };
      render(<NoteCardV2 note={noteWithTags as any} />);
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('ideas')).toBeInTheDocument();
    });

    it('should render up to 3 tags', () => {
      const noteWithManyTags = { ...baseNote, tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] };
      render(<NoteCardV2 note={noteWithManyTags as any} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });

    it('should show +N for extra tags', () => {
      const noteWithManyTags = { ...baseNote, tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] };
      render(<NoteCardV2 note={noteWithManyTags as any} />);
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not show +N when exactly 3 tags', () => {
      const noteWith3Tags = { ...baseNote, tags: ['tag1', 'tag2', 'tag3'] };
      render(<NoteCardV2 note={noteWith3Tags as any} />);
      expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
    });

    it('should show +1 for 4 tags', () => {
      const noteWith4Tags = { ...baseNote, tags: ['tag1', 'tag2', 'tag3', 'tag4'] };
      render(<NoteCardV2 note={noteWith4Tags as any} />);
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should render single tag', () => {
      const noteWithTag = { ...baseNote, tags: ['project'] };
      render(<NoteCardV2 note={noteWithTag as any} />);
      expect(screen.getByText('project')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();
      render(<NoteCardV2 note={baseNote as any} onClick={onClickMock} />);

      await user.click(screen.getByText('My First Note'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick not provided', async () => {
      const user = userEvent.setup();
      render(<NoteCardV2 note={baseNote as any} />);
      await expect(user.click(screen.getByText('My First Note'))).resolves.not.toThrow();
    });

    it('should have cursor-pointer when onClick provided', () => {
      const { container } = render(<NoteCardV2 note={baseNote as any} onClick={vi.fn()} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should not have cursor-pointer when no onClick', () => {
      const { container } = render(<NoteCardV2 note={baseNote as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('cursor-pointer');
    });
  });

  describe('Styling', () => {
    it('should have rounded-xl class', () => {
      const { container } = render(<NoteCardV2 note={baseNote as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-xl');
    });

    it('should have shadow-sm class', () => {
      const { container } = render(<NoteCardV2 note={baseNote as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('shadow-sm');
    });

    it('should have white background', () => {
      const { container } = render(<NoteCardV2 note={baseNote as any} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
    });

    it('title should have line-clamp-2', () => {
      render(<NoteCardV2 note={baseNote as any} />);
      const title = screen.getByText('My First Note');
      expect(title.className).toContain('line-clamp-2');
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly for different months', () => {
      const noteInJanuary = { ...baseNote, updatedAt: '2026-01-05T08:00:00Z' };
      render(<NoteCardV2 note={noteInJanuary as any} />);
      expect(screen.getByText('Jan 05, 2026')).toBeInTheDocument();
    });

    it('should format date for December', () => {
      const noteInDecember = { ...baseNote, updatedAt: '2025-12-25T12:00:00Z' };
      render(<NoteCardV2 note={noteInDecember as any} />);
      expect(screen.getByText('Dec 25, 2025')).toBeInTheDocument();
    });
  });

  describe('Index Animation', () => {
    it('should render correctly with index=0', () => {
      render(<NoteCardV2 note={baseNote as any} index={0} />);
      expect(screen.getByText('My First Note')).toBeInTheDocument();
    });

    it('should render correctly with index=2', () => {
      render(<NoteCardV2 note={baseNote as any} index={2} />);
      expect(screen.getByText('My First Note')).toBeInTheDocument();
    });
  });
});
