/**
 * Unit tests for TripFormModalV2 component
 * Tests form rendering, status selection, validation, and submission
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripFormModalV2 } from '../TripFormModalV2';

// Mock dependencies
vi.mock('@/components/v2', () => ({
  FormModalV2: ({ children, isOpen, onClose, onSubmit, title, defaultData, initialData }: any) => {
    const [formState, setFormState] = React.useState(initialData || defaultData);

    React.useEffect(() => {
      const newState = initialData || defaultData || {};
      setFormState(newState);
    }, [initialData, defaultData]);

    if (!isOpen) return null;

    return (
      <div data-testid="form-modal">
        <h2>{title}</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            // Call the onSubmit prop which handles data transformation
            await onSubmit(formState);
          }}
        >
          {children(formState, setFormState)}
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    );
  },
}));

describe('TripFormModalV2', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <TripFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Create Trip" title when creating', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Create Trip')).toBeInTheDocument();
    });

    it('should show "Edit Trip" title when editing', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          isEditing={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Edit Trip')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render trip name input', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Trip Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Summer Europe Trip')).toBeInTheDocument();
    });

    it('should render description textarea', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Description (optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Trip details and highlights...')).toBeInTheDocument();
    });

    it('should render start and end date inputs', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
    });

    it('should render status buttons', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should render budget and currency inputs', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Budget (optional)')).toBeInTheDocument();
      expect(screen.getByText('Currency')).toBeInTheDocument();
    });

    it('should render tags input', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Tags (optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('backpacking, business, family')).toBeInTheDocument();
    });
  });

  describe('Currency Options', () => {
    it('should list all currency options', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('💵 USD')).toBeInTheDocument();
      expect(screen.getByText('💶 EUR')).toBeInTheDocument();
      expect(screen.getByText('💷 GBP')).toBeInTheDocument();
      expect(screen.getByText('💴 JPY')).toBeInTheDocument();
      expect(screen.getByText('🇦🇺 AUD')).toBeInTheDocument();
      expect(screen.getByText('🇨🇦 CAD')).toBeInTheDocument();
    });

    it('should default to USD currency', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByDisplayValue('💵 USD');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Status Selection', () => {
    it('should default to planning status', () => {
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Planning button should have selected styling
      const planningButton = screen.getByText('Planning');
      expect(planningButton.className).toContain('bg-terracotta-100');
    });

    it('should allow selecting different status', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Upcoming'));

      const upcomingButton = screen.getByText('Upcoming');
      expect(upcomingButton.className).toContain('bg-terracotta-100');
    });

    it('should handle status button clicks', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Completed'));

      const completedButton = screen.getByText('Completed');
      expect(completedButton.className).toContain('bg-terracotta-100');
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering trip name', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('e.g., Summer Europe Trip');
      await user.type(input, 'Japan Adventure');

      expect(input).toHaveValue('Japan Adventure');
    });

    it('should allow entering description', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText('Trip details and highlights...');
      await user.type(textarea, 'Cherry blossom season');

      expect(textarea).toHaveValue('Cherry blossom season');
    });

    it('should allow entering budget', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const budgetInput = screen.getByPlaceholderText('0');
      await user.type(budgetInput, '5000');

      expect(budgetInput).toHaveValue(5000);
    });

    it('should allow selecting currency', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByDisplayValue('💵 USD');
      await user.selectOptions(select, 'EUR');

      expect(select).toHaveValue('EUR');
    });

    it('should allow entering tags', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const tagsInput = screen.getByPlaceholderText('backpacking, business, family');
      await user.type(tagsInput, 'solo, adventure');

      expect(tagsInput).toHaveValue('solo, adventure');
    });
  });

  describe('Pre-filled Data', () => {
    it('should display pre-filled trip data', () => {
      const trip = {
        id: '1',
        name: 'Europe Trip',
        description: 'Visiting Paris and Rome',
        startDate: '2024-07-01',
        endDate: '2024-07-15',
        status: 'upcoming' as const,
        budget: 4000,
        currency: 'EUR',
        tags: ['cultural', 'photography'],
      };

      render(
        <TripFormModalV2
          isOpen={true}
          isEditing={true}
          trip={trip}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('Europe Trip')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Visiting Paris and Rome')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-07-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-07-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('💶 EUR')).toBeInTheDocument();
      expect(screen.getByDisplayValue('cultural, photography')).toBeInTheDocument();
    });

    it('should display pre-filled status', () => {
      const trip = {
        id: '1',
        name: 'Trip',
        startDate: '2024-07-01',
        endDate: '2024-07-15',
        status: 'in_progress' as const,
      };

      render(
        <TripFormModalV2
          isOpen={true}
          isEditing={true}
          trip={trip}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const inProgressButton = screen.getByText('In Progress');
      expect(inProgressButton.className).toContain('bg-terracotta-100');
    });

    it('should handle trip without optional fields', () => {
      const trip = {
        id: '1',
        name: 'Simple Trip',
        startDate: '2024-07-01',
        endDate: '2024-07-15',
        status: 'planning' as const,
      };

      render(
        <TripFormModalV2
          isOpen={true}
          isEditing={true}
          trip={trip}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('Simple Trip')).toBeInTheDocument();
      // Should not crash
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit with form data when submitted', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Summer Europe Trip');
      await user.type(nameInput, 'Beach Vacation');

      // Fill required dates
      const dateInputs = container.querySelectorAll('input[type="date"]');
      await user.type(dateInputs[0], '2024-07-01');
      await user.type(dateInputs[1], '2024-07-15');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should transform tags from string to array on submit', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Summer Europe Trip');
      await user.type(nameInput, 'Trip');

      // Fill required dates
      const dateInputs = container.querySelectorAll('input[type="date"]');
      await user.type(dateInputs[0], '2024-07-01');
      await user.type(dateInputs[1], '2024-07-15');

      const tagsInput = screen.getByPlaceholderText('backpacking, business, family');
      await user.type(tagsInput, 'beach, relax');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['beach', 'relax'],
          })
        );
      });
    });

    it('should filter empty tags on submit', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Summer Europe Trip');
      await user.type(nameInput, 'Trip');

      // Fill required dates
      const dateInputs = container.querySelectorAll('input[type="date"]');
      await user.type(dateInputs[0], '2024-07-01');
      await user.type(dateInputs[1], '2024-07-15');

      const tagsInput = screen.getByPlaceholderText('backpacking, business, family');
      await user.type(tagsInput, 'valid, , , another');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['valid', 'another'],
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty budget', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Summer Europe Trip');
      await user.type(nameInput, 'Trip');

      // Fill required dates
      const dateInputs = container.querySelectorAll('input[type="date"]');
      await user.type(dateInputs[0], '2024-07-01');
      await user.type(dateInputs[1], '2024-07-15');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            budget: undefined,
          })
        );
      });
    });

    it('should handle empty tags string', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Summer Europe Trip');
      await user.type(nameInput, 'Trip');

      // Fill required dates
      const dateInputs = container.querySelectorAll('input[type="date"]');
      await user.type(dateInputs[0], '2024-07-01');
      await user.type(dateInputs[1], '2024-07-15');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: [],
          })
        );
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TripFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText('e.g., Summer Europe Trip');
      await user.type(nameInput, '  Trimmed Trip  ');

      // Fill required dates
      const dateInputs = container.querySelectorAll('input[type="date"]');
      await user.type(dateInputs[0], '2024-07-01');
      await user.type(dateInputs[1], '2024-07-15');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Trimmed Trip',
          })
        );
      });
    });
  });
});
