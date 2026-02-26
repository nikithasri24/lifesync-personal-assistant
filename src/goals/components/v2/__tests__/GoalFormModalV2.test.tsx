/**
 * Unit tests for GoalFormModalV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalFormModalV2 } from '../GoalFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, onClose, title, children, validate, onSubmit, initialData, defaultData, isPending }: any) => {
    if (!isOpen) return null;

    const initialFormState = initialData || defaultData || {
      title: '',
      description: '',
      category: 'personal',
      priority: 'medium',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      isShared: false,
      trackingMode: 'combined',
    };

    const [formState, setFormState] = React.useState(initialFormState);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;
      const titleInput = form.querySelector('input[placeholder="Run a marathon"]') as HTMLInputElement;
      const descriptionTextarea = form.querySelector('textarea') as HTMLTextAreaElement;
      const targetDateInput = form.querySelector('input[type="date"]') as HTMLInputElement;
      const isSharedCheckbox = form.querySelector('input[type="checkbox"]') as HTMLInputElement;

      const currentFormState = {
        ...formState,
        title: titleInput?.value || '',
        description: descriptionTextarea?.value || '',
        targetDate: targetDateInput?.value || formState.targetDate,
        isShared: isSharedCheckbox?.checked || false,
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

describe('GoalFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create mode by default', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Create Goal')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Goal Title *')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Target Date')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { container } = render(<GoalFormModalV2 isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Edit Mode', () => {
    const existingGoal = {
      title: 'Run Marathon',
      description: 'Complete a full marathon',
      category: 'fitness' as const,
      priority: 'high' as const,
      targetDate: '2025-12-31',
      isShared: false,
      trackingMode: 'combined' as const,
    };

    it('should render edit mode when isEditing is true', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingGoal}
          isEditing={true}
        />
      );

      expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    });

    it('should pre-fill form with existing data', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingGoal}
          isEditing={true}
        />
      );

      expect(screen.getByDisplayValue('Run Marathon')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Complete a full marathon')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-12-31')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should render all category options', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('🌟')).toBeInTheDocument(); // Personal
      expect(screen.getByText('💪')).toBeInTheDocument(); // Health
      expect(screen.getByText('💼')).toBeInTheDocument(); // Career
      expect(screen.getByText('💰')).toBeInTheDocument(); // Financial
      expect(screen.getByText('🏃')).toBeInTheDocument(); // Fitness
    });

    it('should select category on button click', async () => {
      const user = userEvent.setup();
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const careerButton = screen.getByRole('button', { name: /💼 Career/i });
      await user.click(careerButton);

      // Button should have terracotta border when selected
      expect(careerButton).toHaveClass('border-terracotta-400');
    });

    it('should default to personal category', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const personalButton = screen.getByRole('button', { name: /🌟 Personal/i });
      expect(personalButton).toHaveClass('border-terracotta-400');
    });

    it('should change category selection', async () => {
      const user = userEvent.setup();
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const fitnessButton = screen.getByRole('button', { name: /🏃 Fitness/i });
      await user.click(fitnessButton);

      expect(fitnessButton).toHaveClass('border-terracotta-400');
    });
  });

  describe('Priority Selection', () => {
    it('should render all priority options', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('should select priority on button click', async () => {
      const user = userEvent.setup();
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const highButton = screen.getByRole('button', { name: /High/i });
      await user.click(highButton);

      expect(highButton).toHaveClass('border-terracotta-400');
    });

    it('should default to medium priority', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const mediumButton = screen.getByRole('button', { name: /Medium/i });
      expect(mediumButton).toHaveClass('border-terracotta-400');
    });

    it('should show priority color indicators', () => {
      const { container } = render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // Check for color indicator dots
      const colorDots = container.querySelectorAll('.w-3.h-3.rounded-full');
      expect(colorDots.length).toBe(4); // 4 priority options
    });
  });

  describe('Form Fields', () => {
    it('should update title field on input', async () => {
      const user = userEvent.setup();
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon') as HTMLInputElement;
      await user.type(titleInput, 'Learn Spanish');

      expect(titleInput.value).toBe('Learn Spanish');
    });

    it('should update description field on input', async () => {
      const user = userEvent.setup();
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descriptionTextarea = screen.getByPlaceholderText(/Complete a full marathon/i) as HTMLTextAreaElement;
      await user.type(descriptionTextarea, 'Become fluent in Spanish');

      expect(descriptionTextarea.value).toBe('Become fluent in Spanish');
    });

    it('should update target date field', async () => {
      const user = userEvent.setup();
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const dateInput = screen.getByLabelText('Target Date') as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, '2026-06-15');

      expect(dateInput.value).toBe('2026-06-15');
    });

    it('should mark title as required', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      expect(titleInput).toHaveAttribute('required');
    });

    it('should not mark description as required', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descriptionTextarea = screen.getByPlaceholderText(/Complete a full marathon/i);
      expect(descriptionTextarea).not.toHaveAttribute('required');
    });

    it('should have correct textarea rows', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descriptionTextarea = screen.getByPlaceholderText(/Complete a full marathon/i);
      expect(descriptionTextarea).toHaveAttribute('rows', '3');
    });
  });

  describe('Form Validation', () => {
    it('should validate empty title', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please enter a goal title');
      });

      alertSpy.mockRestore();
    });

    it('should allow empty description', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, 'New Goal');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should trim whitespace from title', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, '   ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please enter a goal title');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, 'Learn Piano');

      const descriptionTextarea = screen.getByPlaceholderText(/Complete a full marathon/i);
      await user.type(descriptionTextarea, 'Master piano playing');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Learn Piano',
            description: 'Master piano playing',
            category: 'personal',
            priority: 'medium',
          })
        );
      });
    });

    it('should trim whitespace from fields', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, '  My Goal  ');

      const descriptionTextarea = screen.getByPlaceholderText(/Complete a full marathon/i);
      await user.type(descriptionTextarea, '  Description  ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'My Goal',
            description: 'Description',
          })
        );
      });
    });

    it('should submit with selected category', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, 'Save Money');

      const financialButton = screen.getByRole('button', { name: /💰 Financial/i });
      await user.click(financialButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'financial',
          })
        );
      });
    });

    it('should submit with selected priority', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, 'Critical Goal');

      const criticalButton = screen.getByRole('button', { name: /Critical/i });
      await user.click(criticalButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: 'critical',
          })
        );
      });
    });
  });

  describe('Merged Mode - Share with Partner', () => {
    it('should not show share checkbox by default', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.queryByText('Share with partner')).not.toBeInTheDocument();
    });

    it('should show share checkbox when merged mode available', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      expect(screen.getByText('Share with partner')).toBeInTheDocument();
    });

    it('should toggle share checkbox', async () => {
      const user = userEvent.setup();
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Share with partner/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('should not show tracking mode when not shared', () => {
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      expect(screen.queryByText('Tracking Mode')).not.toBeInTheDocument();
    });

    it('should show tracking mode when shared', async () => {
      const user = userEvent.setup();
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Share with partner/i });
      await user.click(checkbox);

      expect(screen.getByText('Tracking Mode')).toBeInTheDocument();
      expect(screen.getByText('Combined progress')).toBeInTheDocument();
      expect(screen.getByText('Individual progress')).toBeInTheDocument();
    });

    it('should default to combined tracking mode', async () => {
      const user = userEvent.setup();
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Share with partner/i });
      await user.click(checkbox);

      const combinedRadio = screen.getByRole('radio', { name: /Combined progress/i }) as HTMLInputElement;
      expect(combinedRadio.checked).toBe(true);
    });

    it('should switch tracking mode', async () => {
      const user = userEvent.setup();
      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Share with partner/i });
      await user.click(checkbox);

      const individualRadio = screen.getByRole('radio', { name: /Individual progress/i });
      await user.click(individualRadio);

      expect((individualRadio as HTMLInputElement).checked).toBe(true);
    });

    it('should submit with isShared=false when merged mode not available', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, 'My Goal');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            isShared: false,
          })
        );
      });
    });

    it('should submit with tracking mode when shared', async () => {
      const user = userEvent.setup();

      render(
        <GoalFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, 'Shared Goal');

      const checkbox = screen.getByRole('checkbox', { name: /Share with partner/i });
      await user.click(checkbox);

      const individualRadio = screen.getByRole('radio', { name: /Individual progress/i });
      await user.click(individualRadio);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            isShared: true,
            trackingMode: 'individual',
          })
        );
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should disable submit button when pending', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isPending={true} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const longTitle = 'A'.repeat(200);
      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, longTitle);

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

    it('should handle special characters in title', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const specialTitle = 'Goal <>&"\'';
      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, specialTitle);

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

    it('should handle future target dates', async () => {
      const user = userEvent.setup();

      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Run a marathon');
      await user.type(titleInput, 'Future Goal');

      const dateInput = screen.getByLabelText('Target Date') as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, '2030-01-01');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            targetDate: '2030-01-01',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Goal Title *')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Target Date')).toBeInTheDocument();
    });

    it('should have proper input IDs', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Goal Title *')).toHaveAttribute('id', 'goal-title');
      expect(screen.getByLabelText('Description')).toHaveAttribute('id', 'goal-description');
      expect(screen.getByLabelText('Target Date')).toHaveAttribute('id', 'goal-target-date');
    });

    it('should mark title as required visually', () => {
      render(<GoalFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleLabel = screen.getByText('Goal Title *');
      expect(titleLabel).toBeInTheDocument();
    });
  });
});
