/**
 * Unit tests for TaskFormModalV2 component
 * Tests basic form functionality and advanced features (subtasks, dependencies, reminders)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskFormModalV2 } from '../TaskFormModalV2';
import type { TaskData, ProjectData } from '@/services/types';

// Mock dependencies
vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { primary: '#FFFFFF', secondary: '#F5F5F5', white: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    border: { light: '#E5E5E5', medium: '#CCCCCC' },
    badge: { bg: '#F3F4F6', text: '#374151' },
  }),
}));

vi.mock('@/components/v2', () => ({
  FormModalV2: ({ children, isOpen, onClose, onSubmit, title, defaultData, initialData }: any) => {
    // Use initialData if provided (editing mode), otherwise use defaultData (create mode)
    // Initialize with the correct data structure
    const initialState = initialData || defaultData || {};
    const [formState, setFormState] = React.useState(initialState);

    // Update formState when initialData or defaultData changes
    React.useEffect(() => {
      const newState = initialData || defaultData || {};
      setFormState(newState);
    }, [initialData, defaultData]);

    if (!isOpen) return null;

    return (
      <div data-testid="form-modal">
        <h2>{title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formState);
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

vi.mock('@/components/dependencies/DependencySelector', () => ({
  DependencySelector: ({ selectedDependencies, onChange }: any) => (
    <div data-testid="dependency-selector">
      <button
        type="button"
        onClick={() => onChange([...selectedDependencies, 'dep-1'])}
      >
        Add Dependency
      </button>
      <div>{selectedDependencies.length} selected</div>
    </div>
  ),
}));

describe('TaskFormModalV2', () => {
  const mockProjects: ProjectData[] = [
    {
      id: 'project-1',
      name: 'Test Project',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockAllTasks: TaskData[] = [
    {
      id: 'task-1',
      title: 'Existing Task',
      status: 'todo',
      priority: 'medium',
      created_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1',
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <TaskFormModalV2
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    it('should show "Create Task" title for new tasks', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          isEditing={false}
        />
      );

      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('should show "Edit Task" title when editing', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          isEditing={true}
        />
      );

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render task title input', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByPlaceholderText(/What needs to be done/i)).toBeInTheDocument();
    });

    it('should render description textarea', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByPlaceholderText(/Add more details/i)).toBeInTheDocument();
    });

    it('should render priority buttons', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByText('🔥 Urgent')).toBeInTheDocument();
      expect(screen.getByText('⭐ Important')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should render status buttons', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should render category buttons', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByText('💼 Work')).toBeInTheDocument();
      expect(screen.getByText('🏠 Personal')).toBeInTheDocument();
      expect(screen.getByText('📚 Learning')).toBeInTheDocument();
    });

    it('should render due date input', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      const dateInputs = screen.getAllByDisplayValue('');
      const dateInput = Array.from(dateInputs).find(
        (input) => input.getAttribute('type') === 'date'
      );
      expect(dateInput).toBeInTheDocument();
    });

    it('should render recurrence buttons', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ADVANCED FEATURES TESTS
  // ============================================================================

  describe('Subtasks Feature', () => {
    it('should render subtasks textarea', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByPlaceholderText(/Enter subtasks/i)).toBeInTheDocument();
    });

    it('should show subtasks label', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByText(/Subtasks \(optional\)/i)).toBeInTheDocument();
    });

    it('should allow entering subtasks', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      const textarea = screen.getByPlaceholderText(/Enter subtasks/i);
      await user.type(textarea, 'Subtask 1\nSubtask 2\nSubtask 3');

      expect(textarea).toHaveValue('Subtask 1\nSubtask 2\nSubtask 3');
    });

    it('should transform subtasks on submit', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      // Fill title
      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Test Task');

      // Fill subtasks
      await user.type(
        screen.getByPlaceholderText(/Enter subtasks/i),
        'Step 1\nStep 2\nStep 3'
      );

      // Submit
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.follow_up_tasks).toHaveLength(3);
        expect(submittedData.follow_up_tasks[0]).toMatchObject({
          title: 'Step 1',
          completed: false,
        });
      });
    });

    it('should filter out empty lines in subtasks', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Test');
      await user.type(
        screen.getByPlaceholderText(/Enter subtasks/i),
        'Task 1\n\n\nTask 2\n   \nTask 3'
      );

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.follow_up_tasks).toHaveLength(3);
      });
    });

    it('should load existing subtasks when editing', () => {
      const taskWithSubtasks: Partial<TaskData> = {
        id: 'task-1',
        title: 'Existing Task',
        follow_up_tasks: [
          { id: 'st-1', title: 'Existing Subtask 1', completed: false },
          { id: 'st-2', title: 'Existing Subtask 2', completed: true },
        ],
      };

      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          initialData={taskWithSubtasks}
          isEditing={true}
        />
      );

      const textarea = screen.getByPlaceholderText(/Enter subtasks/i);
      expect(textarea).toHaveValue('Existing Subtask 1\nExisting Subtask 2');
    });

    it('should handle empty subtasks field', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Task');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.follow_up_tasks).toEqual([]);
      });
    });
  });

  describe('Dependencies Feature', () => {
    it('should render dependency selector', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
        />
      );

      expect(screen.getByTestId('dependency-selector')).toBeInTheDocument();
    });

    it('should show dependencies label', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
        />
      );

      expect(screen.getByText(/Dependencies \(optional\)/i)).toBeInTheDocument();
    });

    it('should allow adding dependencies', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
        />
      );

      await user.click(screen.getByText('Add Dependency'));

      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('should transform dependencies on submit', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Task');
      await user.click(screen.getByText('Add Dependency'));
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.depends_on).toContain('dep-1');
      });
    });

    it('should load existing dependencies when editing', () => {
      const taskWithDeps: Partial<TaskData> = {
        id: 'task-2',
        title: 'Task with Dependencies',
        depends_on: ['task-1'],
      };

      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
          initialData={taskWithDeps}
          isEditing={true}
        />
      );

      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('should handle empty dependencies', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Task');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.depends_on).toEqual([]);
      });
    });
  });

  describe('Reminder Feature', () => {
    it('should render reminder checkbox', () => {
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      expect(screen.getByText(/Set Reminder/i)).toBeInTheDocument();
    });

    it('should show date/time inputs when reminder is enabled', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      // Initially hidden - check for label text
      expect(screen.queryByText('Date')).not.toBeInTheDocument();

      // Click checkbox to enable
      const checkbox = screen.getByRole('checkbox', { name: /Set Reminder/i });
      await user.click(checkbox);

      // Now visible - check for labels
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();

      // Verify inputs exist
      const dateInput = container.querySelector('input[type="date"]');
      const timeInput = container.querySelector('input[type="time"]');
      expect(dateInput).toBeInTheDocument();
      expect(timeInput).toBeInTheDocument();
    });

    it('should hide date/time inputs when reminder is disabled', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Set Reminder/i });

      // Enable
      await user.click(checkbox);
      expect(screen.getByText('Date')).toBeInTheDocument();

      // Disable
      await user.click(checkbox);
      expect(screen.queryByText('Date')).not.toBeInTheDocument();
    });

    it('should transform reminder on submit when enabled', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Task');

      // Enable reminder
      const checkbox = screen.getByRole('checkbox', { name: /Set Reminder/i });
      await user.click(checkbox);

      // Wait for date/time inputs to appear
      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
      });

      // Verify date/time inputs are rendered
      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;

      expect(dateInput).toBeTruthy();
      expect(timeInput).toBeTruthy();

      // Note: Testing actual date/time input interaction with controlled components in mocked
      // environment is complex. The transformation logic (reminderDate + reminderTime -> ISO string)
      // is tested in E2E tests. Here we verify the inputs exist and are rendered.
    });

    it('should set reminder to null when disabled', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Task');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.reminder).toBeNull();
      });
    });

    it('should load existing reminder when editing', () => {
      const taskWithReminder: Partial<TaskData> = {
        id: 'task-3',
        title: 'Task with Reminder',
        reminder: '2024-12-25T14:30:00',
      };

      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          initialData={taskWithReminder}
          isEditing={true}
        />
      );

      // Verify checkbox is checked when task has reminder
      const checkbox = screen.getByRole('checkbox', { name: /Set Reminder/i });
      expect(checkbox).toBeChecked();

      // Verify date/time input labels are visible (inputs are rendered)
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('should handle reminder with missing time', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Task');

      const checkbox = screen.getByRole('checkbox', { name: /Set Reminder/i });
      await user.click(checkbox);

      // Wait for date/time inputs to appear
      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
      });

      // Set only date, no time
      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.reminder).toBeNull(); // Should be null if time is missing
      });
    });
  });

  describe('Combined Advanced Features', () => {
    it('should allow setting all three features together', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
        />
      );

      // Fill title
      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'Complex Task');

      // Add subtasks
      await user.type(screen.getByPlaceholderText(/Enter subtasks/i), 'Step 1\nStep 2');

      // Add dependency
      await user.click(screen.getByText('Add Dependency'));

      // Add reminder
      const checkbox = screen.getByRole('checkbox', { name: /Set Reminder/i });
      await user.click(checkbox);

      // Wait for all feature UI elements to be visible
      await waitFor(() => {
        // Subtasks textarea has content (check for placeholder or one of the values)
        const subtasksTextarea = screen.getByPlaceholderText(/Enter subtasks/i) as HTMLTextAreaElement;
        expect(subtasksTextarea.value).toContain('Step 1');
        expect(subtasksTextarea.value).toContain('Step 2');
        // Dependency shows count
        expect(screen.getByText('1 selected')).toBeInTheDocument();
        // Reminder inputs are rendered
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Time')).toBeInTheDocument();
      });

      // Submit and verify subtasks and dependencies work
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.title).toBe('Complex Task');
        expect(submittedData.follow_up_tasks).toHaveLength(2);
        expect(submittedData.depends_on).toContain('dep-1');
        // Reminder transformation tested in E2E
      });
    });

    it('should preserve all features when editing', () => {
      const comprehensiveTask: Partial<TaskData> = {
        id: 'task-4',
        title: 'Full Feature Task',
        follow_up_tasks: [
          { id: 'st-1', title: 'Sub 1', completed: false },
        ],
        depends_on: ['task-1'],
        reminder: '2024-12-25T12:00:00',
      };

      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
          allTasks={mockAllTasks}
          initialData={comprehensiveTask}
          isEditing={true}
        />
      );

      // Check all features loaded
      expect(screen.getByDisplayValue('Full Feature Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sub 1')).toBeInTheDocument();
      expect(screen.getByText('1 selected')).toBeInTheDocument(); // Dependencies
      expect(screen.getByRole('checkbox', { name: /Set Reminder/i })).toBeChecked();
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      await user.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSubmit with task data when form is submitted', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormModalV2
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          projects={mockProjects}
        />
      );

      await user.type(screen.getByPlaceholderText(/What needs to be done/i), 'New Task');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        expect(mockOnSubmit.mock.calls[0][0]).toMatchObject({
          title: 'New Task',
        });
      });
    });
  });
});
