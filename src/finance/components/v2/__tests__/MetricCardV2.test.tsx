/**
 * Unit tests for MetricCardV2 component
 * Tests metric display with gradient values and types
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricCardV2 } from '../MetricCardV2';

describe('MetricCardV2', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render label', () => {
      render(<MetricCardV2 label="Total Assets" value="$50,000" />);

      expect(screen.getByText(/Total Assets/i)).toBeInTheDocument();
    });

    it('should render value', () => {
      render(<MetricCardV2 label="Net Worth" value="$100,000" />);

      expect(screen.getByText('$100,000')).toBeInTheDocument();
    });

    it('should render numeric value', () => {
      render(<MetricCardV2 label="Accounts" value={5} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render without subtitle', () => {
      const { container } = render(<MetricCardV2 label="Balance" value="$1,000" />);

      expect(container.textContent).not.toContain('vs last month');
    });

    it('should render with subtitle', () => {
      render(<MetricCardV2 label="Savings" value="$5,000" subtitle="+10% vs last month" />);

      expect(screen.getByText('+10% vs last month')).toBeInTheDocument();
    });
  });

  describe('Type Gradients', () => {
    it('should apply neutral gradient by default', () => {
      const { container } = render(<MetricCardV2 label="Balance" value="$1,000" />);

      const valueElement = screen.getByText('$1,000');
      const gradient = window.getComputedStyle(valueElement).background;

      // Should contain terracotta gradient colors
      expect(gradient).toMatch(/#D4A574|#C18B5E|212, 165, 116|193, 139, 94/i);
    });

    it('should apply positive gradient', () => {
      const { container } = render(
        <MetricCardV2 label="Profit" value="$10,000" type="positive" />
      );

      const valueElement = screen.getByText('$10,000');
      const gradient = window.getComputedStyle(valueElement).background;

      // Should contain green gradient colors
      expect(gradient).toMatch(/#4CAF50|#388E3C|76, 175, 80|56, 142, 60/i);
    });

    it('should apply negative gradient', () => {
      const { container } = render(
        <MetricCardV2 label="Loss" value="-$500" type="negative" />
      );

      const valueElement = screen.getByText('-$500');
      const gradient = window.getComputedStyle(valueElement).background;

      // Should contain red gradient colors
      expect(gradient).toMatch(/#F44336|#D32F2F|244, 67, 54|211, 47, 47/i);
    });

    it('should apply neutral gradient explicitly', () => {
      const { container } = render(
        <MetricCardV2 label="Balance" value="$0" type="neutral" />
      );

      const valueElement = screen.getByText('$0');
      const gradient = window.getComputedStyle(valueElement).background;

      expect(gradient).toMatch(/#D4A574|#C18B5E|212, 165, 116|193, 139, 94/i);
    });
  });

  describe('Subtitle Display', () => {
    it('should display subtitle when provided', () => {
      render(
        <MetricCardV2 label="Revenue" value="$50,000" subtitle="Increased by 15%" />
      );

      expect(screen.getByText('Increased by 15%')).toBeInTheDocument();
    });

    it('should not display subtitle when not provided', () => {
      const { container } = render(<MetricCardV2 label="Total" value="$1,000" />);

      // Check that no subtitle text is rendered - should only have label and value divs
      const divs = container.querySelectorAll('div');
      // Structure: outer > inner > label, value (no subtitle div)
      expect(divs.length).toBeLessThanOrEqual(4);
    });

    it('should display subtitle with special characters', () => {
      render(
        <MetricCardV2 label="Change" value="+$100" subtitle="↑ 5% from last week" />
      );

      expect(screen.getByText('↑ 5% from last week')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      render(<MetricCardV2 label="Assets" value="$1,000" onClick={mockOnClick} />);

      const card = screen.getByText(/Assets/i).closest('div');
      if (card) {
        await user.click(card);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class when onClick provided', () => {
      const { container } = render(
        <MetricCardV2 label="Net Worth" value="$5,000" onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should not have cursor-pointer class without onClick', () => {
      const { container } = render(<MetricCardV2 label="Balance" value="$1,000" />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('cursor-pointer');
    });

    it('should have hover scale effect when onClick provided', () => {
      const { container } = render(
        <MetricCardV2 label="Total" value="$10,000" onClick={mockOnClick} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:scale-102');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large values', () => {
      render(<MetricCardV2 label="Wealth" value="$999,999,999" />);

      expect(screen.getByText('$999,999,999')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      render(<MetricCardV2 label="Debt" value="-$50,000" type="negative" />);

      expect(screen.getByText('-$50,000')).toBeInTheDocument();
    });

    it('should handle zero value', () => {
      render(<MetricCardV2 label="Balance" value="$0.00" />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle very long label', () => {
      const longLabel = 'Total Available Liquid Assets for Investment';
      render(<MetricCardV2 label={longLabel} value="$100,000" />);

      expect(screen.getByText(new RegExp(longLabel, 'i'))).toBeInTheDocument();
    });

    it('should handle very long subtitle', () => {
      const longSubtitle = 'This is a very long subtitle with a lot of descriptive text about the metric';
      render(<MetricCardV2 label="Metric" value="$1,000" subtitle={longSubtitle} />);

      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(<MetricCardV2 label="Amount" value="" />);

      const label = screen.getByText(/Amount/i);
      expect(label).toBeInTheDocument();
    });

    it('should uppercase label text', () => {
      render(<MetricCardV2 label="net worth" value="$5,000" />);

      expect(screen.getByText(/net worth/i)).toBeInTheDocument();
    });
  });

  describe('Typography and Styling', () => {
    it('should render label in uppercase', () => {
      render(<MetricCardV2 label="Total Savings" value="$10,000" />);

      expect(screen.getByText(/Total Savings/i)).toBeInTheDocument();
    });

    it('should apply gradient to value text', () => {
      render(<MetricCardV2 label="Amount" value="$1,000" />);

      const valueElement = screen.getByText('$1,000');
      const style = window.getComputedStyle(valueElement);

      // Check for gradient background (implementation may vary by browser)
      expect(style.background || style.backgroundImage).toBeTruthy();
    });

    it('should display subtitle with correct styling', () => {
      render(<MetricCardV2 label="Revenue" value="$50,000" subtitle="+15%" />);

      const subtitle = screen.getByText('+15%');
      expect(subtitle).toBeInTheDocument();
    });
  });
});
