/**
 * Unit tests for WeeklyChartV2 component
 * Tests bar chart showing 7 days of calorie data
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyChartV2 } from '../WeeklyChartV2';

describe('WeeklyChartV2', () => {
  const defaultWeekData = [
    { day: 'Mon', calories: 2000 },
    { day: 'Tue', calories: 1800 },
    { day: 'Wed', calories: 2200 },
    { day: 'Thu', calories: 1900 },
    { day: 'Fri', calories: 2100 },
    { day: 'Sat', calories: 2300 },
    { day: 'Sun', calories: 1700 },
  ];

  describe('Basic Rendering', () => {
    it('should render "Weekly Calories" title', () => {
      render(<WeeklyChartV2 weekData={defaultWeekData} />);

      expect(screen.getByText('Weekly Calories')).toBeInTheDocument();
    });

    it('should render all day labels', () => {
      render(<WeeklyChartV2 weekData={defaultWeekData} />);

      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('should render 7 bars', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');
      expect(bars).toHaveLength(7);
    });
  });

  describe('Bar Height Calculations', () => {
    it('should calculate bar heights as percentage of max', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      // Max is 2300 (Sat), so Wed (2200) should be ~95.65%
      const wedBar = bars[2] as HTMLElement;
      expect(wedBar.style.height).toContain('95');
    });

    it('should set max value bar to 100% height', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      // Sat has max value (2300), should be 100%
      const satBar = bars[5] as HTMLElement;
      expect(satBar.style.height).toBe('100%');
    });

    it('should use custom maxCalories when provided', () => {
      const { container } = render(
        <WeeklyChartV2 weekData={defaultWeekData} maxCalories={3000} />
      );

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      // Max bar should now be 2300/3000 = 76.67%
      const satBar = bars[5] as HTMLElement;
      expect(satBar.style.height).toContain('76');
    });

    it('should default to 2000 if all values are zero', () => {
      const zeroData = defaultWeekData.map(d => ({ ...d, calories: 0 }));

      const { container } = render(<WeeklyChartV2 weekData={zeroData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      // All bars should be 0% height
      bars.forEach(bar => {
        expect((bar as HTMLElement).style.height).toBe('0%');
      });
    });

    it('should handle single non-zero value correctly', () => {
      const singleValueData = [
        { day: 'Mon', calories: 0 },
        { day: 'Tue', calories: 0 },
        { day: 'Wed', calories: 2000 },
        { day: 'Thu', calories: 0 },
        { day: 'Fri', calories: 0 },
        { day: 'Sat', calories: 0 },
        { day: 'Sun', calories: 0 },
      ];

      const { container } = render(<WeeklyChartV2 weekData={singleValueData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      // Wed should be 100%
      const wedBar = bars[2] as HTMLElement;
      expect(wedBar.style.height).toBe('100%');
    });
  });

  describe('Bar Tooltips', () => {
    it('should have title attribute with calorie value', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      expect(bars[0].getAttribute('title')).toBe('2000 cal');
      expect(bars[1].getAttribute('title')).toBe('1800 cal');
      expect(bars[2].getAttribute('title')).toBe('2200 cal');
    });

    it('should show "0 cal" for zero values', () => {
      const dataWithZero = [{ day: 'Mon', calories: 0 }];

      const { container } = render(<WeeklyChartV2 weekData={dataWithZero} />);

      const bar = container.querySelector('div[style*="linear-gradient(180deg"]');

      expect(bar?.getAttribute('title')).toBe('0 cal');
    });
  });

  describe('Bar Styling', () => {
    it('should have terracotta gradient (180deg)', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      bars.forEach(bar => {
        expect((bar as HTMLElement).style.background).toContain('180deg');
        expect((bar as HTMLElement).style.background).toContain('#D4A574');
        expect((bar as HTMLElement).style.background).toContain('#C18B5E');
      });
    });

    it('should have minimum height for non-zero values', () => {
      const lowValueData = [{ day: 'Mon', calories: 1 }];

      const { container } = render(
        <WeeklyChartV2 weekData={lowValueData} maxCalories={10000} />
      );

      const bar = container.querySelector('div[style*="linear-gradient(180deg"]') as HTMLElement;

      // Should have minHeight: 4px for non-zero values
      expect(bar.style.minHeight).toContain('4px');
    });

    it('should have no minimum height for zero values', () => {
      const zeroData = [{ day: 'Mon', calories: 0 }];

      const { container } = render(<WeeklyChartV2 weekData={zeroData} />);

      const bar = container.querySelector('div[style*="linear-gradient(180deg"]') as HTMLElement;

      // minHeight should be 0 for zero values (JS returns "0" not "0px")
      expect(bar.style.minHeight).toBe('0');
    });

    it('should have height transition', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      bars.forEach(bar => {
        expect((bar as HTMLElement).style.transition).toContain('height');
        expect((bar as HTMLElement).style.transition).toContain('0.3s');
      });
    });
  });

  describe('Container Styling', () => {
    it('should have white background', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.background).toBe('white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.borderRadius).toBe('16px');
    });

    it('should have box shadow', () => {
      const { container } = render(<WeeklyChartV2 weekData={defaultWeekData} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.boxShadow).toContain('rgba(92, 74, 58, 0.08)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty weekData array', () => {
      const { container } = render(<WeeklyChartV2 weekData={[]} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');
      expect(bars).toHaveLength(0);
    });

    it('should handle less than 7 days', () => {
      const partialWeek = [
        { day: 'Mon', calories: 2000 },
        { day: 'Tue', calories: 1800 },
        { day: 'Wed', calories: 2200 },
      ];

      render(<WeeklyChartV2 weekData={partialWeek} />);

      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.queryByText('Thu')).not.toBeInTheDocument();
    });

    it('should handle more than 7 days', () => {
      const extendedWeek = [
        ...defaultWeekData,
        { day: 'Mon2', calories: 2000 },
      ];

      const { container } = render(<WeeklyChartV2 weekData={extendedWeek} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');
      expect(bars).toHaveLength(8);
    });

    it('should handle very high calorie values', () => {
      const highCalorieData = [
        { day: 'Mon', calories: 5000 },
        { day: 'Tue', calories: 4500 },
      ];

      render(<WeeklyChartV2 weekData={highCalorieData} />);

      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
    });

    it('should handle negative calorie values', () => {
      const negativeData = [{ day: 'Mon', calories: -100 }];

      const { container } = render(<WeeklyChartV2 weekData={negativeData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      // With negative max, calculation results in NaN, which results in empty string
      // Component should handle this edge case gracefully
      expect(bars).toHaveLength(1);
    });

    it('should handle decimal calorie values', () => {
      const decimalData = [{ day: 'Mon', calories: 2000.75 }];

      const { container } = render(<WeeklyChartV2 weekData={decimalData} />);

      const bar = container.querySelector('div[style*="linear-gradient(180deg"]');

      expect(bar?.getAttribute('title')).toBe('2000.75 cal');
    });

    it('should handle all identical values', () => {
      const identicalData = defaultWeekData.map(d => ({ ...d, calories: 2000 }));

      const { container } = render(<WeeklyChartV2 weekData={identicalData} />);

      const bars = container.querySelectorAll('div[style*="linear-gradient(180deg"]');

      // All bars should be 100% since they're all the max
      bars.forEach(bar => {
        expect((bar as HTMLElement).style.height).toBe('100%');
      });
    });
  });
});
