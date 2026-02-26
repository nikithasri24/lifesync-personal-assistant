/**
 * Unit tests for MealCardV2 component
 * Tests rendering, status display, and compact mode
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealCardV2 } from '../MealCardV2';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF', tertiary: '#FAFAFA' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
  }),
}));

describe('MealCardV2', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering - Full Mode', () => {
    it('should render meal with recipe name', () => {
      const meal = {
        id: '1',
        recipeName: 'Grilled Chicken',
        servings: 2,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
    });

    it('should render meal with custom name', () => {
      const meal = {
        id: '1',
        customName: 'Leftover Pizza',
        servings: 1,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.getByText('Leftover Pizza')).toBeInTheDocument();
    });

    it('should prefer recipe name over custom name', () => {
      const meal = {
        id: '1',
        recipeName: 'Grilled Chicken',
        customName: 'Custom Name',
        servings: 2,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      expect(screen.queryByText('Custom Name')).not.toBeInTheDocument();
    });

    it('should show "Unnamed Meal" when no names provided', () => {
      const meal = {
        id: '1',
        servings: 2,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.getByText('Unnamed Meal')).toBeInTheDocument();
    });

    it('should display servings when provided', () => {
      const meal = {
        id: '1',
        recipeName: 'Pasta',
        servings: 4,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.getByText('4 servings')).toBeInTheDocument();
    });

    it('should not display servings when not provided', () => {
      const meal = {
        id: '1',
        recipeName: 'Pasta',
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.queryByText(/servings/i)).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      const meal = {
        id: '1',
        recipeName: 'Quick Snack',
        status: 'planned' as const,
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} compact={true} />);

      expect(screen.getByText('Quick Snack')).toBeInTheDocument();

      // Compact mode has different styling (text-xs, px-2 py-1)
      const card = container.querySelector('.text-xs');
      expect(card).toBeInTheDocument();
    });

    it('should not show servings in compact mode', () => {
      const meal = {
        id: '1',
        recipeName: 'Quick Snack',
        servings: 2,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} compact={true} />);

      expect(screen.queryByText(/servings/i)).not.toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should apply planned status styling', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
        status: 'planned' as const,
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      // React converts hex to rgb - match either format
      expect(card.style.borderLeft).toMatch(/666666|rgb\(102,\s*102,\s*102\)/i);
    });

    it('should apply logged status styling', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
        status: 'logged' as const,
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      // Green for logged - match either format
      expect(card.style.borderLeft).toMatch(/#10B981|rgb\(16,\s*185,\s*129\)/i);
    });

    it('should apply skipped status styling', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
        status: 'skipped' as const,
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      // Gray for skipped - match either format
      expect(card.style.borderLeft).toMatch(/#9CA3AF|rgb\(156,\s*163,\s*175\)/i);
    });

    it('should default to planned status when not provided', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      // Default to planned - match either format
      expect(card.style.borderLeft).toMatch(/666666|rgb\(102,\s*102,\s*102\)/i);
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const meal = {
        id: '1',
        recipeName: 'Clickable Meal',
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      await user.click(screen.getByText('Clickable Meal'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick in compact mode', async () => {
      const user = userEvent.setup();
      const meal = {
        id: '1',
        recipeName: 'Compact Meal',
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} compact={true} />);

      await user.click(screen.getByText('Compact Meal'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should have cursor-pointer class', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
        status: 'planned' as const,
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover transition classes', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
        status: 'planned' as const,
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).toContain('transition-all');
    });

    it('should have hover transition in compact mode', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
        status: 'planned' as const,
      };

      const { container } = render(<MealCardV2 meal={meal} onClick={mockOnClick} compact={true} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:bg-gray-50');
      expect(card.className).toContain('transition-colors');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings for names', () => {
      const meal = {
        id: '1',
        recipeName: '',
        customName: '',
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.getByText('Unnamed Meal')).toBeInTheDocument();
    });

    it('should handle zero servings', () => {
      const meal = {
        id: '1',
        recipeName: 'Meal',
        servings: 0,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      // Zero is falsy, so servings should not be displayed
      expect(screen.queryByText(/servings/i)).not.toBeInTheDocument();
    });

    it('should handle large serving counts', () => {
      const meal = {
        id: '1',
        recipeName: 'Party Food',
        servings: 20,
        status: 'planned' as const,
      };

      render(<MealCardV2 meal={meal} onClick={mockOnClick} />);

      expect(screen.getByText('20 servings')).toBeInTheDocument();
    });
  });
});
