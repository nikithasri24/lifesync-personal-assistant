/**
 * Unit tests for NotesHeaderV2 component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotesHeaderV2 } from '../NotesHeaderV2';

// Mock useThemeColors
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

describe('NotesHeaderV2', () => {
  describe('Rendering', () => {
    it('should render the header', () => {
      render(<NotesHeaderV2 />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should render the emoji', () => {
      render(<NotesHeaderV2 />);

      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Notes/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('should apply correct text styles', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Notes/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });

    it('should have flex layout with items centered', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Notes/i });
      expect(heading).toHaveClass('flex', 'items-center', 'gap-3');
    });

    it('should have bottom margin', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Notes/i });
      expect(heading).toHaveClass('mb-4');
    });

    it('should render emoji with larger text size', () => {
      const { container } = render(<NotesHeaderV2 />);

      const emoji = container.querySelector('.text-4xl');
      expect(emoji).toBeInTheDocument();
      expect(emoji?.textContent).toBe('📝');
    });
  });

  describe('Theme Integration', () => {
    it('should use theme color for text', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Notes/i });
      expect(heading).toHaveStyle({ color: '#000000' });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a heading', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should contain both emoji and text', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Notes/i });
      expect(heading.textContent).toContain('📝');
      expect(heading.textContent).toContain('Notes');
    });
  });

  describe('Styling', () => {
    it('should match Together tab header style', () => {
      render(<NotesHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Notes/i });

      // Should match Together tab classes
      expect(heading).toHaveClass('text-3xl');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('flex');
      expect(heading).toHaveClass('items-center');
      expect(heading).toHaveClass('gap-3');
      expect(heading).toHaveClass('mb-4');
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently on multiple renders', () => {
      const { rerender } = render(<NotesHeaderV2 />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();

      rerender(<NotesHeaderV2 />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });
  });
});
