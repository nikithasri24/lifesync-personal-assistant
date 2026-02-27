/**
 * Unit tests for MacroProgressV2 component
 * Tests progress bars for protein/carbs/fat macros
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MacroProgressV2 } from '../MacroProgressV2';

describe('MacroProgressV2', () => {
  const defaultMacros = {
    protein: { current: 50, goal: 150 },
    carbs: { current: 100, goal: 250 },
    fat: { current: 30, goal: 70 },
  };

  describe('Basic Rendering', () => {
    it('should render "Macros" title', () => {
      render(<MacroProgressV2 macros={defaultMacros} />);

      expect(screen.getByText('Macros')).toBeInTheDocument();
    });

    it('should render all three macro names', () => {
      render(<MacroProgressV2 macros={defaultMacros} />);

      expect(screen.getByText('Protein')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
      expect(screen.getByText('Fat')).toBeInTheDocument();
    });

    it('should display current and goal values for protein', () => {
      render(<MacroProgressV2 macros={defaultMacros} />);

      expect(screen.getByText('50g / 150g')).toBeInTheDocument();
    });

    it('should display current and goal values for carbs', () => {
      render(<MacroProgressV2 macros={defaultMacros} />);

      expect(screen.getByText('100g / 250g')).toBeInTheDocument();
    });

    it('should display current and goal values for fat', () => {
      render(<MacroProgressV2 macros={defaultMacros} />);

      expect(screen.getByText('30g / 70g')).toBeInTheDocument();
    });
  });

  describe('Progress Bar Calculations', () => {
    it('should calculate 33% protein progress correctly', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const progressBars = container.querySelectorAll('div[style*="width"]');
      const proteinBar = progressBars[0];

      // 50/150 = 33.33%
      expect(proteinBar.style.width).toContain('33');
    });

    it('should calculate 40% carbs progress correctly', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const progressBars = container.querySelectorAll('div[style*="width"]');
      const carbsBar = progressBars[1];

      // 100/250 = 40%
      expect(carbsBar.style.width).toBe('40%');
    });

    it('should calculate 42% fat progress correctly', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const progressBars = container.querySelectorAll('div[style*="width"]');
      const fatBar = progressBars[2];

      // 30/70 ≈ 42.86%
      expect(fatBar.style.width).toContain('42');
    });

    it('should cap progress at 100% when current exceeds goal', () => {
      const macros = {
        protein: { current: 200, goal: 150 },
        carbs: { current: 300, goal: 250 },
        fat: { current: 100, goal: 70 },
      };

      const { container } = render(<MacroProgressV2 macros={macros} />);

      const progressBars = container.querySelectorAll('div[style*="width"]');

      progressBars.forEach(bar => {
        expect(bar.style.width).toBe('100%');
      });
    });

    it('should show 0% progress when current is 0', () => {
      const macros = {
        protein: { current: 0, goal: 150 },
        carbs: { current: 0, goal: 250 },
        fat: { current: 0, goal: 70 },
      };

      const { container } = render(<MacroProgressV2 macros={macros} />);

      const progressBars = container.querySelectorAll('div[style*="width"]');

      progressBars.forEach(bar => {
        expect(bar.style.width).toBe('0%');
      });
    });

    it('should handle zero goal by showing 0% progress', () => {
      const macros = {
        protein: { current: 50, goal: 0 },
        carbs: { current: 100, goal: 0 },
        fat: { current: 30, goal: 0 },
      };

      const { container } = render(<MacroProgressV2 macros={macros} />);

      const progressBars = container.querySelectorAll('div[style*="width"]');

      progressBars.forEach(bar => {
        expect(bar.style.width).toBe('0%');
      });
    });
  });

  describe('Value Rounding', () => {
    it('should round decimal macro values to nearest integer', () => {
      const macros = {
        protein: { current: 50.4, goal: 150.8 },
        carbs: { current: 100.6, goal: 250.2 },
        fat: { current: 30.1, goal: 70.9 },
      };

      render(<MacroProgressV2 macros={macros} />);

      expect(screen.getByText('50g / 151g')).toBeInTheDocument();
      expect(screen.getByText('101g / 250g')).toBeInTheDocument();
      expect(screen.getByText('30g / 71g')).toBeInTheDocument();
    });

    it('should handle large macro values', () => {
      const macros = {
        protein: { current: 250, goal: 300 },
        carbs: { current: 500, goal: 600 },
        fat: { current: 150, goal: 200 },
      };

      render(<MacroProgressV2 macros={macros} />);

      expect(screen.getByText('250g / 300g')).toBeInTheDocument();
      expect(screen.getByText('500g / 600g')).toBeInTheDocument();
      expect(screen.getByText('150g / 200g')).toBeInTheDocument();
    });
  });

  describe('Progress Bar Gradients', () => {
    it('should have different gradient for each macro', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const progressBars = container.querySelectorAll('div[style*="linear-gradient"]');

      expect(progressBars).toHaveLength(3);

      // Protein gradient
      expect(progressBars[0].style.background).toContain('#D4A574');
      expect(progressBars[0].style.background).toContain('#C18B5E');

      // Carbs gradient
      expect(progressBars[1].style.background).toContain('#E8C48E');
      expect(progressBars[1].style.background).toContain('#D4A574');

      // Fat gradient
      expect(progressBars[2].style.background).toContain('#C18B5E');
      expect(progressBars[2].style.background).toContain('#A6785A');
    });

    it('should use horizontal gradients (90deg)', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const progressBars = container.querySelectorAll('div[style*="linear-gradient"]');

      progressBars.forEach(bar => {
        expect(bar.style.background).toContain('90deg');
      });
    });
  });

  describe('Container Styling', () => {
    it('should have white background', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.background).toBe('white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.borderRadius).toBe('16px');
    });

    it('should have box shadow', () => {
      const { container } = render(<MacroProgressV2 macros={defaultMacros} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.boxShadow).toContain('rgba(92, 74, 58, 0.08)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative current values', () => {
      const macros = {
        protein: { current: -10, goal: 150 },
        carbs: { current: -20, goal: 250 },
        fat: { current: -5, goal: 70 },
      };

      render(<MacroProgressV2 macros={macros} />);

      expect(screen.getByText('-10g / 150g')).toBeInTheDocument();
      expect(screen.getByText('-20g / 250g')).toBeInTheDocument();
      expect(screen.getByText('-5g / 70g')).toBeInTheDocument();
    });

    it('should handle current equals goal (100% progress)', () => {
      const macros = {
        protein: { current: 150, goal: 150 },
        carbs: { current: 250, goal: 250 },
        fat: { current: 70, goal: 70 },
      };

      const { container } = render(<MacroProgressV2 macros={macros} />);

      const progressBars = container.querySelectorAll('div[style*="width"]');

      progressBars.forEach(bar => {
        expect(bar.style.width).toBe('100%');
      });
    });

    it('should handle all macros at zero', () => {
      const macros = {
        protein: { current: 0, goal: 0 },
        carbs: { current: 0, goal: 0 },
        fat: { current: 0, goal: 0 },
      };

      render(<MacroProgressV2 macros={macros} />);

      // All three macros will show "0g / 0g"
      const zeroValues = screen.getAllByText('0g / 0g');
      expect(zeroValues).toHaveLength(3);
    });
  });
});
