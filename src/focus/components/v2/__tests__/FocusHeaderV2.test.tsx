/**
 * Unit tests for FocusHeaderV2 component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FocusHeaderV2 } from '../FocusHeaderV2';

describe('FocusHeaderV2', () => {
  describe('Basic Rendering', () => {
    it('should render the Focus heading', () => {
      render(<FocusHeaderV2 />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should render the ⏱️ emoji', () => {
      render(<FocusHeaderV2 />);
      expect(screen.getByText(/⏱️/)).toBeInTheDocument();
    });

    it('should render "Focus" text', () => {
      render(<FocusHeaderV2 />);
      expect(screen.getByText(/Focus/i)).toBeInTheDocument();
    });

    it('should render default subtitle when none provided', () => {
      render(<FocusHeaderV2 />);
      expect(screen.getByText('Choose a duration to begin')).toBeInTheDocument();
    });

    it('should render custom subtitle when provided', () => {
      render(<FocusHeaderV2 subtitle="Stay focused" />);
      expect(screen.getByText('Stay focused')).toBeInTheDocument();
    });

    it('should render "Paused" subtitle', () => {
      render(<FocusHeaderV2 subtitle="Paused" />);
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('should render "Great work!" subtitle', () => {
      render(<FocusHeaderV2 subtitle="Great work!" />);
      expect(screen.getByText('Great work!')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have terracotta gradient background', () => {
      const { container } = render(<FocusHeaderV2 />);
      const header = container.firstChild as HTMLElement;
      expect(header.style.background).toContain('linear-gradient');
      expect(header.style.background).toContain('#D4A574');
    });

    it('should have white text color on outer container', () => {
      const { container } = render(<FocusHeaderV2 />);
      // text-white is on the outer div, not directly the heading
      const outer = container.firstChild as HTMLElement;
      expect(outer.className).toContain('text-white');
    });

    it('should be centered', () => {
      const { container } = render(<FocusHeaderV2 />);
      const inner = container.querySelector('.text-center');
      expect(inner).toBeInTheDocument();
    });

    it('should have proper padding', () => {
      const { container } = render(<FocusHeaderV2 />);
      const inner = container.querySelector('.px-5');
      expect(inner).toBeInTheDocument();
    });
  });

  describe('Subtitle Variations', () => {
    const subtitles = [
      'Choose a duration to begin',
      'Stay focused',
      'Paused',
      'Great work!',
      'Time for a break!',
    ];

    subtitles.forEach((subtitle) => {
      it(`should display "${subtitle}" subtitle`, () => {
        render(<FocusHeaderV2 subtitle={subtitle} />);
        expect(screen.getByText(subtitle)).toBeInTheDocument();
      });
    });
  });
});
