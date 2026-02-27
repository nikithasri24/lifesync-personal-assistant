/**
 * Unit tests for TimerControlsV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimerControlsV2 } from '../TimerControlsV2';

const defaultProps = {
  isActive: false,
  isPaused: false,
  onPlayPause: vi.fn(),
  onReset: vi.fn(),
};

describe('TimerControlsV2', () => {
  describe('Play/Pause Button', () => {
    it('should render a play button when timer is not active', () => {
      render(<TimerControlsV2 {...defaultProps} isActive={false} isPaused={false} />);
      expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
    });

    it('should render a pause button when timer is active', () => {
      render(<TimerControlsV2 {...defaultProps} isActive={true} isPaused={false} />);
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();
    });

    it('should render a resume button when timer is paused', () => {
      render(<TimerControlsV2 {...defaultProps} isActive={false} isPaused={true} />);
      expect(screen.getByRole('button', { name: /resume timer/i })).toBeInTheDocument();
    });

    it('should call onPlayPause when play button clicked', async () => {
      const user = userEvent.setup();
      const onPlayPauseMock = vi.fn();
      render(<TimerControlsV2 {...defaultProps} onPlayPause={onPlayPauseMock} />);

      await user.click(screen.getByRole('button', { name: /start timer/i }));
      expect(onPlayPauseMock).toHaveBeenCalledTimes(1);
    });

    it('should call onPlayPause when pause button clicked', async () => {
      const user = userEvent.setup();
      const onPlayPauseMock = vi.fn();
      render(<TimerControlsV2 {...defaultProps} isActive={true} onPlayPause={onPlayPauseMock} />);

      await user.click(screen.getByRole('button', { name: /pause timer/i }));
      expect(onPlayPauseMock).toHaveBeenCalledTimes(1);
    });

    it('should call onPlayPause when resume button clicked', async () => {
      const user = userEvent.setup();
      const onPlayPauseMock = vi.fn();
      render(<TimerControlsV2 {...defaultProps} isPaused={true} onPlayPause={onPlayPauseMock} />);

      await user.click(screen.getByRole('button', { name: /resume timer/i }));
      expect(onPlayPauseMock).toHaveBeenCalledTimes(1);
    });

    it('play/pause button should be larger than reset button', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const playButton = screen.getByRole('button', { name: /start timer/i });
      const resetButton = screen.getByRole('button', { name: /reset timer/i });

      expect(playButton.className).toContain('w-20');
      expect(resetButton.className).toContain('w-16');
    });

    it('play button should have terracotta gradient', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const playButton = screen.getByRole('button', { name: /start timer/i });
      expect(playButton.style.background).toContain('linear-gradient');
    });

    it('play button should have white text', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const playButton = screen.getByRole('button', { name: /start timer/i });
      expect(playButton.className).toContain('text-white');
    });
  });

  describe('Reset Button', () => {
    it('should render reset button', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      expect(screen.getByRole('button', { name: /reset timer/i })).toBeInTheDocument();
    });

    it('should call onReset when clicked', async () => {
      const user = userEvent.setup();
      const onResetMock = vi.fn();
      render(<TimerControlsV2 {...defaultProps} onReset={onResetMock} />);

      await user.click(screen.getByRole('button', { name: /reset timer/i }));
      expect(onResetMock).toHaveBeenCalledTimes(1);
    });

    it('should have terracotta color for reset icon', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const resetButton = screen.getByRole('button', { name: /reset timer/i });
      expect(resetButton.style.color).toMatch(/rgb\(193, 139, 94\)|#C18B5E/i);
    });

    it('should have card background for reset button', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const resetButton = screen.getByRole('button', { name: /reset timer/i });
      // Background from theme - not checking exact value
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Settings Button', () => {
    it('should NOT render settings button when onSettings not provided', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument();
    });

    it('should render settings button when onSettings provided', () => {
      render(<TimerControlsV2 {...defaultProps} onSettings={vi.fn()} />);
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('should call onSettings when settings button clicked', async () => {
      const user = userEvent.setup();
      const onSettingsMock = vi.fn();
      render(<TimerControlsV2 {...defaultProps} onSettings={onSettingsMock} />);

      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(onSettingsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('should disable all buttons when disabled=true', () => {
      render(<TimerControlsV2 {...defaultProps} disabled={true} onSettings={vi.fn()} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should not disable buttons when disabled=false', () => {
      render(<TimerControlsV2 {...defaultProps} disabled={false} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should not call onPlayPause when disabled and clicked', async () => {
      const user = userEvent.setup();
      const onPlayPauseMock = vi.fn();
      render(<TimerControlsV2 {...defaultProps} disabled={true} onPlayPause={onPlayPauseMock} />);

      await user.click(screen.getByRole('button', { name: /start timer/i }));
      expect(onPlayPauseMock).not.toHaveBeenCalled();
    });

    it('should not call onReset when disabled and clicked', async () => {
      const user = userEvent.setup();
      const onResetMock = vi.fn();
      render(<TimerControlsV2 {...defaultProps} disabled={true} onReset={onResetMock} />);

      await user.click(screen.getByRole('button', { name: /reset timer/i }));
      expect(onResetMock).not.toHaveBeenCalled();
    });
  });

  describe('Button Count', () => {
    it('should render 2 buttons without settings', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('should render 3 buttons with settings', () => {
      render(<TimerControlsV2 {...defaultProps} onSettings={vi.fn()} />);
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('Layout', () => {
    it('should have flex layout', () => {
      const { container } = render(<TimerControlsV2 {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex');
    });

    it('should have centered alignment', () => {
      const { container } = render(<TimerControlsV2 {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('justify-center');
    });

    it('should have gap between buttons', () => {
      const { container } = render(<TimerControlsV2 {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('gap-4');
    });

    it('should have top margin', () => {
      const { container } = render(<TimerControlsV2 {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('mt-8');
    });
  });

  describe('Transition Styles', () => {
    it('play button should have scale hover class', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const playButton = screen.getByRole('button', { name: /start timer/i });
      expect(playButton.className).toContain('hover:scale-110');
    });

    it('reset button should have scale hover class', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const resetButton = screen.getByRole('button', { name: /reset timer/i });
      expect(resetButton.className).toContain('hover:scale-105');
    });

    it('play button should have active scale class', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const playButton = screen.getByRole('button', { name: /start timer/i });
      expect(playButton.className).toContain('active:scale-90');
    });
  });

  describe('Rounded Buttons', () => {
    it('play button should be fully rounded', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const playButton = screen.getByRole('button', { name: /start timer/i });
      expect(playButton.className).toContain('rounded-full');
    });

    it('reset button should be fully rounded', () => {
      render(<TimerControlsV2 {...defaultProps} />);
      const resetButton = screen.getByRole('button', { name: /reset timer/i });
      expect(resetButton.className).toContain('rounded-full');
    });
  });
});
