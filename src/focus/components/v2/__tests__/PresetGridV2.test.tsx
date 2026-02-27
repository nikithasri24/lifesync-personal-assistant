/**
 * Unit tests for PresetGridV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetGridV2 } from '../PresetGridV2';

const defaultPresets = [
  { id: 'pomodoro', name: 'Pomodoro', emoji: '🍅', minutes: 25 },
  { id: 'short-break', name: 'Short Break', emoji: '☕', minutes: 5 },
  { id: 'deep-work', name: 'Deep Work', emoji: '🧠', minutes: 90 },
  { id: 'long-break', name: 'Long Break', emoji: '🌟', minutes: 15 },
];

const defaultProps = {
  presets: defaultPresets,
  activePresetId: null,
  onSelectPreset: vi.fn(),
};

describe('PresetGridV2', () => {
  describe('Basic Rendering', () => {
    it('should render "Quick Start" title', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByText('Quick Start')).toBeInTheDocument();
    });

    it('should render all 4 presets', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByText('Pomodoro')).toBeInTheDocument();
      expect(screen.getByText('Short Break')).toBeInTheDocument();
      expect(screen.getByText('Deep Work')).toBeInTheDocument();
      expect(screen.getByText('Long Break')).toBeInTheDocument();
    });

    it('should render preset emojis', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByText('🍅')).toBeInTheDocument();
      expect(screen.getByText('☕')).toBeInTheDocument();
      expect(screen.getByText('🧠')).toBeInTheDocument();
      expect(screen.getByText('🌟')).toBeInTheDocument();
    });

    it('should render preset durations', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByText('25 minutes')).toBeInTheDocument();
      expect(screen.getByText('5 minutes')).toBeInTheDocument();
      expect(screen.getByText('90 minutes')).toBeInTheDocument();
      expect(screen.getByText('15 minutes')).toBeInTheDocument();
    });

    it('should render 4 preset buttons', () => {
      render(<PresetGridV2 {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });
  });

  describe('Active Preset Highlighting', () => {
    it('should highlight active preset button with terracotta background', () => {
      render(<PresetGridV2 {...defaultProps} activePresetId="pomodoro" />);
      const pomodoroButton = screen.getByRole('button', { name: /Set timer to Pomodoro/i });
      expect(pomodoroButton.style.backgroundColor).toBe('rgb(254, 243, 232)'); // #FEF3E8 as rgb
    });

    it('should not highlight inactive presets', () => {
      render(<PresetGridV2 {...defaultProps} activePresetId="pomodoro" />);
      const shortBreakButton = screen.getByRole('button', { name: /Set timer to Short Break/i });
      expect(shortBreakButton.style.backgroundColor).not.toBe('rgb(254, 243, 232)');
    });

    it('should show no terracotta highlight when activePresetId is null', () => {
      render(<PresetGridV2 {...defaultProps} activePresetId={null} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.style.backgroundColor).not.toBe('rgb(254, 243, 232)');
      });
    });

    it('should highlight deep-work preset when active', () => {
      render(<PresetGridV2 {...defaultProps} activePresetId="deep-work" />);
      const deepWorkButton = screen.getByRole('button', { name: /Set timer to Deep Work/i });
      expect(deepWorkButton.style.backgroundColor).toBe('rgb(254, 243, 232)');
    });
  });

  describe('Click Handling', () => {
    it('should call onSelectPreset with correct preset when Pomodoro clicked', async () => {
      const user = userEvent.setup();
      const onSelectMock = vi.fn();
      render(<PresetGridV2 {...defaultProps} onSelectPreset={onSelectMock} />);

      await user.click(screen.getByRole('button', { name: /pomodoro/i }));

      expect(onSelectMock).toHaveBeenCalledWith(defaultPresets[0]);
    });

    it('should call onSelectPreset with Short Break preset', async () => {
      const user = userEvent.setup();
      const onSelectMock = vi.fn();
      render(<PresetGridV2 {...defaultProps} onSelectPreset={onSelectMock} />);

      await user.click(screen.getByRole('button', { name: /short break/i }));

      expect(onSelectMock).toHaveBeenCalledWith(defaultPresets[1]);
    });

    it('should call onSelectPreset with Deep Work preset', async () => {
      const user = userEvent.setup();
      const onSelectMock = vi.fn();
      render(<PresetGridV2 {...defaultProps} onSelectPreset={onSelectMock} />);

      await user.click(screen.getByRole('button', { name: /deep work/i }));

      expect(onSelectMock).toHaveBeenCalledWith(defaultPresets[2]);
    });

    it('should call onSelectPreset with Long Break preset', async () => {
      const user = userEvent.setup();
      const onSelectMock = vi.fn();
      render(<PresetGridV2 {...defaultProps} onSelectPreset={onSelectMock} />);

      await user.click(screen.getByRole('button', { name: /long break/i }));

      expect(onSelectMock).toHaveBeenCalledWith(defaultPresets[3]);
    });

    it('should call onSelectPreset exactly once per click', async () => {
      const user = userEvent.setup();
      const onSelectMock = vi.fn();
      render(<PresetGridV2 {...defaultProps} onSelectPreset={onSelectMock} />);

      await user.click(screen.getByRole('button', { name: /pomodoro/i }));

      expect(onSelectMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('ARIA Labels', () => {
    it('should have accessible label for Pomodoro preset', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Set timer to Pomodoro - 25 minutes' })).toBeInTheDocument();
    });

    it('should have accessible label for Short Break preset', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Set timer to Short Break - 5 minutes' })).toBeInTheDocument();
    });

    it('should have accessible label for Deep Work preset', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Set timer to Deep Work - 90 minutes' })).toBeInTheDocument();
    });

    it('should have accessible label for Long Break preset', () => {
      render(<PresetGridV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Set timer to Long Break - 15 minutes' })).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should render presets in a 2-column grid', () => {
      const { container } = render(<PresetGridV2 {...defaultProps} />);
      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should have gap between grid items', () => {
      const { container } = render(<PresetGridV2 {...defaultProps} />);
      const grid = container.querySelector('.gap-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Custom Presets', () => {
    it('should render custom single preset', () => {
      const singlePreset = [{ id: 'custom', name: 'Custom', emoji: '⭐', minutes: 45 }];
      render(<PresetGridV2 {...defaultProps} presets={singlePreset} />);

      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
      expect(screen.getByText('45 minutes')).toBeInTheDocument();
    });

    it('should render empty grid when passed empty array', () => {
      // Note: component has DEFAULT_PRESETS fallback, but we test with passed prop
      render(<PresetGridV2 {...defaultProps} presets={[]} />);
      // With empty array, no buttons
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should use "minute" singular for 1 minute', () => {
      const presets = [{ id: 'one', name: 'One Min', emoji: '1️⃣', minutes: 1 }];
      render(<PresetGridV2 {...defaultProps} presets={presets} />);
      // singular "minute" for 1
      expect(screen.getByText('1 minute')).toBeInTheDocument();
    });

    it('should use "minutes" plural for 60 minutes', () => {
      const presets = [{ id: 'sixty', name: 'Hour', emoji: '⏰', minutes: 60 }];
      render(<PresetGridV2 {...defaultProps} presets={presets} />);
      expect(screen.getByText('60 minutes')).toBeInTheDocument();
    });
  });

  describe('Transition and Hover Styles', () => {
    it('should have transition class on preset buttons', () => {
      render(<PresetGridV2 {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.className).toContain('transition-all');
      });
    });
  });
});
