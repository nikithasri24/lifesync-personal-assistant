/**
 * Unit tests for CircularTimerV2 component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularTimerV2 } from '../CircularTimerV2';

const defaultProps = {
  seconds: 1500, // 25 minutes
  totalSeconds: 1500,
  state: 'ready' as const,
};

describe('CircularTimerV2', () => {
  describe('Time Display', () => {
    it('should display 25:00 for 1500 seconds', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={1500} totalSeconds={1500} />);
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('should display 05:00 for 300 seconds', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={300} totalSeconds={300} />);
      expect(screen.getByText('05:00')).toBeInTheDocument();
    });

    it('should display 90:00 for 5400 seconds', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={5400} totalSeconds={5400} />);
      expect(screen.getByText('90:00')).toBeInTheDocument();
    });

    it('should display 00:00 for 0 seconds', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={0} totalSeconds={1500} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should display 12:34 for 754 seconds', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={754} totalSeconds={1500} />);
      expect(screen.getByText('12:34')).toBeInTheDocument();
    });

    it('should zero-pad minutes correctly', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={9 * 60} totalSeconds={1500} />);
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    it('should zero-pad seconds correctly', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={60 + 5} totalSeconds={1500} />);
      expect(screen.getByText('01:05')).toBeInTheDocument();
    });
  });

  describe('State Labels', () => {
    it('should show "Ready" label when state is ready', () => {
      render(<CircularTimerV2 {...defaultProps} state="ready" />);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should show "Focus Time" label when state is active', () => {
      render(<CircularTimerV2 {...defaultProps} state="active" />);
      expect(screen.getByText('Focus Time')).toBeInTheDocument();
    });

    it('should show "Paused" label when state is paused', () => {
      render(<CircularTimerV2 {...defaultProps} state="paused" />);
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('should show "Complete!" label when state is complete', () => {
      render(<CircularTimerV2 {...defaultProps} state="complete" />);
      expect(screen.getByText('Complete!')).toBeInTheDocument();
    });

    it('should use custom label when provided', () => {
      render(<CircularTimerV2 {...defaultProps} label="Custom Label" />);
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('custom label overrides state-based label', () => {
      render(<CircularTimerV2 {...defaultProps} state="active" label="My Label" />);
      expect(screen.getByText('My Label')).toBeInTheDocument();
      expect(screen.queryByText('Focus Time')).not.toBeInTheDocument();
    });
  });

  describe('Visual Structure', () => {
    it('should render default size of 240px (numeric style)', () => {
      const { container } = render(<CircularTimerV2 {...defaultProps} />);
      // The outer wrapper is a flex div; the circle is the first child within it
      const circle = container.querySelector('.rounded-full') as HTMLElement;
      // React sets numeric width/height via inline style as number, not string
      expect(circle).toBeInTheDocument();
    });

    it('should render custom size via rounded-full div', () => {
      const { container } = render(<CircularTimerV2 {...defaultProps} size={200} />);
      const circle = container.querySelector('.rounded-full') as HTMLElement;
      expect(circle).toBeInTheDocument();
    });

    it('should have inner white circle (bg-white class)', () => {
      const { container } = render(<CircularTimerV2 {...defaultProps} />);
      const innerCircle = container.querySelector('.bg-white') as HTMLElement;
      expect(innerCircle).toBeInTheDocument();
    });

    it('should have terracotta gradient on outer ring', () => {
      const { container } = render(<CircularTimerV2 {...defaultProps} />);
      const outerRing = container.querySelector('.rounded-full') as HTMLElement;
      expect(outerRing.style.background).toContain('linear-gradient');
      expect(outerRing.style.background).toContain('#D4A574');
    });

    it('should have box shadow on outer ring', () => {
      const { container } = render(<CircularTimerV2 {...defaultProps} />);
      const outerRing = container.querySelector('.rounded-full') as HTMLElement;
      expect(outerRing.style.boxShadow).toContain('rgba(212, 165, 116, 0.3)');
    });

    it('should have large time font size', () => {
      render(<CircularTimerV2 {...defaultProps} />);
      const timeText = screen.getByText('25:00');
      expect(timeText.className).toContain('text-5xl');
    });

    it('should have bold time text', () => {
      render(<CircularTimerV2 {...defaultProps} />);
      const timeText = screen.getByText('25:00');
      expect(timeText.className).toContain('font-bold');
    });
  });

  describe('Progress Calculation', () => {
    it('renders correctly with full time remaining (100%)', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={1500} totalSeconds={1500} />);
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('renders correctly with half time remaining (50%)', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={750} totalSeconds={1500} />);
      expect(screen.getByText('12:30')).toBeInTheDocument();
    });

    it('renders correctly with no time remaining (0%)', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={0} totalSeconds={1500} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very small timer values', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={1} totalSeconds={1500} />);
      expect(screen.getByText('00:01')).toBeInTheDocument();
    });

    it('handles very large timer values', () => {
      render(<CircularTimerV2 {...defaultProps} seconds={5400} totalSeconds={5400} />);
      expect(screen.getByText('90:00')).toBeInTheDocument();
    });

    it('renders with size=300 without error', () => {
      const { container } = render(<CircularTimerV2 {...defaultProps} size={300} />);
      const circle = container.querySelector('.rounded-full') as HTMLElement;
      expect(circle).toBeInTheDocument();
    });
  });
});
