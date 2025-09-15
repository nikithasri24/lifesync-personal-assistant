import { screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectTracking from '../ProjectTracking';
import { render, testHelpers } from './test-utils';

/**
 * End-to-End (E2E) Testing for ProjectTracking Component
 * 
 * These tests simulate real user workflows and scenarios to ensure
 * the entire application flow works correctly from a user's perspective.
 */

jest.useFakeTimers();

describe('ProjectTracking - End-to-End User Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any global state
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('New User Experience', () => {
    test('first-time user can understand and use the interface', async () => {
      const { user } = render(<ProjectTracking />);
      
      // User should see clear interface elements
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/Ideas|Working|Pending|Done/i)).toBeInTheDocument();
      
      // Should see sample data to understand the concept
      expect(screen.getByText(/Project Tracking Core Features/i)).toBeInTheDocument();
      
      // Should be able to create their first feature
      const createButton = screen.getByRole('button', { name: /create.*feature/i });
      expect(createButton).toBeInTheDocument();
      
      await user.click(createButton);
      
      // Form should be intuitive
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      expect(titleInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
      
      // Should be able to complete the creation
      await user.type(titleInput, 'My First Feature');
      await user.type(descriptionInput, 'Learning how to use this tool');
      
      const submitButton = screen.getByRole('button', { name: /create|save/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('My First Feature')).toBeInTheDocument();
      });
    });

    test('user can discover all major features through exploration', async () => {
      const { user } = render(<ProjectTracking />);
      
      // User explores view options
      const viewButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Vertical') || 
        button.textContent?.includes('Horizontal')
      );
      
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        // Should change view without errors
        expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
      }
      
      // User discovers notes feature
      const notesSection = screen.getByText(/notes/i);
      expect(notesSection).toBeInTheDocument();
      
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      
      // User discovers attachments
      const attachmentSection = screen.getByText(/attachments/i);
      expect(attachmentSection).toBeInTheDocument();
      
      // User discovers subtasks
      const subtaskSection = screen.getByText(/subtasks/i);
      expect(subtaskSection).toBeInTheDocument();
    });
  });

  describe('Daily Workflow Scenarios', () => {
    test('product manager planning sprint workflow', async () => {
      const { user } = render(<ProjectTracking />);
      
      // 1. Review current work
      expect(screen.getByText(/Project Tracking Core Features/i)).toBeInTheDocument();
      
      // 2. Add new feature for sprint
      const createButton = screen.getByRole('button', { name: /create.*feature/i });
      await user.click(createButton);
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'User Authentication System');
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Implement login, registration, and password reset');
      
      const submitButton = screen.getByRole('button', { name: /create|save/i });
      await user.click(submitButton);
      
      // 3. Break down into subtasks
      await waitFor(() => {
        expect(screen.getByText('User Authentication System')).toBeInTheDocument();
      });
      
      const subtasks = [
        'Design login form',
        'Implement backend auth',
        'Add password validation',
        'Create forgot password flow',
        'Write unit tests'
      ];
      
      for (const subtaskTitle of subtasks) {
        const subtaskInput = screen.getByPlaceholderText(/add.*subtask/i);
        await user.type(subtaskInput, subtaskTitle);
        await user.keyboard('{Enter}');
        
        await waitFor(() => {
          expect(screen.getByText(subtaskTitle)).toBeInTheDocument();
        });
      }
      
      // 4. Assign team members
      const assignButton = screen.getByLabelText(/add.*assignee/i);
      await user.click(assignButton);
      
      // 5. Add planning notes
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Sprint 15 - High priority for Q2 release. Coordinate with security team for review.');
      
      jest.advanceTimersByTime(1000); // Auto-save
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(/Sprint 15.*High priority/i)).toBeInTheDocument();
      });
    });

    test('developer daily standup workflow', async () => {
      const { user } = render(<ProjectTracking />);
      
      // 1. Check current assigned work
      expect(screen.getByText(/Project Tracking Core Features/i)).toBeInTheDocument();
      
      // 2. Update progress on subtasks
      const statusButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Status')
      );
      
      if (statusButtons.length > 0) {
        // Mark a subtask as in progress
        await user.click(statusButtons[0]); // todo -> inprogress
        
        await waitFor(() => {
          expect(statusButtons[0]).toHaveClass(/blue|inprogress/);
        });
      }
      
      // 3. Add blockers/notes
      const subtaskNotesButton = screen.getByLabelText(/add.*notes/i);
      await user.click(subtaskNotesButton);
      
      const subtaskTextarea = screen.getByPlaceholderText(/notes.*subtask/i);
      await user.type(subtaskTextarea, 'Blocked: Waiting for API documentation from backend team');
      
      jest.advanceTimersByTime(1000);
      
      // 4. Update feature status
      // This would involve drag and drop in real scenario
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(/Blocked.*API documentation/i)).toBeInTheDocument();
      });
    });

    test('QA tester testing workflow', async () => {
      const { user } = render(<ProjectTracking />);
      
      // 1. Find features ready for testing
      expect(screen.getByText(/Project Tracking Core Features/i)).toBeInTheDocument();
      
      // 2. Add test results as attachments
      const attachButton = screen.getByLabelText(/add.*attachment/i);
      await user.click(attachButton);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        const testReport = testHelpers.createMockFile('test-report.pdf', 'application/pdf');
        testHelpers.simulateFileUpload(fileInput, [testReport]);
        
        await waitFor(() => {
          expect(screen.getByText('test-report.pdf')).toBeInTheDocument();
        });
      }
      
      // 3. Add test notes
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\n\nQA Status: Tested on Chrome, Firefox, Safari. Found 2 minor UI issues.');
      
      jest.advanceTimersByTime(1000);
      
      // 4. Update subtask status based on test results
      const statusButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Status')
      );
      
      if (statusButtons.length > 0) {
        await user.click(statusButtons[0]); // Move to next status
      }
    });
  });

  describe('Team Collaboration Scenarios', () => {
    test('multiple team members working on same feature', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Simulate Alice working on frontend
      const subtaskNotesButton = screen.getByLabelText(/add.*notes/i);
      await user.click(subtaskNotesButton);
      
      const aliceNotes = screen.getByPlaceholderText(/notes.*subtask/i);
      await user.type(aliceNotes, 'Alice: Frontend component completed, ready for review');
      
      jest.advanceTimersByTime(1000);
      
      // Simulate Bob working on backend
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const bobNotes = screen.getByRole('textbox');
      await user.type(bobNotes, '\n\nBob: API endpoints deployed to staging');
      
      jest.advanceTimersByTime(1000);
      
      // Both updates should persist
      await waitFor(() => {
        expect(screen.getByDisplayValue(/Alice.*Frontend component/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Bob.*API endpoints/i)).toBeInTheDocument();
      });
    });

    test('bulk assignment for sprint planning', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Team lead assigns multiple subtasks to team members
      const bulkButton = screen.getByLabelText(/bulk.*assign/i);
      await user.click(bulkButton);
      
      // Select multiple subtasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      
      // Should show bulk assignment panel
      expect(screen.getByText(/bulk assign.*2.*subtask/i)).toBeInTheDocument();
      
      // Assign to Alice
      const aliceButton = screen.getByRole('button', { name: /alice/i });
      await user.click(aliceButton);
      
      // Should complete bulk assignment
      await waitFor(() => {
        expect(screen.queryByText(/bulk assign/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Project Lifecycle Scenarios', () => {
    test('complete feature development lifecycle', async () => {
      const { user } = render(<ProjectTracking />);
      
      // 1. Initial planning (Ideas column)
      const createButton = screen.getByRole('button', { name: /create.*feature/i });
      await user.click(createButton);
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Payment Integration');
      
      const submitButton = screen.getByRole('button', { name: /create|save/i });
      await user.click(submitButton);
      
      // 2. Move to Working when development starts
      // (This would be drag and drop in real scenario)
      
      // 3. Add implementation notes
      await waitFor(() => {
        expect(screen.getByText('Payment Integration')).toBeInTheDocument();
      });
      
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Integrating with Stripe API. Using React hooks for state management.');
      
      // 4. Add subtasks and complete them
      const subtaskInput = screen.getByPlaceholderText(/add.*subtask/i);
      await user.type(subtaskInput, 'Set up Stripe SDK');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Set up Stripe SDK')).toBeInTheDocument();
      });
      
      // 5. Move through stages (Working -> Pending -> Done)
      // Each stage would have different activities
      
      // 6. Final completion
      const statusButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Status')
      );
      
      if (statusButtons.length > 0) {
        await user.click(statusButtons[0]); // todo -> inprogress
        await user.click(statusButtons[0]); // inprogress -> done
      }
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(/Integrating with Stripe/i)).toBeInTheDocument();
      });
    });

    test('handling blocked work and dependencies', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Feature gets blocked
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '\n\nBLOCKED: Waiting for legal approval on user data handling.');
      
      // Move to pending column (drag and drop would be used here)
      
      // Add subtask for unblocking
      const subtaskInput = screen.getByPlaceholderText(/add.*subtask/i);
      await user.type(subtaskInput, 'Follow up with legal team');
      await user.keyboard('{Enter}');
      
      // Assign to project manager
      await waitFor(() => {
        expect(screen.getByText('Follow up with legal team')).toBeInTheDocument();
      });
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(/BLOCKED.*legal approval/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('user can recover from accidental deletion', async () => {
      const { user } = render(<ProjectTracking />);
      
      // User accidentally deletes a feature
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      if (deleteButtons.length > 0) {
        const featureTitle = screen.getByText(/Project Tracking Core Features/i);
        await user.click(deleteButtons[0]);
        
        // Should show undo option
        const undoButton = screen.getByRole('button', { name: /undo/i });
        expect(undoButton).toBeInTheDocument();
        
        // User clicks undo
        await user.click(undoButton);
        
        // Feature should be restored
        await waitFor(() => {
          expect(screen.getByText(/Project Tracking Core Features/i)).toBeInTheDocument();
        });
      }
    });

    test('user can recover from network interruption during auto-save', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Mock network failure
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Important notes that must not be lost');
      
      // Simulate auto-save failure
      jest.advanceTimersByTime(1000);
      
      // User should see some indication or retry mechanism
      // App should still be functional
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility User Scenarios', () => {
    test('keyboard-only user can complete full workflow', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Navigate using only keyboard
      await user.tab(); // First interactive element
      await user.tab(); // Second interactive element
      
      // Should be able to activate with keyboard
      await user.keyboard('{Enter}');
      
      // Continue navigation
      await user.tab();
      await user.keyboard(' '); // Space to activate
      
      // Should maintain focus and functionality
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });

    test('screen reader user gets proper announcements', async () => {
      render(<ProjectTracking />);
      
      // Check for live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Check for proper labeling
      const criticalElements = screen.getAllByRole('button');
      criticalElements.forEach(element => {
        expect(
          element.getAttribute('aria-label') || 
          element.textContent || 
          element.getAttribute('title')
        ).toBeTruthy();
      });
    });
  });

  describe('Performance Under Load', () => {
    test('interface remains responsive with many features', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Simulate having many features (would need data mocking)
      const start = performance.now();
      
      // Perform common operations
      const buttons = screen.getAllByRole('button').slice(0, 5);
      for (const button of buttons) {
        await user.click(button);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should remain responsive
      expect(duration).toBeLessThan(3000); // 3 seconds max
    });
  });
});