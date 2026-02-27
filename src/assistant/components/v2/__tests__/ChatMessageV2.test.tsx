/**
 * Unit tests for ChatMessageV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessageV2 } from '../ChatMessageV2';

const userMessage = {
  role: 'user' as const,
  content: 'Hello, can you help me?',
  timestamp: '2026-02-15T10:00:00Z',
};

const assistantMessage = {
  role: 'assistant' as const,
  content: 'Of course! I can help you with tasks, habits, and more.',
  timestamp: '2026-02-15T10:00:05Z',
};

describe('ChatMessageV2', () => {
  describe('Message Content', () => {
    it('should render user message content', () => {
      render(<ChatMessageV2 message={userMessage} />);
      expect(screen.getByText('Hello, can you help me?')).toBeInTheDocument();
    });

    it('should render assistant message content', () => {
      render(<ChatMessageV2 message={assistantMessage} />);
      expect(screen.getByText('Of course! I can help you with tasks, habits, and more.')).toBeInTheDocument();
    });

    it('should render long messages', () => {
      const longMessage = { ...userMessage, content: 'A'.repeat(500) };
      render(<ChatMessageV2 message={longMessage} />);
      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });
  });

  describe('Alignment', () => {
    it('user message should be right-aligned (self-end)', () => {
      const { container } = render(<ChatMessageV2 message={userMessage} />);
      const messageWrapper = container.querySelector('.self-end');
      expect(messageWrapper).toBeInTheDocument();
    });

    it('assistant message should be left-aligned (self-start)', () => {
      const { container } = render(<ChatMessageV2 message={assistantMessage} />);
      const messageWrapper = container.querySelector('.self-start');
      expect(messageWrapper).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('should render robot emoji for assistant', () => {
      render(<ChatMessageV2 message={assistantMessage} showAvatar={true} />);
      expect(screen.getByText('🤖')).toBeInTheDocument();
    });

    it('should render user initial for user message', () => {
      render(<ChatMessageV2 message={userMessage} showAvatar={true} />);
      // User avatar shows first letter of user name or "S" (default)
      const avatar = screen.getByText(/^[A-Z]$/);
      expect(avatar).toBeInTheDocument();
    });

    it('should show avatar by default (showAvatar=true)', () => {
      const { container } = render(<ChatMessageV2 message={assistantMessage} />);
      // w-8 h-8 avatar div should be present
      const avatar = container.querySelector('.w-8.h-8');
      expect(avatar).toBeInTheDocument();
    });

    it('should hide avatar when showAvatar=false', () => {
      const { container } = render(<ChatMessageV2 message={assistantMessage} showAvatar={false} />);
      const avatar = container.querySelector('.w-8.h-8');
      expect(avatar).not.toBeInTheDocument();
    });
  });

  describe('Context Badge', () => {
    it('should render context badge for assistant message', () => {
      const messageWithBadge = { ...assistantMessage, contextBadge: 'Task Created' };
      render(<ChatMessageV2 message={messageWithBadge} />);
      expect(screen.getByText('Task Created')).toBeInTheDocument();
    });

    it('should not render context badge for user message', () => {
      const messageWithBadge = { ...userMessage, contextBadge: 'Task Created' };
      render(<ChatMessageV2 message={messageWithBadge} />);
      expect(screen.queryByText('Task Created')).not.toBeInTheDocument();
    });

    it('should not render badge when contextBadge not provided', () => {
      render(<ChatMessageV2 message={assistantMessage} />);
      expect(screen.queryByText('Task Created')).not.toBeInTheDocument();
    });
  });

  describe('Suggestion Chips', () => {
    it('should render suggestion chips for assistant messages', () => {
      const messageWithSuggestions = {
        ...assistantMessage,
        suggestions: ['View tasks', 'Add habit', 'Check budget'],
      };
      render(<ChatMessageV2 message={messageWithSuggestions} onSuggestionClick={vi.fn()} />);
      expect(screen.getByText('View tasks')).toBeInTheDocument();
      expect(screen.getByText('Add habit')).toBeInTheDocument();
      expect(screen.getByText('Check budget')).toBeInTheDocument();
    });

    it('should not render suggestions for user messages', () => {
      const messageWithSuggestions = {
        ...userMessage,
        suggestions: ['View tasks'],
      };
      render(<ChatMessageV2 message={messageWithSuggestions} onSuggestionClick={vi.fn()} />);
      expect(screen.queryByText('View tasks')).not.toBeInTheDocument();
    });

    it('should call onSuggestionClick when chip clicked', async () => {
      const user = userEvent.setup();
      const onSuggestionClickMock = vi.fn();
      const messageWithSuggestions = {
        ...assistantMessage,
        suggestions: ['Add a task'],
      };
      render(
        <ChatMessageV2 message={messageWithSuggestions} onSuggestionClick={onSuggestionClickMock} />
      );

      await user.click(screen.getByText('Add a task'));
      expect(onSuggestionClickMock).toHaveBeenCalledWith('Add a task');
    });

    it('should not render chips when onSuggestionClick not provided', () => {
      const messageWithSuggestions = {
        ...assistantMessage,
        suggestions: ['View tasks'],
      };
      render(<ChatMessageV2 message={messageWithSuggestions} />);
      // No click handler, chips not rendered
      expect(screen.queryByText('View tasks')).not.toBeInTheDocument();
    });

    it('should not render chips when suggestions is empty', () => {
      const messageWithEmptySuggestions = {
        ...assistantMessage,
        suggestions: [],
      };
      render(<ChatMessageV2 message={messageWithEmptySuggestions} onSuggestionClick={vi.fn()} />);
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Timestamp', () => {
    it('should not show timestamp by default (showTimestamp=false)', () => {
      render(<ChatMessageV2 message={userMessage} />);
      // Default is showTimestamp=false, so no relative time shown
      expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
    });

    it('should show timestamp when showTimestamp=true', () => {
      render(<ChatMessageV2 message={userMessage} showTimestamp={true} />);
      // Should show relative time like "X minutes ago"
      expect(screen.getByText(/ago|just now/)).toBeInTheDocument();
    });
  });

  describe('Message Bubble Styling', () => {
    it('user bubble should have rounded corners', () => {
      const { container } = render(<ChatMessageV2 message={userMessage} />);
      const bubble = container.querySelector('.rounded-2xl');
      expect(bubble).toBeInTheDocument();
    });

    it('assistant bubble should have rounded corners', () => {
      const { container } = render(<ChatMessageV2 message={assistantMessage} />);
      const bubble = container.querySelector('.rounded-2xl');
      expect(bubble).toBeInTheDocument();
    });

    it('should have text-sm in bubble', () => {
      const { container } = render(<ChatMessageV2 message={userMessage} />);
      const bubble = container.querySelector('.text-sm');
      expect(bubble).toBeInTheDocument();
    });
  });
});
