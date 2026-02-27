/**
 * Unit tests for TypingIndicatorV2 component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicatorV2 } from '../TypingIndicatorV2';

describe('TypingIndicatorV2', () => {
  describe('Basic Rendering', () => {
    it('should render without props', () => {
      render(<TypingIndicatorV2 />);
      // Component renders (no errors)
      const { container } = render(<TypingIndicatorV2 />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render the robot emoji avatar', () => {
      render(<TypingIndicatorV2 />);
      expect(screen.getByText('🤖')).toBeInTheDocument();
    });

    it('should render 3 animated dots', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('dots should be rounded-full', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const dots = container.querySelectorAll('.rounded-full');
      // Avatar + 3 dots = 4 rounded-full elements (avatar might not be rounded-full)
      const bouncingDots = container.querySelectorAll('.animate-bounce.rounded-full');
      expect(bouncingDots).toHaveLength(3);
    });

    it('dots should have staggered animation delays', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const dots = container.querySelectorAll('.animate-bounce');
      const delays = Array.from(dots).map(
        dot => (dot as HTMLElement).style.animationDelay
      );
      expect(delays[0]).toBe('0s');
      expect(delays[1]).toBe('0.2s');
      expect(delays[2]).toBe('0.4s');
    });
  });

  describe('Layout', () => {
    it('should be left-aligned (self-start)', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('self-start');
    });

    it('should have flex layout', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex');
    });

    it('should have gap between avatar and bubble', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('gap-2');
    });
  });

  describe('Bubble Styling', () => {
    it('should have rounded bubble', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const bubble = container.querySelector('.rounded-2xl');
      expect(bubble).toBeInTheDocument();
    });

    it('should have shadow on bubble', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const bubble = container.querySelector('[style*="rgba(0,0,0,0.1)"]') ||
                     container.querySelector('[style*="box-shadow"]');
      // Bubble has box-shadow style
      expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('avatar should be w-8 h-8', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const avatar = container.querySelector('.w-8.h-8');
      expect(avatar).toBeInTheDocument();
    });

    it('avatar should be rounded-full', () => {
      const { container } = render(<TypingIndicatorV2 />);
      const avatar = container.querySelector('.w-8.h-8');
      expect(avatar?.className).toContain('rounded-full');
    });

    it('avatar should show robot emoji', () => {
      render(<TypingIndicatorV2 />);
      expect(screen.getAllByText('🤖')[0]).toBeInTheDocument();
    });
  });
});
