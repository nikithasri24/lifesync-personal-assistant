/**
 * Unit tests for CalorieSummaryV2 component
 * Tests circular progress display for calories consumed/remaining
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalorieSummaryV2 } from '../CalorieSummaryV2';

describe('CalorieSummaryV2', () => {
  describe('Basic Rendering', () => {
    it('should render with consumed and goal calories', () => {
      render(<CalorieSummaryV2 consumed={1200} goal={2000} />);

      expect(screen.getByText('1,200')).toBeInTheDocument();
      expect(screen.getByText('calories')).toBeInTheDocument();
      expect(screen.getByText('800 remaining')).toBeInTheDocument();
    });

    it('should display consumed calories with locale formatting', () => {
      render(<CalorieSummaryV2 consumed={2500} goal={3000} />);

      expect(screen.getByText('2,500')).toBeInTheDocument();
    });

    it('should display remaining calories with locale formatting', () => {
      render(<CalorieSummaryV2 consumed={500} goal={2500} />);

      expect(screen.getByText('2,000 remaining')).toBeInTheDocument();
    });
  });

  describe('Calorie Calculations', () => {
    it('should calculate remaining calories correctly', () => {
      render(<CalorieSummaryV2 consumed={1500} goal={2000} />);

      expect(screen.getByText('500 remaining')).toBeInTheDocument();
    });

    it('should show 0 remaining when consumed equals goal', () => {
      render(<CalorieSummaryV2 consumed={2000} goal={2000} />);

      expect(screen.getByText('0 remaining')).toBeInTheDocument();
    });

    it('should show 0 remaining when consumed exceeds goal', () => {
      render(<CalorieSummaryV2 consumed={2500} goal={2000} />);

      expect(screen.getByText('0 remaining')).toBeInTheDocument();
    });

    it('should handle zero goal gracefully', () => {
      render(<CalorieSummaryV2 consumed={1000} goal={0} />);

      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('0 remaining')).toBeInTheDocument();
    });

    it('should handle zero consumed', () => {
      render(<CalorieSummaryV2 consumed={0} goal={2000} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('2,000 remaining')).toBeInTheDocument();
    });
  });

  describe('Progress Circle', () => {
    it('should render SVG circle elements', () => {
      const { container } = render(<CalorieSummaryV2 consumed={1000} goal={2000} />);

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2); // Background + progress circles
    });

    it('should have correct circle attributes', () => {
      const { container } = render(<CalorieSummaryV2 consumed={1000} goal={2000} />);

      const circles = container.querySelectorAll('circle');
      circles.forEach(circle => {
        expect(circle.getAttribute('cx')).toBe('60');
        expect(circle.getAttribute('cy')).toBe('60');
        expect(circle.getAttribute('r')).toBe('50');
      });
    });

    it('should calculate stroke-dashoffset for 50% progress', () => {
      const { container } = render(<CalorieSummaryV2 consumed={1000} goal={2000} />);

      const progressCircle = container.querySelectorAll('circle')[1];
      const strokeDashoffset = progressCircle.getAttribute('stroke-dashoffset');

      // 50% of circumference (2 * PI * 50) = ~157
      expect(parseFloat(strokeDashoffset || '')).toBeCloseTo(157, 0);
    });

    it('should calculate stroke-dashoffset for 75% progress', () => {
      const { container } = render(<CalorieSummaryV2 consumed={1500} goal={2000} />);

      const progressCircle = container.querySelectorAll('circle')[1];
      const strokeDashoffset = progressCircle.getAttribute('stroke-dashoffset');

      // 25% remaining of circumference (2 * PI * 50) = ~78.54
      expect(parseFloat(strokeDashoffset || '')).toBeCloseTo(78.54, 1);
    });

    it('should cap progress at 100% even if consumed exceeds goal', () => {
      const { container } = render(<CalorieSummaryV2 consumed={3000} goal={2000} />);

      const progressCircle = container.querySelectorAll('circle')[1];
      const strokeDashoffset = progressCircle.getAttribute('stroke-dashoffset');

      // 0% remaining (full circle)
      expect(parseFloat(strokeDashoffset || '')).toBeCloseTo(0, 0);
    });
  });

  describe('Visual Styling', () => {
    it('should have terracotta gradient background', () => {
      const { container } = render(<CalorieSummaryV2 consumed={1000} goal={2000} />);

      const gradientDiv = container.firstChild as HTMLElement;
      expect(gradientDiv.style.background).toContain('linear-gradient');
      expect(gradientDiv.style.background).toContain('#D4A574');
      expect(gradientDiv.style.background).toContain('#C18B5E');
    });

    it('should have white text color', () => {
      const { container } = render(<CalorieSummaryV2 consumed={1000} goal={2000} />);

      const gradientDiv = container.firstChild as HTMLElement;
      expect(gradientDiv.style.color).toBe('white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<CalorieSummaryV2 consumed={1000} goal={2000} />);

      const gradientDiv = container.firstChild as HTMLElement;
      expect(gradientDiv.style.borderRadius).toBe('16px');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large calorie values', () => {
      render(<CalorieSummaryV2 consumed={12345} goal={15000} />);

      expect(screen.getByText('12,345')).toBeInTheDocument();
      expect(screen.getByText('2,655 remaining')).toBeInTheDocument();
    });

    it('should handle decimal calorie values with locale formatting', () => {
      render(<CalorieSummaryV2 consumed={1234.56} goal={2000.99} />);

      // toLocaleString() formats decimals, doesn't truncate
      expect(screen.getByText('1,234.56')).toBeInTheDocument();
    });

    it('should handle negative consumed gracefully', () => {
      render(<CalorieSummaryV2 consumed={-100} goal={2000} />);

      expect(screen.getByText('-100')).toBeInTheDocument();
      expect(screen.getByText('2,100 remaining')).toBeInTheDocument();
    });
  });
});
