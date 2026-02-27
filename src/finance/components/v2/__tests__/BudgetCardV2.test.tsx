/**
 * Unit tests for BudgetCardV2 component
 * Tests budget display with progress bars and over-budget detection
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetCardV2 } from '../BudgetCardV2';

describe('BudgetCardV2', () => {
  const mockOnClick = vi.fn();

  const baseBudget = {
    id: '1',
    categoryId: 'cat-1',
    month: 'February 2026',
    limit: 500,
  };

  const baseCategory = {
    name: 'Groceries',
    icon: '🛒',
    color: '#4CAF50',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render category name', () => {
      render(<BudgetCardV2 budget={baseBudget} spent={200} category={baseCategory} onClick={mockOnClick} />);

      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    it('should render category icon', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={100} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toContain('🛒');
    });

    it('should render month', () => {
      render(<BudgetCardV2 budget={baseBudget} spent={300} category={baseCategory} onClick={mockOnClick} />);

      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('should render spent amount', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={250} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$250/);
    });

    it('should render budget limit', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={100} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/of \$500/);
    });

    it('should render default icon when category has no icon', () => {
      const categoryNoIcon = { name: 'Other', color: '#999999' };
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={100} category={categoryNoIcon} onClick={mockOnClick} />
      );

      expect(container.textContent).toContain('📦');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate percentage correctly when under budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={250} category={baseCategory} onClick={mockOnClick} />
      );

      // 250/500 = 50%
      const progressBar = container.querySelector('div[style*="width: 50%"]');
      expect(progressBar).toBeTruthy();
    });

    it('should calculate percentage correctly at 100%', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={500} category={baseCategory} onClick={mockOnClick} />
      );

      const progressBar = container.querySelector('div[style*="width: 100%"]');
      expect(progressBar).toBeTruthy();
    });

    it('should cap percentage at 100% when over budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={750} category={baseCategory} onClick={mockOnClick} />
      );

      // Should be capped at 100%, not 150%
      const progressBar = container.querySelector('div[style*="width: 100%"]');
      expect(progressBar).toBeTruthy();
    });

    it('should handle 0% spent', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={0} category={baseCategory} onClick={mockOnClick} />
      );

      const progressBar = container.querySelector('div[style*="width: 0%"]');
      expect(progressBar).toBeTruthy();
    });

    it('should handle fractional percentages', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={123} category={baseCategory} onClick={mockOnClick} />
      );

      // 123/500 = 24.6%
      const progressBar = container.querySelector('div[style*="width: 24.6%"]');
      expect(progressBar).toBeTruthy();
    });
  });

  describe('Over-Budget Detection', () => {
    it('should show remaining amount when under budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={300} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$200 remaining/);
    });

    it('should show over amount when over budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={600} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/Over by \$100/);
    });

    it('should apply red border when over budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={700} category={baseCategory} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeft).toMatch(/#F44336|244, 67, 54/);
    });

    it('should apply category color border when under budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={200} category={baseCategory} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeft).toMatch(/#4CAF50|76, 175, 80/);
    });

    it('should apply red text to spent amount when over budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={550} category={baseCategory} onClick={mockOnClick} />
      );

      // Find spent amount element (hex or RGB format)
      const elements = Array.from(container.querySelectorAll('div')).filter(
        div => div.textContent?.includes('$550')
      );
      const spentElement = elements.find(el =>
        el.style.color && (el.style.color.includes('F44336') || el.style.color.includes('244, 67, 54'))
      );
      expect(spentElement).toBeDefined();
    });

    it('should show red status text when over budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={650} category={baseCategory} onClick={mockOnClick} />
      );

      // Over amount should be in red (hex or RGB)
      const overText = screen.getByText(/Over by/);
      expect(overText.style.color).toMatch(/#F44336|244, 67, 54/);
    });

    it('should show green status text when under budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={200} category={baseCategory} onClick={mockOnClick} />
      );

      const remainingText = screen.getByText(/remaining/);
      expect(remainingText.style.color).toMatch(/#4CAF50|76, 175, 80/);
    });
  });

  describe('Progress Bar Colors', () => {
    it('should use terracotta gradient when under budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={250} category={baseCategory} onClick={mockOnClick} />
      );

      // Find the inner progress bar (not the background container)
      const allDivs = Array.from(container.querySelectorAll('div'));
      const progressBar = allDivs.find(div =>
        div.getAttribute('style')?.includes('width: 50%') &&
        div.getAttribute('style')?.includes('gradient')
      );
      expect(progressBar?.getAttribute('style')).toMatch(/#D4A574|#C18B5E/);
    });

    it('should use red gradient when over budget', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={600} category={baseCategory} onClick={mockOnClick} />
      );

      // Find the inner progress bar (not the background container)
      const allDivs = Array.from(container.querySelectorAll('div'));
      const progressBar = allDivs.find(div =>
        div.getAttribute('style')?.includes('width: 100%') &&
        div.getAttribute('style')?.includes('gradient')
      );
      expect(progressBar?.getAttribute('style')).toMatch(/#F44336|#D32F2F/);
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency without decimals', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={123} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$123/);
      expect(container.textContent).not.toMatch(/\$123\.00/);
    });

    it('should handle large amounts', () => {
      const largeBudget = { ...baseBudget, limit: 5000 };
      const { container } = render(
        <BudgetCardV2 budget={largeBudget} spent={3500} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$3,500/);
      expect(container.textContent).toMatch(/\$5,000/);
    });

    it('should format over amount correctly', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={650} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/Over by \$150/);
    });

    it('should format remaining amount correctly', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={175} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$325 remaining/);
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<BudgetCardV2 budget={baseBudget} spent={200} category={baseCategory} onClick={mockOnClick} />);

      const card = screen.getByText('Groceries').closest('div');
      if (card) {
        await user.click(card);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={300} category={baseCategory} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover scale effect', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={400} category={baseCategory} onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:scale-[1.01]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero spent', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={0} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$0/);
      expect(container.textContent).toMatch(/\$500 remaining/);
    });

    it('should handle zero budget limit', () => {
      const zeroBudget = { ...baseBudget, limit: 0 };
      const { container } = render(
        <BudgetCardV2 budget={zeroBudget} spent={0} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$0/);
    });

    it('should handle exact budget match', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={500} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$0 remaining/);
    });

    it('should handle very long category name', () => {
      const longCategory = { ...baseCategory, name: 'Entertainment and Recreation Activities' };
      render(<BudgetCardV2 budget={baseBudget} spent={200} category={longCategory} onClick={mockOnClick} />);

      expect(screen.getByText('Entertainment and Recreation Activities')).toBeInTheDocument();
    });

    it('should handle category without color', () => {
      const categoryNoColor = { name: 'Other', icon: '📦' };
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={100} category={categoryNoColor} onClick={mockOnClick} />
      );

      // Should use default terracotta color (hex or RGB)
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeft).toMatch(/#D4A574|212, 165, 116/);
    });

    it('should handle very small spent amounts', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={1} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/\$1/);
      expect(container.textContent).toMatch(/\$499 remaining/);
    });

    it('should handle very large over-budget amounts', () => {
      const { container } = render(
        <BudgetCardV2 budget={baseBudget} spent={5000} category={baseCategory} onClick={mockOnClick} />
      );

      expect(container.textContent).toMatch(/Over by \$4,500/);
    });
  });
});
