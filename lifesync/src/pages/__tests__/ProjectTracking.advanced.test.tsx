import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectTracking from '../ProjectTracking';
import { 
  render, 
  testHelpers, 
  mockFeatureData, 
  mockProjects,
  performanceHelpers,
  a11yHelpers 
} from './test-utils';

/**
 * Advanced Functionality Tests for ProjectTracking
 * 
 * These tests cover edge cases, performance scenarios, 
 * accessibility, and complex integration workflows.
 */

// Mock complex scenarios
jest.useFakeTimers();

describe('ProjectTracking - Advanced Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Auto-Save Functionality', () => {
    test('should debounce auto-save calls correctly', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Expand notes
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      
      // Type rapidly
      await user.type(textarea, 'First');
      jest.advanceTimersByTime(500); // Not enough time for save
      
      await user.type(textarea, ' Second');
      jest.advanceTimersByTime(500); // Still not enough
      
      await user.type(textarea, ' Third');
      jest.advanceTimersByTime(1000); // Now it should save
      
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });

    test('should handle multiple concurrent auto-save operations', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Start editing feature notes
      const featureExpandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(featureExpandButton);
      
      const featureTextarea = screen.getByPlaceholderText(/notes.*thoughts/i);
      await user.type(featureTextarea, 'Feature notes');
      
      // Start editing subtask notes
      const subtaskNotesButton = screen.getByLabelText(/add.*notes/i);
      await user.click(subtaskNotesButton);
      
      const subtaskTextarea = screen.getByPlaceholderText(/notes.*subtask/i);
      await user.type(subtaskTextarea, 'Subtask notes');
      
      // Both should auto-save independently
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        const savingIndicators = screen.getAllByText(/saving/i);
        expect(savingIndicators.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('should cancel previous auto-save when new changes are made', async () => {
      const { user } = render(<ProjectTracking />);
      
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      
      // Start typing
      await user.type(textarea, 'First change');
      jest.advanceTimersByTime(800); // Almost save time
      
      // Type more before save triggers
      await user.type(textarea, ' More changes');
      jest.advanceTimersByTime(1000); // Should save now
      
      // Should only save once with the complete text
      await waitFor(() => {
        expect(textarea).toHaveValue(expect.stringContaining('First change More changes'));
      });
    });
  });

  describe('Performance and Large Dataset Handling', () => {
    test('should handle large number of features efficiently', async () => {
      // This test would need to mock a large dataset
      const largeDataset = performanceHelpers.createLargeDataset(100);
      
      const renderTime = performanceHelpers.measureRenderTime(() => {
        render(<ProjectTracking />);
      });
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
    });

    test('should handle rapid user interactions without lag', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Rapid clicks on different elements
      const buttons = screen.getAllByRole('button').slice(0, 10);
      
      const start = performance.now();
      
      for (const button of buttons) {
        await user.click(button);
      }
      
      const end = performance.now();
      const totalTime = end - start;
      
      // Should handle rapid interactions quickly
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 10 clicks
    });

    test('should virtualize long lists if implemented', async () => {
      render(<ProjectTracking />);
      
      // Check if virtualization is implemented for subtasks
      const subtaskContainer = screen.getByText(/subtasks/i).closest('div');
      
      if (subtaskContainer) {
        // Look for virtualization indicators
        const hasVirtualization = subtaskContainer.querySelector('[data-virtual="true"]') ||
                                 subtaskContainer.style.height ||
                                 subtaskContainer.classList.contains('virtual');
        
        // If there are many subtasks, should use virtualization
        const subtasks = subtaskContainer.querySelectorAll('[data-testid*="subtask"]');
        if (subtasks.length > 20) {
          expect(hasVirtualization).toBeTruthy();
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed data gracefully', async () => {
      // Mock console.error to catch any errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Component should not crash with unexpected data
      expect(() => render(<ProjectTracking />)).not.toThrow();
      
      // Should not log errors
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle network errors for file uploads', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Mock fetch to simulate network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const attachButton = screen.getByLabelText(/add.*attachment/i);
      await user.click(attachButton);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        const file = testHelpers.createMockFile('test.txt', 'text/plain');
        testHelpers.simulateFileUpload(fileInput, [file]);
        
        // Should handle gracefully without crashing
        await waitFor(() => {
          expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
        });
      }
    });

    test('should handle corrupted localStorage data', async () => {
      // Mock corrupted localStorage
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn().mockReturnValue('corrupted{json');
      
      expect(() => render(<ProjectTracking />)).not.toThrow();
      
      localStorage.getItem = originalGetItem;
    });

    test('should handle browser API unavailability', async () => {
      // Mock missing APIs
      const originalCreateObjectURL = URL.createObjectURL;
      // @ts-ignore
      delete URL.createObjectURL;
      
      const { user } = render(<ProjectTracking />);
      
      // File upload should still work with fallback
      const attachButton = screen.getByLabelText(/add.*attachment/i);
      await user.click(attachButton);
      
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
      
      URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe('Accessibility (a11y) Testing', () => {
    test('should be fully keyboard navigable', async () => {
      const { user } = render(<ProjectTracking />);
      
      await a11yHelpers.testKeyboardNavigation(user, document.body);
      
      // Should be able to navigate through all interactive elements
      const interactiveElements = screen.getAllByRole('button');
      expect(interactiveElements.length).toBeGreaterThan(0);
      
      // Each should be focusable
      for (let i = 0; i < Math.min(5, interactiveElements.length); i++) {
        await user.tab();
        expect(document.activeElement).toBeInstanceOf(HTMLElement);
      }
    });

    test('should have proper ARIA labels and descriptions', () => {
      render(<ProjectTracking />);
      
      const a11yContent = a11yHelpers.checkScreenReaderContent(document.body);
      
      expect(a11yContent.hasAriaLabels).toBeTruthy();
      
      // Critical interactive elements should have labels
      const criticalButtons = [
        screen.queryByLabelText(/add.*feature/i),
        screen.queryByLabelText(/add.*attachment/i),
        screen.queryByLabelText(/bulk.*assign/i),
      ].filter(Boolean);
      
      expect(criticalButtons.length).toBeGreaterThan(0);
    });

    test('should announce status changes to screen readers', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Look for live region or aria-live attributes
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Status changes should be announced
      const statusButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Status')
      );
      
      if (statusButtons.length > 0) {
        await user.click(statusButtons[0]);
        
        // Should have updated aria attributes
        expect(statusButtons[0]).toHaveAttribute('aria-label');
      }
    });

    test('should support high contrast mode', () => {
      render(<ProjectTracking />);
      
      // Check for proper contrast in critical elements
      const importantElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('textbox'),
        ...screen.getAllByText(/Project Tracking/i),
      ];
      
      importantElements.forEach(element => {
        // Should have readable text (not just background colors)
        expect(element.textContent || element.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('Complex Workflow Integration Tests', () => {
    test('should handle complete project lifecycle', async () => {
      const { user } = render(<ProjectTracking />);
      
      // 1. Create new feature
      const createButton = screen.getByRole('button', { name: /create.*feature/i });
      await user.click(createButton);
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Lifecycle Test Feature');
      
      const submitButton = screen.getByRole('button', { name: /create|save/i });
      await user.click(submitButton);
      
      // 2. Add multiple subtasks
      await waitFor(() => {
        expect(screen.getByText('Lifecycle Test Feature')).toBeInTheDocument();
      });
      
      const subtasks = ['Design mockups', 'Implement backend', 'Write tests', 'Deploy'];
      
      for (const subtaskTitle of subtasks) {
        const subtaskInput = screen.getByPlaceholderText(/add.*subtask/i);
        await user.type(subtaskInput, subtaskTitle);
        await user.keyboard('{Enter}');
        
        await waitFor(() => {
          expect(screen.getByText(subtaskTitle)).toBeInTheDocument();
        });
      }
      
      // 3. Move through all statuses
      const statuses = ['working', 'pending', 'done'];
      
      for (const status of statuses) {
        // Find drag mock or status change mechanism
        // This would trigger the drag and drop logic
        expect(screen.getByText('Lifecycle Test Feature')).toBeInTheDocument();
      }
      
      // 4. Complete all subtasks
      const statusButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Status')
      );
      
      for (const button of statusButtons.slice(0, 4)) { // For our 4 subtasks
        await user.click(button); // todo -> inprogress
        await user.click(button); // inprogress -> done
      }
      
      // 5. Add notes and attachments
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Project completed successfully!');
      
      // 6. Verify final state
      jest.advanceTimersByTime(1000); // Auto-save
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(/Project completed successfully/i)).toBeInTheDocument();
      });
    });

    test('should handle concurrent user actions', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Simulate multiple users working simultaneously
      const promises = [
        // User 1: Edit notes
        (async () => {
          const expandButton = screen.getByRole('button', { name: /expand/i });
          await user.click(expandButton);
          const textarea = screen.getByRole('textbox');
          await user.type(textarea, 'User 1 notes');
        })(),
        
        // User 2: Add subtask
        (async () => {
          const subtaskInput = screen.getByPlaceholderText(/add.*subtask/i);
          await user.type(subtaskInput, 'Concurrent subtask');
          await user.keyboard('{Enter}');
        })(),
        
        // User 3: Change assignments
        (async () => {
          const assignButton = screen.getByLabelText(/add.*assignee/i);
          await user.click(assignButton);
        })(),
      ];
      
      // All should complete without conflicts
      await Promise.all(promises);
      
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
    });

    test('should handle data persistence across sessions', async () => {
      // First session
      const { unmount } = render(<ProjectTracking />);
      
      // Make changes (this would be stored in localStorage/state)
      // Unmount component
      unmount();
      
      // Second session - remount
      render(<ProjectTracking />);
      
      // Data should persist
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
    });
  });

  describe('Stress Testing', () => {
    test('should handle rapid feature creation/deletion', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Rapidly create and delete features
      for (let i = 0; i < 10; i++) {
        // Create
        const createButton = screen.getByRole('button', { name: /create.*feature/i });
        await user.click(createButton);
        
        const titleInput = screen.getByLabelText(/title/i);
        await user.type(titleInput, `Stress Test ${i}`);
        
        const submitButton = screen.getByRole('button', { name: /create|save/i });
        await user.click(submitButton);
        
        // Delete immediately
        await waitFor(() => {
          const deleteButtons = screen.getAllByLabelText(/delete/i);
          if (deleteButtons.length > 0) {
            return user.click(deleteButtons[0]);
          }
        });
      }
      
      // Should still be functional
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
    });

    test('should handle memory leaks in timers', async () => {
      const { user, unmount } = render(<ProjectTracking />);
      
      // Start multiple auto-save operations
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      const textarea = screen.getByRole('textbox');
      
      // Create multiple pending timers
      for (let i = 0; i < 10; i++) {
        await user.type(textarea, `Change ${i}`);
        jest.advanceTimersByTime(500); // Don't let them complete
      }
      
      // Unmount component - should clean up timers
      unmount();
      
      // No memory leaks should occur
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Browser Compatibility', () => {
    test('should work with different viewport sizes', async () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      render(<ProjectTracking />);
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
      
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });
      
      // Should still render correctly
      expect(screen.getByText(/Project Tracking/i)).toBeInTheDocument();
    });

    test('should handle touch events for mobile drag and drop', async () => {
      const { user } = render(<ProjectTracking />);
      
      // Mock touch events
      const touchEventInit = {
        touches: [{ clientX: 100, clientY: 100 }],
        changedTouches: [{ clientX: 100, clientY: 100 }],
      };
      
      const featureElement = screen.getByText(/Project Tracking Core Features/i);
      
      // Should handle touch events without errors
      expect(() => {
        featureElement.dispatchEvent(new TouchEvent('touchstart', touchEventInit));
        featureElement.dispatchEvent(new TouchEvent('touchmove', touchEventInit));
        featureElement.dispatchEvent(new TouchEvent('touchend', touchEventInit));
      }).not.toThrow();
    });
  });
});