/**
 * Unit tests for WelcomeBannerV2 component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeBannerV2 } from '../WelcomeBannerV2';

describe('WelcomeBannerV2', () => {
  describe('Greeting Display', () => {
    it('should render a greeting message', () => {
      render(<WelcomeBannerV2 />);
      // One of Good Morning/Afternoon/Evening/Night
      expect(screen.getByText(/Good (Morning|Afternoon|Evening|Night)/)).toBeInTheDocument();
    });

    it('should render with provided userName', () => {
      render(<WelcomeBannerV2 userName="Alice" />);
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });

    it('should render "there" as default when no userName', () => {
      render(<WelcomeBannerV2 />);
      expect(screen.getByText(/there/)).toBeInTheDocument();
    });

    it('should render the overview subtitle', () => {
      render(<WelcomeBannerV2 />);
      expect(screen.getByText("Here's your overview for today")).toBeInTheDocument();
    });

    it('should render greeting with exclamation mark', () => {
      render(<WelcomeBannerV2 userName="Bob" />);
      expect(screen.getByText(/Bob!/)).toBeInTheDocument();
    });
  });

  describe('Time-based Emoji', () => {
    it('should render a time-based emoji', () => {
      render(<WelcomeBannerV2 />);
      // Should show one of the four emojis
      const emojiEl = screen.getByRole('img');
      expect(['🌅', '☀️', '🌆', '🌙']).toContain(emojiEl.textContent);
    });

    it('should have aria-label on the emoji', () => {
      render(<WelcomeBannerV2 />);
      const emojiEl = screen.getByRole('img');
      expect(emojiEl.getAttribute('aria-label')).toMatch(/Good (Morning|Afternoon|Evening|Night)/);
    });
  });

  describe('Styling', () => {
    it('should have rounded-2xl class', () => {
      const { container } = render(<WelcomeBannerV2 />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain('rounded-2xl');
    });

    it('should have overflow-hidden class', () => {
      const { container } = render(<WelcomeBannerV2 />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain('overflow-hidden');
    });

    it('should have gradient background', () => {
      const { container } = render(<WelcomeBannerV2 />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain('bg-gradient-to-br');
    });

    it('should have h1 heading for greeting', () => {
      render(<WelcomeBannerV2 />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Different User Names', () => {
    const names = ['Alice', 'Bob', 'Charlie', 'Sri Nikitha'];
    names.forEach(name => {
      it(`should display "${name}"`, () => {
        render(<WelcomeBannerV2 userName={name} />);
        expect(screen.getByText(new RegExp(name))).toBeInTheDocument();
      });
    });
  });
});
