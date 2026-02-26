/**
 * Unit tests for JournalHeaderV2 component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JournalHeaderV2 } from '../JournalHeaderV2';

// Mock useThemeColors
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

describe('JournalHeaderV2', () => {
  describe('Rendering', () => {
    it('should render the header', () => {
      render(<JournalHeaderV2 />);

      expect(screen.getByText('Journal')).toBeInTheDocument();
    });

    it('should render the emoji', () => {
      render(<JournalHeaderV2 />);

      expect(screen.getByText('📔')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Journal/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('should apply correct text styles', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Journal/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });

    it('should have flex layout with items centered', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Journal/i });
      expect(heading).toHaveClass('flex', 'items-center', 'gap-3');
    });

    it('should have bottom margin', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Journal/i });
      expect(heading).toHaveClass('mb-4');
    });

    it('should render emoji with larger text size', () => {
      const { container } = render(<JournalHeaderV2 />);

      const emoji = container.querySelector('.text-4xl');
      expect(emoji).toBeInTheDocument();
      expect(emoji?.textContent).toBe('📔');
    });
  });

  describe('Theme Integration', () => {
    it('should use theme color for text', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Journal/i });
      expect(heading).toHaveStyle({ color: '#000000' });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a heading', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should contain both emoji and text', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Journal/i });
      expect(heading.textContent).toContain('📔');
      expect(heading.textContent).toContain('Journal');
    });
  });

  describe('Styling', () => {
    it('should match Together tab header style', () => {
      render(<JournalHeaderV2 />);

      const heading = screen.getByRole('heading', { name: /Journal/i });

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
      const { rerender } = render(<JournalHeaderV2 />);

      expect(screen.getByText('Journal')).toBeInTheDocument();
      expect(screen.getByText('📔')).toBeInTheDocument();

      rerender(<JournalHeaderV2 />);

      expect(screen.getByText('Journal')).toBeInTheDocument();
      expect(screen.getByText('📔')).toBeInTheDocument();
    });
  });
});
