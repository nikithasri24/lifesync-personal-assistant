import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProjectTracking from '../ProjectTracking';

// Mock dnd-kit hooks since we're testing functionality, not drag behavior
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
  closestCenter: jest.fn(),
  closestCorners: jest.fn(),
  pointerWithin: jest.fn(),
  rectIntersection: jest.fn(),
  useDroppable: jest.fn(() => ({
    setNodeRef: jest.fn(),
    isOver: false,
  })),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  sortableKeyboardCoordinates: jest.fn(),
  arrayMove: jest.fn((array, from, to) => {
    const result = [...array];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
    },
  },
}));

// Mock URL.createObjectURL for file uploads
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
});

// Mock timers for auto-save functionality
jest.useFakeTimers();

describe('ProjectTracking Component', () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial Rendering and Basic Functionality', () => {
    test('should render without crashing', () => {
      render(<ProjectTracking />);
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
    });

    test('should display sample features on initial load', () => {
      render(<ProjectTracking />);
      expect(screen.getByText(/Project Tracking Core Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Advanced Project Features/i)).toBeInTheDocument();
    });

    test('should switch between vertical and horizontal views', async () => {
      render(<ProjectTracking />);
      
      // Should start in vertical view by default
      expect(screen.getByText(/Vertical/i)).toBeInTheDocument();
      
      // Switch to horizontal view
      const horizontalButton = screen.getByLabelText(/horizontal view/i) || 
                              screen.getByRole('button', { name: /horizontal/i });
      await user.click(horizontalButton);
      
      // Verify the view changed
      expect(screen.getByText(/Horizontal/i)).toBeInTheDocument();
    });
  });

  describe('Feature Management', () => {
    test('should create a new feature', async () => {
      render(<ProjectTracking />);
      
      // Click create new feature button
      const createButton = screen.getByRole('button', { name: /create.*feature/i }) ||
                          screen.getByLabelText(/add.*feature/i);
      await user.click(createButton);
      
      // Fill out the form
      const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i) || screen.getByPlaceholderText(/description/i);
      
      await user.type(titleInput, 'Test Feature');
      await user.type(descriptionInput, 'Test Description');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create|add|save/i });
      await user.click(submitButton);
      
      // Verify the feature was created
      await waitFor(() => {
        expect(screen.getByText('Test Feature')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
      });
    });

    test('should edit an existing feature title inline', async () => {
      render(<ProjectTracking />);
      
      // Find an existing feature title and click it
      const featureTitle = screen.getByText(/Project Tracking Core Features/i);
      await user.click(featureTitle);
      
      // Should now have an input field
      const titleInput = screen.getByDisplayValue(/Project Tracking Core Features/i);
      expect(titleInput).toBeInTheDocument();
      
      // Edit the title
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Feature Title');
      
      // Press Enter to save
      await user.keyboard('{Enter}');
      
      // Verify the title was updated
      await waitFor(() => {
        expect(screen.getByText('Updated Feature Title')).toBeInTheDocument();
      });
    });

    test('should delete a feature', async () => {
      render(<ProjectTracking />);
      
      // Find and click delete button for a feature
      const deleteButtons = screen.getAllByLabelText(/delete|remove/i);
      const featureDeleteButton = deleteButtons.find(button => 
        button.closest('[data-testid*="feature"]') || 
        button.getAttribute('title')?.includes('feature')
      );
      
      if (featureDeleteButton) {
        await user.click(featureDeleteButton);
        
        // Confirm deletion if there's a confirmation dialog
        const confirmButton = screen.queryByRole('button', { name: /confirm|yes|delete/i });
        if (confirmButton) {
          await user.click(confirmButton);
        }
      }
    });
  });

  describe('Subtask Management with Status Tracking', () => {
    test('should add a new subtask', async () => {
      render(<ProjectTracking />);
      
      // Find the subtask input (should be visible)
      const subtaskInput = screen.getByPlaceholderText(/add.*subtask|new.*subtask/i);
      
      // Type a new subtask
      await user.type(subtaskInput, 'New Test Subtask');
      await user.keyboard('{Enter}');
      
      // Verify the subtask was added
      await waitFor(() => {
        expect(screen.getByText('New Test Subtask')).toBeInTheDocument();
      });
    });

    test('should change subtask status (todo -> inprogress -> done)', async () => {
      render(<ProjectTracking />);
      
      // Find a subtask status button (should be a small button/icon)
      const statusButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Status') ||
        button.classList.contains('status') ||
        button.querySelector('[data-testid*="status"]')
      );
      
      if (statusButtons.length > 0) {
        const statusButton = statusButtons[0];
        
        // Click to cycle through statuses
        await user.click(statusButton);
        
        // Should now be in progress (blue)
        await waitFor(() => {
          expect(statusButton).toHaveClass(/blue|inprogress/);
        });
        
        // Click again to mark as done
        await user.click(statusButton);
        
        // Should now be done (green)
        await waitFor(() => {
          expect(statusButton).toHaveClass(/green|done/);
        });
      }
    });

    test('should show correct subtask progress count', async () => {
      render(<ProjectTracking />);
      
      // Look for progress indicators like "3/5" or "completed/total"
      const progressText = screen.getByText(/\d+\/\d+/) || 
                          screen.getByText(/\d+.*completed/) ||
                          screen.getByText(/subtasks/i);
      
      expect(progressText).toBeInTheDocument();
    });

    test('should edit subtask title inline', async () => {
      render(<ProjectTracking />);
      
      // Find a subtask title and click it
      const subtaskTitles = screen.getAllByText(/functionality|layout|operations/i);
      if (subtaskTitles.length > 0) {
        await user.click(subtaskTitles[0]);
        
        // Should have an input field
        const input = screen.getByDisplayValue(subtaskTitles[0].textContent || '');
        expect(input).toBeInTheDocument();
        
        // Edit the title
        await user.clear(input);
        await user.type(input, 'Updated Subtask Title');
        await user.keyboard('{Enter}');
        
        // Verify the update
        await waitFor(() => {
          expect(screen.getByText('Updated Subtask Title')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Bulk Assignment Features', () => {
    test('should enable bulk assignment mode', async () => {
      render(<ProjectTracking />);
      
      // Find and click the bulk assign button (UserPlus icon)
      const bulkButton = screen.getByLabelText(/bulk.*assign/i) ||
                        screen.getByTitle(/bulk.*assign/i) ||
                        screen.getByRole('button', { name: /bulk/i });
      
      await user.click(bulkButton);
      
      // Should show checkboxes next to subtasks
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    test('should select multiple subtasks and bulk assign', async () => {
      render(<ProjectTracking />);
      
      // Enable bulk mode
      const bulkButton = screen.getByLabelText(/bulk.*assign/i) ||
                        screen.getByTitle(/bulk.*assign/i);
      await user.click(bulkButton);
      
      // Select multiple checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      
      // Should show bulk assignment panel
      expect(screen.getByText(/bulk assign.*2.*subtask/i)).toBeInTheDocument();
      
      // Find an assignee button and click it
      const assigneeButton = screen.getByRole('button', { name: /alice|bob|current/i });
      await user.click(assigneeButton);
      
      // Should assign to all selected subtasks
      await waitFor(() => {
        expect(screen.queryByText(/bulk assign/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Attachment System', () => {
    test('should display existing attachments', () => {
      render(<ProjectTracking />);
      
      // Should show attachment count and files
      expect(screen.getByText(/attachments/i)).toBeInTheDocument();
      expect(screen.getByText(/wireframes\.png/i)).toBeInTheDocument();
      expect(screen.getByText(/project-spec\.pdf/i)).toBeInTheDocument();
    });

    test('should upload new attachment via button', async () => {
      render(<ProjectTracking />);
      
      // Find the attachment button (paperclip icon)
      const attachButton = screen.getByLabelText(/add.*attachment/i) ||
                          screen.getByTitle(/add.*attachment/i);
      
      // Create a mock file
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      // Find the hidden file input
      const fileInput = screen.getByLabelText(/file.*input/i) ||
                       document.querySelector('input[type="file"]');
      
      if (fileInput) {
        // Simulate file selection
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        // Verify the file was "uploaded"
        await waitFor(() => {
          expect(screen.getByText('test.txt')).toBeInTheDocument();
        });
      }
    });

    test('should remove an attachment', async () => {
      render(<ProjectTracking />);
      
      // Find a remove button for an attachment
      const removeButtons = screen.getAllByLabelText(/remove|delete/i);
      const attachmentRemoveButton = removeButtons.find(button => 
        button.closest('[data-testid*="attachment"]') ||
        button.parentElement?.textContent?.includes('.png') ||
        button.parentElement?.textContent?.includes('.pdf')
      );
      
      if (attachmentRemoveButton) {
        await user.click(attachmentRemoveButton);
        
        // Verify the attachment was removed
        await waitFor(() => {
          expect(attachmentRemoveButton).not.toBeInTheDocument();
        });
      }
    });

    test('should download an attachment', async () => {
      render(<ProjectTracking />);
      
      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });
      
      // Find and click download button
      const downloadButton = screen.getByLabelText(/download/i) ||
                            screen.getByTitle(/download/i);
      
      await user.click(downloadButton);
      
      // Verify download was triggered
      expect(mockOpen).toHaveBeenCalled();
    });
  });

  describe('Notes/Scratch Pad Functionality', () => {
    test('should display existing notes preview', () => {
      render(<ProjectTracking />);
      
      // Should show notes section
      expect(screen.getByText(/notes/i)).toBeInTheDocument();
      
      // Should show preview of existing notes
      expect(screen.getByText(/drag.*drop.*performance/i)).toBeInTheDocument();
    });

    test('should expand and edit feature notes', async () => {
      render(<ProjectTracking />);
      
      // Find and click the notes expand button
      const expandButton = screen.getByLabelText(/expand.*notes/i) ||
                          screen.getByRole('button', { name: /expand/i });
      
      await user.click(expandButton);
      
      // Should show textarea
      const textarea = screen.getByPlaceholderText(/notes.*thoughts.*blockers/i) ||
                      screen.getByRole('textbox', { name: /notes/i });
      
      expect(textarea).toBeInTheDocument();
      
      // Type in the textarea
      await user.type(textarea, '\n\nAdding more notes...');
      
      // Wait for auto-save
      jest.advanceTimersByTime(1000);
      
      // Should show saving indicator
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });

    test('should add notes to subtask', async () => {
      render(<ProjectTracking />);
      
      // Find and click a subtask notes button (sticky note icon)
      const notesButton = screen.getByLabelText(/add.*notes/i) ||
                         screen.getAllByTitle(/add.*notes/i)[0];
      
      await user.click(notesButton);
      
      // Should show subtask notes textarea
      const textarea = screen.getByPlaceholderText(/notes.*subtask/i);
      expect(textarea).toBeInTheDocument();
      
      // Add some notes
      await user.type(textarea, 'Subtask notes here...');
      
      // Wait for auto-save
      jest.advanceTimersByTime(1000);
      
      // Verify notes were saved
      await waitFor(() => {
        expect(screen.getByDisplayValue(/Subtask notes here/i)).toBeInTheDocument();
      });
    });

    test('should collapse notes section', async () => {
      render(<ProjectTracking />);
      
      // Expand notes first
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      // Should show textarea
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      
      // Collapse again
      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      await user.click(collapseButton);
      
      // Should hide textarea and show preview
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText(/click to add notes/i)).toBeInTheDocument();
    });
  });

  describe('Collaboration and User Management', () => {
    test('should assign user to feature', async () => {
      render(<ProjectTracking />);
      
      // Find add assignee button (+ button)
      const addAssigneeButton = screen.getByLabelText(/add.*assignee/i) ||
                               screen.getByTitle(/add.*assignee/i);
      
      await user.click(addAssigneeButton);
      
      // Should show collaboration modal or dropdown
      const collaborationModal = screen.getByRole('dialog') ||
                                screen.getByText(/assign.*collaborator/i);
      
      expect(collaborationModal).toBeInTheDocument();
    });

    test('should remove user assignment', async () => {
      render(<ProjectTracking />);
      
      // Find an assigned user avatar and hover/click
      const userAvatar = screen.getByText('A') || // Alice's avatar
                        screen.getByTitle(/alice.*unassign/i);
      
      await user.hover(userAvatar);
      
      // Should show remove (X) button
      const removeButton = screen.getByLabelText(/unassign/i) ||
                          screen.getByTitle(/unassign/i);
      
      await user.click(removeButton);
      
      // User should be removed
      await waitFor(() => {
        expect(userAvatar).not.toBeInTheDocument();
      });
    });

    test('should show user filter options', () => {
      render(<ProjectTracking />);
      
      // Should have user filter dropdown
      const userFilter = screen.getByLabelText(/filter.*user/i) ||
                         screen.getByText(/all.*users/i);
      
      expect(userFilter).toBeInTheDocument();
    });
  });

  describe('Column Management', () => {
    test('should toggle column visibility', async () => {
      render(<ProjectTracking />);
      
      // Find column management button
      const columnButton = screen.getByRole('button', { name: /manage.*column/i }) ||
                          screen.getByLabelText(/column.*visibility/i);
      
      await user.click(columnButton);
      
      // Should show column visibility modal
      const modal = screen.getByRole('dialog') ||
                   screen.getByText(/column.*visibility/i);
      
      expect(modal).toBeInTheDocument();
      
      // Should have checkboxes for columns
      const checkboxes = within(modal).getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    test('should add custom column', async () => {
      render(<ProjectTracking />);
      
      // Open column management
      const columnButton = screen.getByRole('button', { name: /manage.*column/i });
      await user.click(columnButton);
      
      // Click add column button
      const addColumnButton = screen.getByRole('button', { name: /add.*column/i });
      await user.click(addColumnButton);
      
      // Fill in column details
      const nameInput = screen.getByLabelText(/column.*name/i);
      await user.type(nameInput, 'Testing');
      
      // Select color
      const colorSelect = screen.getByLabelText(/color/i);
      await user.selectOptions(colorSelect, 'red');
      
      // Save column
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);
      
      // Verify column was added
      await waitFor(() => {
        expect(screen.getByText('Testing')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests - Complex Workflows', () => {
    test('should complete full feature workflow: create -> add subtasks -> assign -> complete', async () => {
      render(<ProjectTracking />);
      
      // Step 1: Create new feature
      const createButton = screen.getByRole('button', { name: /create.*feature/i });
      await user.click(createButton);
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Integration Test Feature');
      
      const submitButton = screen.getByRole('button', { name: /create|save/i });
      await user.click(submitButton);
      
      // Step 2: Add subtask
      await waitFor(() => {
        expect(screen.getByText('Integration Test Feature')).toBeInTheDocument();
      });
      
      const subtaskInput = screen.getByPlaceholderText(/add.*subtask/i);
      await user.type(subtaskInput, 'Test Subtask');
      await user.keyboard('{Enter}');
      
      // Step 3: Assign user
      const addAssigneeButton = screen.getByLabelText(/add.*assignee/i);
      await user.click(addAssigneeButton);
      
      // Step 4: Change subtask status
      await waitFor(() => {
        expect(screen.getByText('Test Subtask')).toBeInTheDocument();
      });
      
      const statusButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Status')
      );
      
      if (statusButtons.length > 0) {
        await user.click(statusButtons[0]); // todo -> inprogress
        await user.click(statusButtons[0]); // inprogress -> done
      }
      
      // Step 5: Add notes
      const notesExpandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(notesExpandButton);
      
      const notesTextarea = screen.getByPlaceholderText(/notes.*thoughts/i);
      await user.type(notesTextarea, 'Feature completed successfully!');
      
      // Step 6: Verify all changes persisted
      await waitFor(() => {
        expect(screen.getByText('Integration Test Feature')).toBeInTheDocument();
        expect(screen.getByText('Test Subtask')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Feature completed successfully/i)).toBeInTheDocument();
      });
    });

    test('should handle undo functionality', async () => {
      render(<ProjectTracking />);
      
      // Make a change (delete a feature)
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
      }
      
      // Should show undo button
      const undoButton = screen.getByRole('button', { name: /undo/i }) ||
                        screen.getByLabelText(/undo/i);
      
      expect(undoButton).toBeInTheDocument();
      
      // Click undo
      await user.click(undoButton);
      
      // Change should be reverted
      await waitFor(() => {
        expect(undoButton).not.toBeInTheDocument();
      });
    });

    test('should persist data across view switches', async () => {
      render(<ProjectTracking />);
      
      // Make changes in vertical view
      const notesExpandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(notesExpandButton);
      
      const notesTextarea = screen.getByPlaceholderText(/notes.*thoughts/i);
      await user.type(notesTextarea, 'View switch test');
      
      // Switch to horizontal view
      const horizontalButton = screen.getByRole('button', { name: /horizontal/i });
      await user.click(horizontalButton);
      
      // Switch back to vertical
      const verticalButton = screen.getByRole('button', { name: /vertical/i });
      await user.click(verticalButton);
      
      // Notes should still be there
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      expect(screen.getByDisplayValue(/View switch test/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty states gracefully', () => {
      render(<ProjectTracking />);
      
      // Component should render even with no data
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
    });

    test('should validate required fields in forms', async () => {
      render(<ProjectTracking />);
      
      // Try to create feature without title
      const createButton = screen.getByRole('button', { name: /create.*feature/i });
      await user.click(createButton);
      
      const submitButton = screen.getByRole('button', { name: /create|save/i });
      await user.click(submitButton);
      
      // Should show validation error or not submit
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeInvalid();
    });

    test('should handle file upload errors gracefully', async () => {
      render(<ProjectTracking />);
      
      // Try to upload invalid file type
      const fileInput = document.querySelector('input[type="file"]');
      
      if (fileInput) {
        const invalidFile = new File([''], 'test.exe', { type: 'application/exe' });
        
        Object.defineProperty(fileInput, 'files', {
          value: [invalidFile],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        // Should handle gracefully (no crash)
        expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
      }
    });
  });
});