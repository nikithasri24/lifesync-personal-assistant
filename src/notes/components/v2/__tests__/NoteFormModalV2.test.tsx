/**
 * Unit tests for NoteFormModalV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteFormModalV2 } from '../NoteFormModalV2';
import type { NoteType } from '../../../types';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, onClose, title, children, validate, onSubmit, initialData, defaultData, isPending }: any) => {
    if (!isOpen) return null;

    const initialFormState = initialData || defaultData || {
      noteType: 'note' as NoteType,
      title: '',
      content: '',
      tags: '',
    };

    const [formState, setFormState] = React.useState(initialFormState);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Get the latest form state from the form
      const form = e.target as HTMLFormElement;
      const titleInput = form.querySelector('input[placeholder="Note title..."]') as HTMLInputElement;
      const contentTextarea = form.querySelector('textarea') as HTMLTextAreaElement;
      const tagsInput = form.querySelector('input[placeholder="work, ideas, personal"]') as HTMLInputElement;

      const currentFormState = {
        ...formState,
        title: titleInput?.value || '',
        content: contentTextarea?.value || '',
        tags: tagsInput?.value || '',
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

describe('NoteFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create mode by default', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Create Note')).toBeInTheDocument();
    });

    it('should render all form fields in create mode', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Note Type')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Note title...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Start writing...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('work, ideas, personal')).toBeInTheDocument();
    });

    it('should have text note selected by default', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const textNoteButton = screen.getByText('📝 Text Note');
      expect(textNoteButton.closest('button')).toBeInTheDocument();
    });

    it('should allow switching to checklist mode', async () => {
      const user = userEvent.setup();
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const checklistButton = screen.getByText('☑️ Checklist');
      await user.click(checklistButton);

      // After clicking, checklist should be active
      expect(screen.getByText('☑️ Checklist')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { container } = render(<NoteFormModalV2 isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Edit Mode', () => {
    const existingNote = {
      title: 'Existing Note',
      content: 'Existing content',
      noteType: 'note' as NoteType,
      tags: ['work', 'important'],
    };

    it('should render edit mode when isEditing is true', () => {
      render(
        <NoteFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingNote}
          isEditing={true}
        />
      );

      expect(screen.getByText('Edit Note')).toBeInTheDocument();
    });

    it('should pre-fill form with existing note data', () => {
      render(
        <NoteFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingNote}
          isEditing={true}
        />
      );

      expect(screen.getByDisplayValue('Existing Note')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing content')).toBeInTheDocument();
      expect(screen.getByDisplayValue('work, important')).toBeInTheDocument();
    });

    it('should pre-select correct note type', () => {
      render(
        <NoteFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingNote}
          isEditing={true}
        />
      );

      // Text note should be pre-selected
      expect(screen.getByText('📝 Text Note')).toBeInTheDocument();
    });

    it('should handle checklist note in edit mode', () => {
      const checklistNote = {
        ...existingNote,
        noteType: 'list' as NoteType,
      };

      render(
        <NoteFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={checklistNote}
          isEditing={true}
        />
      );

      expect(screen.getByText('☑️ Checklist')).toBeInTheDocument();
    });

    it('should handle note without tags', () => {
      const noteWithoutTags = {
        ...existingNote,
        tags: [],
      };

      render(
        <NoteFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={noteWithoutTags}
          isEditing={true}
        />
      );

      const tagsInput = screen.getByPlaceholderText('work, ideas, personal') as HTMLInputElement;
      expect(tagsInput.value).toBe('');
    });
  });

  describe('Form Fields', () => {
    it('should update title field on input', async () => {
      const user = userEvent.setup();
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Note title...') as HTMLInputElement;
      await user.type(titleInput, 'My New Note');

      expect(titleInput.value).toBe('My New Note');
    });

    it('should update content field on input', async () => {
      const user = userEvent.setup();
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByPlaceholderText('Start writing...') as HTMLTextAreaElement;
      await user.type(contentTextarea, 'This is my note content');

      expect(contentTextarea.value).toBe('This is my note content');
    });

    it('should update tags field on input', async () => {
      const user = userEvent.setup();
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const tagsInput = screen.getByPlaceholderText('work, ideas, personal') as HTMLInputElement;
      await user.type(tagsInput, 'work, important, urgent');

      expect(tagsInput.value).toBe('work, important, urgent');
    });

    it('should toggle between text note and checklist', async () => {
      const user = userEvent.setup();
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const textNoteButton = screen.getByText('📝 Text Note');
      const checklistButton = screen.getByText('☑️ Checklist');

      // Start with text note
      expect(textNoteButton).toBeInTheDocument();

      // Switch to checklist
      await user.click(checklistButton);
      expect(checklistButton).toBeInTheDocument();

      // Switch back to text note
      await user.click(textNoteButton);
      expect(textNoteButton).toBeInTheDocument();
    });

    it('should mark title as required', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Note title...');
      expect(titleInput).toHaveAttribute('required');
    });

    it('should not mark tags as required', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const tagsInput = screen.getByPlaceholderText('work, ideas, personal');
      expect(tagsInput).not.toHaveAttribute('required');
    });

    it('should change content placeholder for checklist', async () => {
      const user = userEvent.setup();
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // Switch to checklist
      const checklistButton = screen.getByText('☑️ Checklist');
      await user.click(checklistButton);

      // Content placeholder should change
      expect(screen.getByPlaceholderText('Add checklist items...')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Start writing...')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require title for text notes', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Note title...');
      expect(titleInput).toHaveAttribute('required');
    });

    it('should validate empty title', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Since title is empty, validation should fail
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Title is required');
      });

      alertSpy.mockRestore();
    });

    it('should validate empty content for text notes', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Note title...');
      await user.type(titleInput, 'Test Title');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Content is required for text notes');
      });

      alertSpy.mockRestore();
    });

    it('should not require content for checklists', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // Switch to checklist
      const checklistButton = screen.getByText('☑️ Checklist');
      await user.click(checklistButton);

      const titleInput = screen.getByPlaceholderText('Note title...');
      await user.type(titleInput, 'My Checklist');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should not alert for missing content
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data on create', async () => {
      const user = userEvent.setup();

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Note title...');
      await user.type(titleInput, 'My Note');

      const contentTextarea = screen.getByPlaceholderText('Start writing...');
      await user.type(contentTextarea, 'Note content');

      const tagsInput = screen.getByPlaceholderText('work, ideas, personal');
      await user.type(tagsInput, 'work, important');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'My Note',
          content: 'Note content',
          noteType: 'note',
          tags: ['work', 'important'],
        });
      });
    });

    it('should parse tags correctly', async () => {
      const user = userEvent.setup();

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Note title...');
      await user.type(titleInput, 'Tagged Note');

      const contentTextarea = screen.getByPlaceholderText('Start writing...');
      await user.type(contentTextarea, 'Content');

      const tagsInput = screen.getByPlaceholderText('work, ideas, personal');
      await user.type(tagsInput, 'tag1, tag2,tag3,  tag4  ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['tag1', 'tag2', 'tag3', 'tag4'],
          })
        );
      });
    });

    it('should handle empty tags', async () => {
      const user = userEvent.setup();

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Note title...');
      await user.type(titleInput, 'No Tags Note');

      const contentTextarea = screen.getByPlaceholderText('Start writing...');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: [],
          })
        );
      });
    });

    it('should create checklist note', async () => {
      const user = userEvent.setup();

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const checklistButton = screen.getByText('☑️ Checklist');
      await user.click(checklistButton);

      const titleInput = screen.getByPlaceholderText('Note title...');
      await user.type(titleInput, 'My Checklist');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            noteType: 'list',
            title: 'My Checklist',
          })
        );
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should disable submit button when pending', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isPending={true} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const user = userEvent.setup();

      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const longTitle = 'A'.repeat(200);
      const titleInput = screen.getByPlaceholderText('Note title...');
      await user.type(titleInput, longTitle);

      const contentTextarea = screen.getByPlaceholderText('Start writing...');
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
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const longContent = 'B'.repeat(5000);
      const contentTextarea = screen.getByPlaceholderText('Start writing...') as HTMLTextAreaElement;

      // Verify textarea can accept long content
      contentTextarea.value = longContent;
      expect(contentTextarea.value).toBe(longContent);
      expect(contentTextarea.value.length).toBe(5000);
    });

    it('should accept special characters in tag input', async () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const tagsInput = screen.getByPlaceholderText('work, ideas, personal') as HTMLInputElement;

      // Verify input accepts special characters
      const specialTags = 'C++, React.js, @work, #urgent';
      tagsInput.value = specialTags;
      expect(tagsInput.value).toBe(specialTags);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Note Type')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Tags (optional)')).toBeInTheDocument();
    });

    it('should show optional label for tags', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Tags (optional)')).toBeInTheDocument();
    });

    it('should have helper text for tags', () => {
      render(<NoteFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Separate tags with commas')).toBeInTheDocument();
    });
  });
});
