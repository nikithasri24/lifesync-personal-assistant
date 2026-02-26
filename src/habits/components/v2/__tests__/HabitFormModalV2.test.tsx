/**
 * Unit tests for HabitFormModalV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitFormModalV2 } from '../HabitFormModalV2';
import type { HabitDraft } from '../../../types';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, onClose, title, children, validate, onSubmit, initialData, defaultData, isPending }: any) => {
    if (!isOpen) return null;

    const initialFormState = initialData || defaultData || {
      name: '',
      description: '',
      frequency: 'daily',
      targetValue: '1',
      category: 'Health',
    };

    const [formState, setFormState] = React.useState(initialFormState);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;
      const nameInput = form.querySelector('input[placeholder="Exercise, Read, Meditate..."]') as HTMLInputElement;
      const descInput = form.querySelector('textarea') as HTMLTextAreaElement;
      const freqSelect = form.querySelector('select#habit-frequency') as HTMLSelectElement;
      const targetInput = form.querySelector('input[type="number"]') as HTMLInputElement;
      const catSelect = form.querySelector('select#habit-category') as HTMLSelectElement;

      const currentFormState = {
        ...formState,
        name: nameInput?.value || '',
        description: descInput?.value || '',
        frequency: freqSelect?.value || 'daily',
        targetValue: targetInput?.value || '1',
        category: catSelect?.value || 'Health',
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

describe('HabitFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Create Mode', () => {
    it('should render create mode by default', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('New Habit')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Habit Name')).toBeInTheDocument();
      expect(screen.getByText('Description (optional)')).toBeInTheDocument();
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('Target (optional)')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should have default values', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const freqSelect = screen.getByLabelText('Frequency') as HTMLSelectElement;
      expect(freqSelect.value).toBe('daily');

      const targetInput = screen.getByLabelText('Target (optional)') as HTMLInputElement;
      expect(targetInput.value).toBe('1');

      const catSelect = screen.getByLabelText('Category') as HTMLSelectElement;
      expect(catSelect.value).toBe('Health');
    });

    it('should not render when closed', () => {
      const { container } = render(<HabitFormModalV2 isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Edit Mode', () => {
    const existingHabit: HabitDraft = {
      name: 'Morning Run',
      description: 'Run 5km every morning',
      frequency: 'daily',
      targetValue: '1',
      category: 'Fitness',
      color: '#D4A574',
    };

    it('should render edit mode when isEditing is true', () => {
      render(
        <HabitFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingHabit}
          isEditing={true}
        />
      );

      expect(screen.getByText('Edit Habit')).toBeInTheDocument();
    });

    it('should pre-fill form with existing data', () => {
      render(
        <HabitFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingHabit}
          isEditing={true}
        />
      );

      expect(screen.getByDisplayValue('Morning Run')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Run 5km every morning')).toBeInTheDocument();
    });

    it('should pre-select frequency', () => {
      render(
        <HabitFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingHabit}
          isEditing={true}
        />
      );

      const freqSelect = screen.getByLabelText('Frequency') as HTMLSelectElement;
      expect(freqSelect.value).toBe('daily');
    });

    it('should pre-select category', () => {
      render(
        <HabitFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingHabit}
          isEditing={true}
        />
      );

      const catSelect = screen.getByLabelText('Category') as HTMLSelectElement;
      expect(catSelect.value).toBe('Fitness');
    });
  });

  describe('Form Fields', () => {
    it('should update habit name on input', async () => {
      const user = userEvent.setup();
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...') as HTMLInputElement;
      await user.type(nameInput, 'Daily Exercise');

      expect(nameInput.value).toBe('Daily Exercise');
    });

    it('should update description on input', async () => {
      const user = userEvent.setup();
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descTextarea = screen.getByPlaceholderText('Add more details about this habit...') as HTMLTextAreaElement;
      await user.type(descTextarea, '30 minutes of cardio');

      expect(descTextarea.value).toBe('30 minutes of cardio');
    });

    it('should update frequency on selection', async () => {
      const user = userEvent.setup();
      const { container } = render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const freqSelect = container.querySelector('select#habit-frequency') as HTMLSelectElement;
      await user.selectOptions(freqSelect, 'weekly');

      expect(freqSelect.value).toBe('weekly');
    });

    it('should update target value on input', async () => {
      const user = userEvent.setup();
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const targetInput = screen.getByLabelText('Target (optional)') as HTMLInputElement;
      await user.clear(targetInput);
      await user.type(targetInput, '3');

      expect(targetInput.value).toBe('3');
    });

    it('should update category on selection', async () => {
      const user = userEvent.setup();
      const { container } = render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const catSelect = container.querySelector('select#habit-category') as HTMLSelectElement;
      await user.selectOptions(catSelect, 'Learning');

      expect(catSelect.value).toBe('Learning');
    });

    it('should mark name as required', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      expect(nameInput).toHaveAttribute('required');
    });

    it('should not mark description as required', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descTextarea = screen.getByPlaceholderText('Add more details about this habit...');
      expect(descTextarea).not.toHaveAttribute('required');
    });
  });

  describe('Frequency Options', () => {
    it('should show daily frequency option', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('📅 Daily')).toBeInTheDocument();
    });

    it('should show weekly frequency option', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('📆 Weekly')).toBeInTheDocument();
    });

    it('should show monthly frequency option', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('🗓️ Monthly')).toBeInTheDocument();
    });

    it('should show helper text for daily frequency', async () => {
      const user = userEvent.setup();
      const { container } = render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const freqSelect = container.querySelector('select#habit-frequency') as HTMLSelectElement;
      await user.selectOptions(freqSelect, 'daily');

      expect(screen.getByText('Number of times per day')).toBeInTheDocument();
    });

    it('should show helper text for weekly frequency', async () => {
      const user = userEvent.setup();
      const { container } = render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const freqSelect = container.querySelector('select#habit-frequency') as HTMLSelectElement;
      await user.selectOptions(freqSelect, 'weekly');

      expect(screen.getByText('Number of times per week')).toBeInTheDocument();
    });

    it('should show helper text for monthly frequency', async () => {
      const user = userEvent.setup();
      const { container } = render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const freqSelect = container.querySelector('select#habit-frequency') as HTMLSelectElement;
      await user.selectOptions(freqSelect, 'monthly');

      expect(screen.getByText('Number of times per month')).toBeInTheDocument();
    });
  });

  describe('Category Options', () => {
    it('should show all category options', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('🧘 Health')).toBeInTheDocument();
      expect(screen.getByText('💪 Fitness')).toBeInTheDocument();
      expect(screen.getByText('📚 Learning')).toBeInTheDocument();
      expect(screen.getByText('✍️ Personal')).toBeInTheDocument();
      expect(screen.getByText('💼 Productivity')).toBeInTheDocument();
      expect(screen.getByText('🤝 Social')).toBeInTheDocument();
      expect(screen.getByText('📌 Other')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate empty name', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Habit name is required');
      });

      alertSpy.mockRestore();
    });

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      await user.type(nameInput, '   ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Habit name is required');
      });

      alertSpy.mockRestore();
    });

    it('should allow empty description', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      await user.type(nameInput, 'Exercise');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should not show validation error for missing description
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data', async () => {
      const user = userEvent.setup();

      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      await user.type(nameInput, 'Morning Meditation');

      const descTextarea = screen.getByPlaceholderText('Add more details about this habit...');
      await user.type(descTextarea, '10 minutes daily');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Morning Meditation',
          description: '10 minutes daily',
          frequency: 'daily',
          targetValue: '1',
          category: 'Health',
          color: '#D4A574',
        });
      });
    });

    it('should trim whitespace from fields', async () => {
      const user = userEvent.setup();

      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      await user.type(nameInput, '  Exercise  ');

      const descTextarea = screen.getByPlaceholderText('Add more details about this habit...');
      await user.type(descTextarea, '  Details  ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Exercise',
            description: 'Details',
          })
        );
      });
    });

    it('should include all selected values', async () => {
      const user = userEvent.setup();
      const { container } = render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      await user.type(nameInput, 'Workout');

      const freqSelect = container.querySelector('select#habit-frequency') as HTMLSelectElement;
      await user.selectOptions(freqSelect, 'weekly');

      const targetInput = screen.getByLabelText('Target (optional)') as HTMLInputElement;
      await user.clear(targetInput);
      await user.type(targetInput, '3');

      const catSelect = container.querySelector('select#habit-category') as HTMLSelectElement;
      await user.selectOptions(catSelect, 'Fitness');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Workout',
          description: '',
          frequency: 'weekly',
          targetValue: '3',
          category: 'Fitness',
          color: '#D4A574',
        });
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should disable submit button when pending', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isPending={true} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Target Input', () => {
    it('should accept numeric input only', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const targetInput = screen.getByLabelText('Target (optional)');
      expect(targetInput).toHaveAttribute('type', 'number');
    });

    it('should have minimum value of 1', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const targetInput = screen.getByLabelText('Target (optional)');
      expect(targetInput).toHaveAttribute('min', '1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Habit Name')).toHaveAttribute('id', 'habit-name');
      expect(screen.getByLabelText('Description (optional)')).toHaveAttribute('id', 'habit-description');
      expect(screen.getByLabelText('Frequency')).toHaveAttribute('id', 'habit-frequency');
      expect(screen.getByLabelText('Target (optional)')).toHaveAttribute('id', 'habit-target');
      expect(screen.getByLabelText('Category')).toHaveAttribute('id', 'habit-category');
    });

    it('should mark optional fields clearly', () => {
      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Description (optional)')).toBeInTheDocument();
      expect(screen.getByText('Target (optional)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long habit name', async () => {
      const user = userEvent.setup();

      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const longName = 'A'.repeat(200);
      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      await user.type(nameInput, longName);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: longName,
          })
        );
      });
    });

    it('should handle special characters in name', async () => {
      const user = userEvent.setup();

      render(<HabitFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const specialName = 'Habit <>&"\'';
      const nameInput = screen.getByPlaceholderText('Exercise, Read, Meditate...');
      await user.type(nameInput, specialName);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: specialName,
          })
        );
      });
    });
  });
});
