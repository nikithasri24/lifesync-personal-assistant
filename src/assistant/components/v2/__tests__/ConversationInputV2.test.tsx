/**
 * Unit tests for ConversationInputV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationInputV2 } from '../ConversationInputV2';

describe('ConversationInputV2', () => {
  describe('Basic Rendering', () => {
    it('should render textarea input', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} placeholder="Type a message..." />);
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('should render voice button', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByRole('button', { name: /voice input/i })).toBeInTheDocument();
    });

    it('should render voice emoji', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByText('🎤')).toBeInTheDocument();
    });

    it('should render send arrow', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('Send Button State', () => {
    it('send button should be disabled when input is empty', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    });

    it('send button should be enabled when input has text', async () => {
      const user = userEvent.setup();
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);

      await user.type(screen.getByRole('textbox'), 'Hello');
      expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();
    });

    it('send button should be disabled when disabled prop is true', async () => {
      const user = userEvent.setup();
      render(<ConversationInputV2 onSendMessage={vi.fn()} disabled={true} />);

      await user.type(screen.getByRole('textbox'), 'Hello');
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    });

    it('send button remains disabled when input is only whitespace', async () => {
      const user = userEvent.setup();
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);

      await user.type(screen.getByRole('textbox'), '   ');
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('textarea should be disabled when disabled=true', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} disabled={true} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('voice button should be disabled when disabled=true', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} disabled={true} />);
      expect(screen.getByRole('button', { name: /voice input/i })).toBeDisabled();
    });

    it('textarea should be enabled when disabled=false', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} disabled={false} />);
      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });
  });

  describe('Message Sending', () => {
    it('should call onSendMessage when send button clicked', async () => {
      const user = userEvent.setup();
      const onSendMock = vi.fn();
      render(<ConversationInputV2 onSendMessage={onSendMock} />);

      await user.type(screen.getByRole('textbox'), 'Hello AI!');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      expect(onSendMock).toHaveBeenCalledWith('Hello AI!');
    });

    it('should call onSendMessage with trimmed text', async () => {
      const user = userEvent.setup();
      const onSendMock = vi.fn();
      render(<ConversationInputV2 onSendMessage={onSendMock} />);

      await user.type(screen.getByRole('textbox'), '  Hello  ');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      expect(onSendMock).toHaveBeenCalledWith('Hello');
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(textarea, 'Hello');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      expect(textarea.value).toBe('');
    });

    it('should call onSendMessage when Enter key pressed', async () => {
      const user = userEvent.setup();
      const onSendMock = vi.fn();
      render(<ConversationInputV2 onSendMessage={onSendMock} />);

      await user.type(screen.getByRole('textbox'), 'Hello{Enter}');

      expect(onSendMock).toHaveBeenCalledWith('Hello');
    });

    it('should NOT send when Shift+Enter pressed (newline)', async () => {
      const user = userEvent.setup();
      const onSendMock = vi.fn();
      render(<ConversationInputV2 onSendMessage={onSendMock} />);

      await user.type(screen.getByRole('textbox'), 'Hello{Shift>}{Enter}{/Shift}');

      expect(onSendMock).not.toHaveBeenCalled();
    });

    it('should not call onSendMessage when input is empty and Enter pressed', async () => {
      const user = userEvent.setup();
      const onSendMock = vi.fn();
      render(<ConversationInputV2 onSendMessage={onSendMock} />);

      await user.keyboard('{Enter}');

      expect(onSendMock).not.toHaveBeenCalled();
    });
  });

  describe('Voice Input', () => {
    it('should call onVoiceInput when voice button clicked', async () => {
      const user = userEvent.setup();
      const onVoiceInputMock = vi.fn();
      render(<ConversationInputV2 onSendMessage={vi.fn()} onVoiceInput={onVoiceInputMock} />);

      await user.click(screen.getByRole('button', { name: /voice input/i }));
      expect(onVoiceInputMock).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onVoiceInput not provided', async () => {
      const user = userEvent.setup();
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);

      await expect(
        user.click(screen.getByRole('button', { name: /voice input/i }))
      ).resolves.not.toThrow();
    });
  });

  describe('Styling', () => {
    it('container should have rounded-xl class', () => {
      const { container } = render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('rounded-xl');
    });

    it('textarea should have resize-none class', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      expect(screen.getByRole('textbox').className).toContain('resize-none');
    });

    it('send button should be rounded-full', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton.className).toContain('rounded-full');
    });

    it('voice button should be rounded-full', () => {
      render(<ConversationInputV2 onSendMessage={vi.fn()} />);
      const voiceButton = screen.getByRole('button', { name: /voice input/i });
      expect(voiceButton.className).toContain('rounded-full');
    });
  });
});
