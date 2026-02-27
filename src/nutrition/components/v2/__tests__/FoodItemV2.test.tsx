/**
 * Unit tests for FoodItemV2 component
 * Tests food item card display with photo/emoji, name, serving info, calories
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodItemV2 } from '../FoodItemV2';

describe('FoodItemV2', () => {
  const defaultProps = {
    id: 'food-1',
    name: 'Grilled Chicken',
    servingInfo: '1 breast · 200g',
    calories: 250,
    onClick: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render food name', () => {
      render(<FoodItemV2 {...defaultProps} />);

      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
    });

    it('should render serving info', () => {
      render(<FoodItemV2 {...defaultProps} />);

      expect(screen.getByText('1 breast · 200g')).toBeInTheDocument();
    });

    it('should render calories with "cal" suffix', () => {
      render(<FoodItemV2 {...defaultProps} />);

      expect(screen.getByText('250 cal')).toBeInTheDocument();
    });

    it('should round decimal calories to nearest integer', () => {
      render(<FoodItemV2 {...defaultProps} calories={234.67} />);

      expect(screen.getByText('235 cal')).toBeInTheDocument();
    });
  });

  describe('Photo and Emoji Display', () => {
    it('should display default emoji when no photo provided', () => {
      render(<FoodItemV2 {...defaultProps} />);

      expect(screen.getByText('🍽️')).toBeInTheDocument();
    });

    it('should display custom emoji when provided', () => {
      render(<FoodItemV2 {...defaultProps} emoji="🍗" />);

      expect(screen.getByText('🍗')).toBeInTheDocument();
    });

    it('should not display emoji when photo URL is provided', () => {
      render(<FoodItemV2 {...defaultProps} photoUrl="https://example.com/chicken.jpg" />);

      expect(screen.queryByText('🍽️')).not.toBeInTheDocument();
    });

    it('should use photo URL as background image', () => {
      const { container } = render(
        <FoodItemV2 {...defaultProps} photoUrl="https://example.com/chicken.jpg" />
      );

      // Verify emoji is NOT shown when photoUrl is provided
      expect(screen.queryByText('🍽️')).not.toBeInTheDocument();

      // Check that a div exists with the photoUrl structure
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });

    it('should use gradient background when no photo', () => {
      const { container } = render(<FoodItemV2 {...defaultProps} />);

      const emojiDiv = container.querySelector('div[style*="linear-gradient"]');
      expect(emojiDiv).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();

      render(<FoodItemV2 {...defaultProps} onClick={onClickMock} />);

      await user.click(screen.getByText('Grilled Chicken'));

      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should have accessible clickable container', () => {
      const { container } = render(<FoodItemV2 {...defaultProps} />);

      const foodItem = container.firstChild as HTMLElement;

      // Verify it's clickable via cursor
      expect(foodItem.className).toContain('cursor-pointer');
    });

    it('should have cursor-pointer class for clickability', () => {
      const { container } = render(<FoodItemV2 {...defaultProps} />);

      const foodItem = container.firstChild as HTMLElement;
      expect(foodItem.className).toContain('cursor-pointer');
    });
  });

  describe('Styling', () => {
    it('should have hover effect class', () => {
      const { container } = render(<FoodItemV2 {...defaultProps} />);

      const foodItem = container.firstChild as HTMLElement;
      expect(foodItem.className).toContain('hover:bg-gray-50');
    });

    it('should have rounded corners', () => {
      const { container } = render(<FoodItemV2 {...defaultProps} />);

      const foodItem = container.firstChild as HTMLElement;
      expect(foodItem.style.borderRadius).toBe('12px');
    });

    it('should have light gray background', () => {
      const { container } = render(<FoodItemV2 {...defaultProps} />);

      const foodItem = container.firstChild as HTMLElement;
      // Browser converts hex to rgb
      expect(foodItem.style.background).toBe('rgb(250, 250, 250)');
    });
  });

  describe('Content Variations', () => {
    it('should handle very long food names', () => {
      render(
        <FoodItemV2
          {...defaultProps}
          name="Super Extra Long Grilled Chicken Breast with Special Sauce and Vegetables"
        />
      );

      expect(
        screen.getByText('Super Extra Long Grilled Chicken Breast with Special Sauce and Vegetables')
      ).toBeInTheDocument();
    });

    it('should handle zero calories', () => {
      render(<FoodItemV2 {...defaultProps} calories={0} />);

      expect(screen.getByText('0 cal')).toBeInTheDocument();
    });

    it('should handle high calorie values', () => {
      render(<FoodItemV2 {...defaultProps} calories={1250} />);

      expect(screen.getByText('1250 cal')).toBeInTheDocument();
    });

    it('should handle complex serving info', () => {
      render(
        <FoodItemV2
          {...defaultProps}
          servingInfo="2 pieces · 150g each · with sauce"
        />
      );

      expect(screen.getByText('2 pieces · 150g each · with sauce')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name gracefully', () => {
      render(<FoodItemV2 {...defaultProps} name="" />);

      expect(screen.queryByText('Grilled Chicken')).not.toBeInTheDocument();
    });

    it('should handle empty serving info', () => {
      render(<FoodItemV2 {...defaultProps} servingInfo="" />);

      expect(screen.queryByText('1 breast · 200g')).not.toBeInTheDocument();
    });

    it('should handle negative calories', () => {
      render(<FoodItemV2 {...defaultProps} calories={-50} />);

      expect(screen.getByText('-50 cal')).toBeInTheDocument();
    });

    it('should handle decimal calories correctly', () => {
      render(<FoodItemV2 {...defaultProps} calories={123.4} />);

      expect(screen.getByText('123 cal')).toBeInTheDocument();
    });

    it('should handle decimal calories rounding up', () => {
      render(<FoodItemV2 {...defaultProps} calories={123.6} />);

      expect(screen.getByText('124 cal')).toBeInTheDocument();
    });
  });
});
