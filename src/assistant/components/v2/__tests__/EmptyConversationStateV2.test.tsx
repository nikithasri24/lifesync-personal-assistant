/**
 * Unit tests for EmptyConversationStateV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyConversationStateV2 } from '../EmptyConversationStateV2';

describe('EmptyConversationStateV2', () => {
  describe('Basic Rendering', () => {
    it('should render the robot emoji', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText('🤖')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText('How can I help you?')).toBeInTheDocument();
    });

    it('should render the subtitle description', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText(/I can help you manage tasks/)).toBeInTheDocument();
    });

    it('should use h2 for main heading', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Starter Prompts', () => {
    it('should render 5 starter prompt buttons', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('should render "What are my tasks for today?" prompt', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText('What are my tasks for today?')).toBeInTheDocument();
    });

    it('should render "Help me plan meals for the week" prompt', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText('Help me plan meals for the week')).toBeInTheDocument();
    });

    it('should render "Show my habit streaks" prompt', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText('Show my habit streaks')).toBeInTheDocument();
    });

    it('should render budget status prompt', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText("What's my budget status?")).toBeInTheDocument();
    });

    it('should render "Create a quick task" prompt', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      expect(screen.getByText('Create a quick task')).toBeInTheDocument();
    });
  });

  describe('Prompt Click Handling', () => {
    it('should call onSuggestionClick with prompt text when clicked', async () => {
      const user = userEvent.setup();
      const onSuggestionClickMock = vi.fn();
      render(<EmptyConversationStateV2 onSuggestionClick={onSuggestionClickMock} />);

      await user.click(screen.getByText('What are my tasks for today?'));
      expect(onSuggestionClickMock).toHaveBeenCalledWith('What are my tasks for today?');
    });

    it('should call onSuggestionClick with correct text for meals prompt', async () => {
      const user = userEvent.setup();
      const onSuggestionClickMock = vi.fn();
      render(<EmptyConversationStateV2 onSuggestionClick={onSuggestionClickMock} />);

      await user.click(screen.getByText('Help me plan meals for the week'));
      expect(onSuggestionClickMock).toHaveBeenCalledWith('Help me plan meals for the week');
    });

    it('should call onSuggestionClick with correct text for habits prompt', async () => {
      const user = userEvent.setup();
      const onSuggestionClickMock = vi.fn();
      render(<EmptyConversationStateV2 onSuggestionClick={onSuggestionClickMock} />);

      await user.click(screen.getByText('Show my habit streaks'));
      expect(onSuggestionClickMock).toHaveBeenCalledWith('Show my habit streaks');
    });

    it('should call onSuggestionClick with correct text for budget prompt', async () => {
      const user = userEvent.setup();
      const onSuggestionClickMock = vi.fn();
      render(<EmptyConversationStateV2 onSuggestionClick={onSuggestionClickMock} />);

      await user.click(screen.getByText("What's my budget status?"));
      expect(onSuggestionClickMock).toHaveBeenCalledWith("What's my budget status?");
    });

    it('should call onSuggestionClick with correct text for create task prompt', async () => {
      const user = userEvent.setup();
      const onSuggestionClickMock = vi.fn();
      render(<EmptyConversationStateV2 onSuggestionClick={onSuggestionClickMock} />);

      await user.click(screen.getByText('Create a quick task'));
      expect(onSuggestionClickMock).toHaveBeenCalledWith('Create a quick task');
    });
  });

  describe('Styling', () => {
    it('should be centered', () => {
      const { container } = render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('text-center');
    });

    it('should have flex-col layout', () => {
      const { container } = render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex-col');
    });

    it('starter prompt buttons should have rounded-xl', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn.className).toContain('rounded-xl');
      });
    });

    it('starter prompt buttons should have text-left', () => {
      render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn.className).toContain('text-left');
      });
    });

    it('emoji should have large size', () => {
      const { container } = render(<EmptyConversationStateV2 onSuggestionClick={vi.fn()} />);
      const emojiDiv = container.querySelector('.text-6xl');
      expect(emojiDiv).toBeInTheDocument();
    });
  });
});
