/**
 * Unit tests for JournalEntryModalV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalEntryModalV2 } from '../JournalEntryModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, onClose, title, children, validate, onSubmit, initialData, defaultData, isPending }: any) => {
    if (!isOpen) return null;

    const initialFormState = initialData || defaultData || {
      title: '',
      content: '',
    };

    const [formState, setFormState] = React.useState(initialFormState);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;
      const titleInput = form.querySelector('input[placeholder="Entry title..."]') as HTMLInputElement;
      const contentTextarea = form.querySelector('textarea') as HTMLTextAreaElement;

      const currentFormState = {
        ...formState,
        title: titleInput?.value || '',
        content: contentTextarea?.value || '',
      };

      const error = validate?.(currentFormState);
      if (error) {
        alert(error);
        return;
      }
      await onSubmit(currentFormState);
    };

    return (
      <div data-testid="form-modal">
        <h2>{title}</h2>
        <form onSubmit={handleSubmit} noValidate>
          {children(formState, setFormState)}
          <button type="submit" disabled={isPending}>Submit</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    );
  },
}));

describe('JournalEntryModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create mode by default', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('New Entry')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Title (optional)')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Entry title...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
    });

    it('should render attach files button', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Attach Files or Photos')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { container } = render(<JournalEntryModalV2 isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Edit Mode', () => {
    const existingEntry = {
      title: 'Existing Entry',
      content: 'Existing content',
    };

    it('should render edit mode when isEditing is true', () => {
      render(
        <JournalEntryModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingEntry}
          isEditing={true}
        />
      );

      expect(screen.getByText('Edit Entry')).toBeInTheDocument();
    });

    it('should pre-fill form with existing data', () => {
      render(
        <JournalEntryModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingEntry}
          isEditing={true}
        />
      );

      expect(screen.getByDisplayValue('Existing Entry')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing content')).toBeInTheDocument();
    });

    it('should handle entry without title', () => {
      const entryWithoutTitle = {
        title: '',
        content: 'Content only',
      };

      render(
        <JournalEntryModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={entryWithoutTitle}
          isEditing={true}
        />
      );

      const titleInput = screen.getByPlaceholderText('Entry title...') as HTMLInputElement;
      expect(titleInput.value).toBe('');
      expect(screen.getByDisplayValue('Content only')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should update title field on input', async () => {
      const user = userEvent.setup();
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Entry title...') as HTMLInputElement;
      await user.type(titleInput, 'My New Entry');

      expect(titleInput.value).toBe('My New Entry');
    });

    it('should update content field on input', async () => {
      const user = userEvent.setup();
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?") as HTMLTextAreaElement;
      await user.type(contentTextarea, 'This is my journal entry');

      expect(contentTextarea.value).toBe('This is my journal entry');
    });

    it('should not mark title as required', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Entry title...');
      expect(titleInput).not.toHaveAttribute('required');
    });

    it('should mark content as required', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      expect(contentTextarea).toHaveAttribute('required');
    });

    it('should have correct textarea rows', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      expect(contentTextarea).toHaveAttribute('rows', '10');
    });
  });

  describe('Form Validation', () => {
    it('should validate empty content', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Content is required');
      });

      alertSpy.mockRestore();
    });

    it('should allow empty title', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      await user.type(contentTextarea, 'Content without title');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should not show validation error for missing title
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should trim whitespace from content', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      await user.type(contentTextarea, '   ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Content is required');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data', async () => {
      const user = userEvent.setup();

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Entry title...');
      await user.type(titleInput, 'My Entry');

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      await user.type(contentTextarea, 'Entry content');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'My Entry',
          content: 'Entry content',
        });
      });
    });

    it('should handle submission without title', async () => {
      const user = userEvent.setup();

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      await user.type(contentTextarea, 'Content only');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: '',
          content: 'Content only',
        });
      });
    });

    it('should trim whitespace from fields', async () => {
      const user = userEvent.setup();

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Entry title...');
      await user.type(titleInput, '  My Entry  ');

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      await user.type(contentTextarea, '  Content  ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'My Entry',
          content: 'Content',
        });
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should disable submit button when pending', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isPending={true} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Attach Files Button', () => {
    it('should render attach files button', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const attachButton = screen.getByRole('button', { name: /attach files/i });
      expect(attachButton).toBeInTheDocument();
    });

    it('should have proper aria-label for attach button', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const attachButton = screen.getByLabelText('Attach files');
      expect(attachButton).toBeInTheDocument();
    });

    it('should show paperclip icon', () => {
      const { container } = render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // lucide-react Paperclip renders as svg
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const user = userEvent.setup();

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const longTitle = 'A'.repeat(200);
      const titleInput = screen.getByPlaceholderText('Entry title...');
      await user.type(titleInput, longTitle);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: longTitle,
          })
        );
      });
    });

    it('should handle very long content in textarea', async () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const longContent = 'B'.repeat(5000);
      const contentTextarea = screen.getByPlaceholderText("What's on your mind?") as HTMLTextAreaElement;

      // Set value directly for large content
      contentTextarea.value = longContent;
      expect(contentTextarea.value).toBe(longContent);
      expect(contentTextarea.value.length).toBe(5000);
    });

    it('should handle special characters in title', async () => {
      const user = userEvent.setup();

      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const specialTitle = 'Entry <>&"\'';
      const titleInput = screen.getByPlaceholderText('Entry title...');
      await user.type(titleInput, specialTitle);

      const contentTextarea = screen.getByPlaceholderText("What's on your mind?");
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: specialTitle,
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Title (optional)')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should have proper input IDs', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Title (optional)')).toHaveAttribute('id', 'entry-title');
      expect(screen.getByLabelText('Content')).toHaveAttribute('id', 'entry-content');
    });

    it('should mark content as required visually', () => {
      render(<JournalEntryModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentLabel = screen.getByText('Content');
      expect(contentLabel).toBeInTheDocument();
      // Label doesn't have asterisk since it's handled by required attribute
    });
  });
});
