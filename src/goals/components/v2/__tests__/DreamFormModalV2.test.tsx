/**
 * Unit tests for DreamFormModalV2 component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DreamFormModalV2 } from '../DreamFormModalV2';

// Mock FormModalV2
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ isOpen, onClose, title, children, validate, onSubmit, initialData, defaultData, isPending }: any) => {
    if (!isOpen) return null;

    const initialFormState = initialData || defaultData || {
      title: '',
      description: '',
      category: 'travel',
      estimatedCost: '',
      estimatedTimeframe: '',
      isShared: false,
      trackingMode: 'combined',
    };

    const [formState, setFormState] = React.useState(initialFormState);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;
      const titleInput = form.querySelector('input[placeholder="Visit Paris & See the Eiffel Tower"]') as HTMLInputElement;
      const descriptionTextarea = form.querySelector('textarea') as HTMLTextAreaElement;
      const costInput = form.querySelector('input[placeholder="$5,000"]') as HTMLInputElement;
      const timeframeInput = form.querySelector('input[placeholder="2027 or 2-3 years"]') as HTMLInputElement;
      const isSharedCheckbox = form.querySelector('input[type="checkbox"]') as HTMLInputElement;

      const currentFormState = {
        ...formState,
        title: titleInput?.value || '',
        description: descriptionTextarea?.value || '',
        estimatedCost: costInput?.value || '',
        estimatedTimeframe: timeframeInput?.value || '',
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

describe('DreamFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create mode by default', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Create Dream')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Dream Title *')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Estimated Cost')).toBeInTheDocument();
      expect(screen.getByText('Estimated Timeframe')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { container } = render(<DreamFormModalV2 isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Edit Mode', () => {
    const existingDream = {
      title: 'Visit Japan',
      description: 'Experience cherry blossoms in Tokyo',
      category: 'travel' as const,
      estimatedCost: '$8,000',
      estimatedTimeframe: '2026',
      isShared: false,
      trackingMode: 'combined' as const,
    };

    it('should render edit mode when isEditing is true', () => {
      render(
        <DreamFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingDream}
          isEditing={true}
        />
      );

      expect(screen.getByText('Edit Dream')).toBeInTheDocument();
    });

    it('should pre-fill form with existing data', () => {
      render(
        <DreamFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          initialData={existingDream}
          isEditing={true}
        />
      );

      expect(screen.getByDisplayValue('Visit Japan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Experience cherry blossoms in Tokyo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('$8,000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2026')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should render all category options', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('✈️')).toBeInTheDocument(); // Travel
      expect(screen.getByText('🎢')).toBeInTheDocument(); // Experiences
      expect(screen.getByText('🛍️')).toBeInTheDocument(); // Possessions
      expect(screen.getByText('🎯')).toBeInTheDocument(); // Achievements
      expect(screen.getByText('💕')).toBeInTheDocument(); // Relationships
      expect(screen.getByText('🏡')).toBeInTheDocument(); // Lifestyle
    });

    it('should select category on button click', async () => {
      const user = userEvent.setup();
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const experiencesButton = screen.getByRole('button', { name: /🎢 Experiences/i });
      await user.click(experiencesButton);

      expect(experiencesButton).toHaveClass('border-terracotta-400');
    });

    it('should default to travel category', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const travelButton = screen.getByRole('button', { name: /✈️ Travel/i });
      expect(travelButton).toHaveClass('border-terracotta-400');
    });

    it('should change category selection', async () => {
      const user = userEvent.setup();
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const lifestyleButton = screen.getByRole('button', { name: /🏡 Lifestyle/i });
      await user.click(lifestyleButton);

      expect(lifestyleButton).toHaveClass('border-terracotta-400');
    });

    it('should render all 6 category options', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const categoryButtons = screen.getAllByRole('button').filter(
        (button) => button.textContent?.includes('Travel') ||
                    button.textContent?.includes('Experiences') ||
                    button.textContent?.includes('Possessions') ||
                    button.textContent?.includes('Achievements') ||
                    button.textContent?.includes('Relationships') ||
                    button.textContent?.includes('Lifestyle')
      );
      expect(categoryButtons).toHaveLength(6);
    });
  });

  describe('Form Fields', () => {
    it('should update title field on input', async () => {
      const user = userEvent.setup();
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower') as HTMLInputElement;
      await user.type(titleInput, 'Climb Mount Everest');

      expect(titleInput.value).toBe('Climb Mount Everest');
    });

    it('should update description field on input', async () => {
      const user = userEvent.setup();
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descriptionTextarea = screen.getByPlaceholderText(/Experience the city of lights/i) as HTMLTextAreaElement;
      await user.type(descriptionTextarea, 'Reach the summit');

      expect(descriptionTextarea.value).toBe('Reach the summit');
    });

    it('should update estimated cost field', async () => {
      const user = userEvent.setup();
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const costInput = screen.getByPlaceholderText('$5,000') as HTMLInputElement;
      await user.type(costInput, '$10,000');

      expect(costInput.value).toBe('$10,000');
    });

    it('should update estimated timeframe field', async () => {
      const user = userEvent.setup();
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const timeframeInput = screen.getByPlaceholderText('2027 or 2-3 years') as HTMLInputElement;
      await user.type(timeframeInput, '5 years');

      expect(timeframeInput.value).toBe('5 years');
    });

    it('should mark title as required', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      expect(titleInput).toHaveAttribute('required');
    });

    it('should not mark description as required', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descriptionTextarea = screen.getByPlaceholderText(/Experience the city of lights/i);
      expect(descriptionTextarea).not.toHaveAttribute('required');
    });

    it('should not mark cost as required', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const costInput = screen.getByPlaceholderText('$5,000');
      expect(costInput).not.toHaveAttribute('required');
    });

    it('should not mark timeframe as required', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const timeframeInput = screen.getByPlaceholderText('2027 or 2-3 years');
      expect(timeframeInput).not.toHaveAttribute('required');
    });

    it('should have correct textarea rows', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descriptionTextarea = screen.getByPlaceholderText(/Experience the city of lights/i);
      expect(descriptionTextarea).toHaveAttribute('rows', '3');
    });
  });

  describe('Form Validation', () => {
    it('should validate empty title', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please enter a dream title');
      });

      alertSpy.mockRestore();
    });

    it('should allow empty description', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'New Dream');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should allow empty cost', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'Free Dream');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should allow empty timeframe', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'Someday Dream');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should trim whitespace from title', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, '   ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please enter a dream title');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data', async () => {
      const user = userEvent.setup();

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'Learn to Fly');

      const descriptionTextarea = screen.getByPlaceholderText(/Experience the city of lights/i);
      await user.type(descriptionTextarea, 'Get pilot license');

      const costInput = screen.getByPlaceholderText('$5,000');
      await user.type(costInput, '$15,000');

      const timeframeInput = screen.getByPlaceholderText('2027 or 2-3 years');
      await user.type(timeframeInput, '3 years');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Learn to Fly',
            description: 'Get pilot license',
            category: 'travel',
            estimatedCost: '$15,000',
            estimatedTimeframe: '3 years',
          })
        );
      });
    });

    it('should trim whitespace from fields', async () => {
      const user = userEvent.setup();

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, '  My Dream  ');

      const descriptionTextarea = screen.getByPlaceholderText(/Experience the city of lights/i);
      await user.type(descriptionTextarea, '  Description  ');

      const costInput = screen.getByPlaceholderText('$5,000');
      await user.type(costInput, '  $1,000  ');

      const timeframeInput = screen.getByPlaceholderText('2027 or 2-3 years');
      await user.type(timeframeInput, '  2025  ');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'My Dream',
            description: 'Description',
            estimatedCost: '$1,000',
            estimatedTimeframe: '2025',
          })
        );
      });
    });

    it('should submit with selected category', async () => {
      const user = userEvent.setup();

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'Buy Dream Car');

      const possessionsButton = screen.getByRole('button', { name: /🛍️ Possessions/i });
      await user.click(possessionsButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'possessions',
          })
        );
      });
    });
  });

  describe('Merged Mode - Share with Partner', () => {
    it('should not show share checkbox by default', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.queryByText('Share with partner')).not.toBeInTheDocument();
    });

    it('should show share checkbox when merged mode available', () => {
      render(
        <DreamFormModalV2
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
        <DreamFormModalV2
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
        <DreamFormModalV2
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
        <DreamFormModalV2
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
        <DreamFormModalV2
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
        <DreamFormModalV2
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

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'My Dream');

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
        <DreamFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isMergedModeAvailable={true}
        />
      );

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'Shared Dream');

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
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should disable submit button when pending', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isPending={true} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const user = userEvent.setup();

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const longTitle = 'A'.repeat(200);
      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
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

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const specialTitle = 'Dream <>&"\'';
      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
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

    it('should handle cost with currency symbols', async () => {
      const user = userEvent.setup();

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'Expensive Dream');

      const costInput = screen.getByPlaceholderText('$5,000');
      await user.type(costInput, '€25,000');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            estimatedCost: '€25,000',
          })
        );
      });
    });

    it('should handle relative timeframes', async () => {
      const user = userEvent.setup();

      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('Visit Paris & See the Eiffel Tower');
      await user.type(titleInput, 'Future Dream');

      const timeframeInput = screen.getByPlaceholderText('2027 or 2-3 years');
      await user.type(timeframeInput, 'Within 10 years');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            estimatedTimeframe: 'Within 10 years',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Dream Title *')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Estimated Cost')).toBeInTheDocument();
      expect(screen.getByText('Estimated Timeframe')).toBeInTheDocument();
    });

    it('should have proper input IDs', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Dream Title *')).toHaveAttribute('id', 'dream-title');
      expect(screen.getByLabelText('Description')).toHaveAttribute('id', 'dream-description');
      expect(screen.getByLabelText('Estimated Cost')).toHaveAttribute('id', 'dream-cost');
      expect(screen.getByLabelText('Estimated Timeframe')).toHaveAttribute('id', 'dream-timeframe');
    });

    it('should mark title as required visually', () => {
      render(<DreamFormModalV2 isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleLabel = screen.getByText('Dream Title *');
      expect(titleLabel).toBeInTheDocument();
    });
  });
});
