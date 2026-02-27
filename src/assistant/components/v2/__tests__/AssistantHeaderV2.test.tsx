/**
 * Unit tests for AssistantHeaderV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssistantHeaderV2 } from '../AssistantHeaderV2';

describe('AssistantHeaderV2', () => {
  describe('Basic Rendering', () => {
    it('should render the AI Assistant heading', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      expect(screen.getByText('🤖 AI Assistant')).toBeInTheDocument();
    });

    it('should render an h1 heading', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render the robot emoji', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      expect(screen.getByText(/🤖/)).toBeInTheDocument();
    });

    it('should render new chat button with + icon', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should render new chat button with aria-label', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      expect(screen.getByRole('button', { name: /start new chat/i })).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onNewChat when + button clicked', async () => {
      const user = userEvent.setup();
      const onNewChatMock = vi.fn();
      render(<AssistantHeaderV2 onNewChat={onNewChatMock} />);

      await user.click(screen.getByRole('button', { name: /start new chat/i }));
      expect(onNewChatMock).toHaveBeenCalledTimes(1);
    });

    it('should call onNewChat only once per click', async () => {
      const user = userEvent.setup();
      const onNewChatMock = vi.fn();
      render(<AssistantHeaderV2 onNewChat={onNewChatMock} />);

      await user.click(screen.getByRole('button', { name: /start new chat/i }));
      await user.click(screen.getByRole('button', { name: /start new chat/i }));
      expect(onNewChatMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Styling', () => {
    it('should have terracotta gradient background', () => {
      const { container } = render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      const header = container.firstChild as HTMLElement;
      expect(header.style.background).toContain('linear-gradient');
      expect(header.style.background).toContain('#D4A574');
    });

    it('should have rounded-xl class', () => {
      const { container } = render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('rounded-xl');
    });

    it('heading should have text-white class', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.className).toContain('text-white');
    });

    it('new chat button should be rounded', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      const button = screen.getByRole('button', { name: /start new chat/i });
      expect(button.className).toContain('rounded-lg');
    });

    it('heading should have text-2xl class', () => {
      render(<AssistantHeaderV2 onNewChat={vi.fn()} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.className).toContain('text-2xl');
    });
  });
});
