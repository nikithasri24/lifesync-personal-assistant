/**
 * Unit tests for GoalsHeaderV2 component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalsHeaderV2 } from '../GoalsHeaderV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

describe('GoalsHeaderV2', () => {
  describe('Rendering', () => {
    it('should render header with title', () => {
      render(<GoalsHeaderV2 />);

      expect(screen.getByText('Life Goals')).toBeInTheDocument();
    });

    it('should render goals emoji', () => {
      render(<GoalsHeaderV2 />);

      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<GoalsHeaderV2 />);

      expect(screen.getByText('Track your aspirations and celebrate achievements')).toBeInTheDocument();
    });

    it('should render heading as h1', () => {
      render(<GoalsHeaderV2 />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Life Goals');
    });
  });

  describe('Styling', () => {
    it('should apply correct heading classes', () => {
      render(<GoalsHeaderV2 />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'flex', 'items-center', 'gap-3', 'mb-4');
    });

    it('should apply theme color to heading', () => {
      const { container } = render(<GoalsHeaderV2 />);

      const heading = container.querySelector('h1');
      expect(heading).toHaveStyle({ color: '#000000' });
    });

    it('should apply correct emoji size', () => {
      const { container } = render(<GoalsHeaderV2 />);

      const emoji = container.querySelector('.text-4xl');
      expect(emoji).toBeInTheDocument();
      expect(emoji).toHaveTextContent('🎯');
    });

    it('should apply correct subtitle classes', () => {
      const { container } = render(<GoalsHeaderV2 />);

      const subtitle = screen.getByText('Track your aspirations and celebrate achievements');
      expect(subtitle).toHaveClass('text-sm');
    });

    it('should apply theme color to subtitle', () => {
      const { container } = render(<GoalsHeaderV2 />);

      const subtitle = screen.getByText('Track your aspirations and celebrate achievements');
      expect(subtitle).toHaveStyle({ color: '#666666' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<GoalsHeaderV2 />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have readable text contrast', () => {
      render(<GoalsHeaderV2 />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveStyle({ color: '#000000' });
    });
  });
});
