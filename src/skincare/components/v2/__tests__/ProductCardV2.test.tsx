/**
 * Unit tests for ProductCardV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCardV2 } from '../ProductCardV2';

const defaultProps = {
  id: 'product-1',
  name: 'Hydrating Face Cream',
  brand: 'CeraVe',
  category: 'moisturizer',
  onClick: vi.fn(),
};

describe('ProductCardV2', () => {
  describe('Basic Rendering', () => {
    it('should render product name', () => {
      render(<ProductCardV2 {...defaultProps} />);
      expect(screen.getByText('Hydrating Face Cream')).toBeInTheDocument();
    });

    it('should render brand name', () => {
      render(<ProductCardV2 {...defaultProps} />);
      expect(screen.getByText('CeraVe')).toBeInTheDocument();
    });

    it('should render category badge', () => {
      render(<ProductCardV2 {...defaultProps} />);
      expect(screen.getByText('moisturizer')).toBeInTheDocument();
    });

    it('should not render stars when rating is 0', () => {
      render(<ProductCardV2 {...defaultProps} rating={0} />);
      expect(screen.queryByText('★')).not.toBeInTheDocument();
    });

    it('should not render use frequency when not provided', () => {
      render(<ProductCardV2 {...defaultProps} />);
      // No frequency text should be visible
      expect(screen.queryByText(/daily/i)).not.toBeInTheDocument();
    });
  });

  describe('Star Rating', () => {
    it('should render 5 stars when rating is 5', () => {
      render(<ProductCardV2 {...defaultProps} rating={5} />);
      const stars = screen.getAllByText('★');
      expect(stars).toHaveLength(5);
    });

    it('should render 3 stars section when rating is 3', () => {
      render(<ProductCardV2 {...defaultProps} rating={3} />);
      const stars = screen.getAllByText('★');
      expect(stars).toHaveLength(5); // Always renders 5 stars, but with different colors
    });

    it('should render 1 star when rating is 1', () => {
      render(<ProductCardV2 {...defaultProps} rating={1} />);
      const stars = screen.getAllByText('★');
      expect(stars).toHaveLength(5);
    });

    it('should not render stars section when rating is 0', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} rating={0} />);
      const starsContainer = container.querySelector('div[style*="gap: 2px"]');
      expect(starsContainer).not.toBeInTheDocument();
    });
  });

  describe('Use Frequency', () => {
    it('should render use frequency when provided', () => {
      render(<ProductCardV2 {...defaultProps} useFrequency="Daily AM" />);
      expect(screen.getByText('Daily AM')).toBeInTheDocument();
    });

    it('should render "2x per week" frequency', () => {
      render(<ProductCardV2 {...defaultProps} useFrequency="2x per week" />);
      expect(screen.getByText('2x per week')).toBeInTheDocument();
    });

    it('should not render frequency section when undefined', () => {
      render(<ProductCardV2 {...defaultProps} useFrequency={undefined} />);
      expect(screen.queryByText(/per week/i)).not.toBeInTheDocument();
    });

    it('should not render frequency section when empty string', () => {
      render(<ProductCardV2 {...defaultProps} useFrequency="" />);
      // empty string is falsy in JSX conditional
      expect(screen.queryByText(/daily/i)).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();
      render(<ProductCardV2 {...defaultProps} onClick={onClickMock} />);

      await user.click(screen.getByText('Hydrating Face Cream'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when clicking on brand', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();
      render(<ProductCardV2 {...defaultProps} onClick={onClickMock} />);

      await user.click(screen.getByText('CeraVe'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderRadius).toBe('12px');
    });

    it('should have box shadow', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.boxShadow).toContain('rgba(92, 74, 58, 0.08)');
    });

    it('should have padding', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.padding).toBe('16px');
    });

    it('should have hover-shadow class', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-lg');
    });

    it('should have relative positioning for category badge', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.position).toBe('relative');
    });
  });

  describe('Category Badge Positioning', () => {
    it('should position badge in top-right corner', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const badge = container.querySelector('div[style*="position: absolute"]') as HTMLElement;
      expect(badge).toBeInTheDocument();
      expect(badge.style.top).toBe('12px');
      expect(badge.style.right).toBe('12px');
    });

    it('should have uppercase text in badge', () => {
      const { container } = render(<ProductCardV2 {...defaultProps} />);
      const badge = container.querySelector('div[style*="position: absolute"]') as HTMLElement;
      expect(badge.style.textTransform).toBe('uppercase');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long product name', () => {
      const longName = 'A'.repeat(100);
      render(<ProductCardV2 {...defaultProps} name={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long brand name', () => {
      const longBrand = 'B'.repeat(50);
      render(<ProductCardV2 {...defaultProps} brand={longBrand} />);
      expect(screen.getByText(longBrand)).toBeInTheDocument();
    });

    it('should handle different category values', () => {
      render(<ProductCardV2 {...defaultProps} category="serum" />);
      expect(screen.getByText('serum')).toBeInTheDocument();
    });

    it('should render with all optional props', () => {
      render(
        <ProductCardV2
          {...defaultProps}
          rating={4}
          useFrequency="Evening"
        />
      );
      expect(screen.getByText('Hydrating Face Cream')).toBeInTheDocument();
      expect(screen.getByText('CeraVe')).toBeInTheDocument();
      expect(screen.getByText('Evening')).toBeInTheDocument();
      const stars = screen.getAllByText('★');
      expect(stars).toHaveLength(5);
    });
  });
});
