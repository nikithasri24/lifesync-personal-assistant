import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test Utilities for ProjectTracking Component Tests
 * 
 * This file contains helper functions and utilities to make testing easier
 * and more consistent across all test files.
 */

// Custom render function that can be extended with providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => { return {
    user: userEvent.setup(),
    ...render(ui, options) };
};

// Test data helpers
export const mockFeatureData = { basic: {
    id: 'test-feature-1',
    title: 'Test Feature',
    description: 'Test Description',
    status: 'ideas',
    priority: 'medium' as const,
    category: 'Testing',
    icon: 'TestIcon',
    projectId: 'test-project',
    assignees: ['user-current'] },
  withSubtasks: { id: 'test-feature-2',
    title: 'Feature with Subtasks',
    description: 'Feature that has subtasks',
    status: 'working',
    priority: 'high' as const,
    category: 'Development',
    icon: 'DevIcon',
    projectId: 'test-project',
    assignees: ['user-current', 'user-alice'],
    subtasks: [
      {
        id: 'subtask-1',
        title: 'First Subtask',
        completed: false,
        status: 'todo' as const,
        assignees: ['user-current'] },
      { id: 'subtask-2',
        title: 'Second Subtask',
        completed: true,
        status: 'done' as const,
        assignees: ['user-alice'] },
    ],
  },
  withNotes: { id: 'test-feature-3',
    title: 'Feature with Notes',
    description: 'Feature that has notes',
    status: 'pending',
    priority: 'low' as const,
    category: 'Documentation',
    icon: 'DocsIcon',
    projectId: 'test-project',
    notes: {
      id: 'note-1',
      content: 'These are test notes for the feature',
      updatedBy: 'user-current',
      updatedAt: '2024-01-15T10:30:00Z',
      isPrivate: false },
  },
  withAttachments: { id: 'test-feature-4',
    title: 'Feature with Attachments',
    description: 'Feature that has file attachments',
    status: 'done',
    priority: 'critical' as const,
    category: 'Assets',
    icon: 'AttachIcon',
    projectId: 'test-project',
    attachments: [
      {
        id: 'attachment-1',
        name: 'test-document.pdf',
        size: 1024000,
        type: 'application/pdf',
        url: 'mock-url-1',
        uploadedBy: 'user-current',
        uploadedAt: '2024-01-15T10:30:00Z' },
      { id: 'attachment-2',
        name: 'screenshot.png',
        size: 512000,
        type: 'image/png',
        url: 'mock-url-2',
        uploadedBy: 'user-alice',
        uploadedAt: '2024-01-16T14:22:00Z',
        thumbnail: 'mock-thumb-url' },
    ],
  },
};

// Helper functions for common test patterns
export const testHelpers = {
  /**
   * Simulates typing in a textarea with auto-save delay
   */
  async typeWithAutoSave(user: any, element: HTMLElement, text: string) {
    await user.type(element, text);
    // Advance timers to trigger auto-save
    jest.advanceTimersByTime(1000);
  },

  /**
   * Simulates file selection for upload testing
   */
  simulateFileUpload(fileInput: HTMLElement, files: File[]) { Object.defineProperty(fileInput, 'files', {
      value: files,
      writable: false });
    
    const event = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(event);
  },

  /**
   * Creates a mock file for testing
   */
  createMockFile(name: string, type: string, size: number = 1000) {
    return new File(['mock content'], name, { type, lastModified: Date.now() });
  },

  /**
   * Finds a button by various possible labels/attributes
   */
  findButtonByLabel(container: HTMLElement, labels: string[]) {
    for (const label of labels) {
      const button = container.querySelector(`[aria-label*="${label}"]`) ||
                    container.querySelector(`[title*="${label}"]`) ||
                    container.querySelector(`button:contains("${label}")`);
      if (button) return button;
    }
    return null;
  },

  /**
   * Waits for auto-save to complete
   */
  async waitForAutoSave(waitFor: any) {
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      // Auto-save should be complete
    });
  },

  /**
   * Simulates drag and drop operation
   */
  simulateDragDrop(source: string, target: string) {
    return {
      active: { id: source },
      over: { id: target },
    };
  },
};

// Custom matchers for specific assertions
export const customMatchers = {
  /**
   * Checks if an element represents a feature card
   */
  toBeFeatureCard(received: HTMLElement, expectedTitle?: string) {
    const hasFeatureStructure = received.querySelector('[data-testid*="feature"]') ||
                               received.querySelector('.feature-card') ||
                               received.textContent?.includes('feature');
    
    if (expectedTitle) {
      const hasTitle = received.textContent?.includes(expectedTitle);
      return {
        pass: hasFeatureStructure && hasTitle,
        message: () => `Expected element to be a feature card with title "${expectedTitle}"`,
      };
    }

    return { pass: Boolean(hasFeatureStructure),
      message: () => 'Expected element to be a feature card' };
  },

  /**
   * Checks if an element shows a specific status
   */
  toHaveStatus(received: HTMLElement, expectedStatus: string) {
    const hasStatus = received.classList.contains(expectedStatus) ||
                     received.querySelector(`[data-status="${expectedStatus}"]`) ||
                     received.textContent?.toLowerCase().includes(expectedStatus.toLowerCase());

    return {
      pass: Boolean(hasStatus),
      message: () => `Expected element to have status "${expectedStatus}"`,
    };
  },

  /**
   * Checks if an element shows saving state
   */
  toBeSaving(received: HTMLElement) { const isSaving = received.textContent?.includes('Saving') ||
                    received.querySelector('.animate-pulse') ||
                    received.querySelector('[data-saving="true"]');

    return {
      pass: Boolean(isSaving),
      message: () => 'Expected element to show saving state' };
  },
};

// Mock data for various test scenarios
export const mockProjects = {
  basic: {
    id: 'test-project',
    name: 'Test Project',
    columns: [
      { id: 'ideas', name: 'Ideas', color: 'purple', order: 0 },
      { id: 'working', name: 'Working', color: 'blue', order: 1 },
      { id: 'pending', name: 'Pending', color: 'yellow', order: 2 },
      { id: 'done', name: 'Done', color: 'emerald', order: 3 },
    ],
    collaborators: [
      { id: 'user-current', name: 'Current User', color: 'blue' },
      { id: 'user-alice', name: 'Alice', color: 'green' },
      { id: 'user-bob', name: 'Bob', color: 'purple' },
    ],
  },
  withCustomColumns: {
    id: 'custom-project',
    name: 'Custom Project',
    columns: [
      { id: 'backlog', name: 'Backlog', color: 'gray', order: 0 },
      { id: 'analysis', name: 'Analysis', color: 'orange', order: 1 },
      { id: 'development', name: 'Development', color: 'blue', order: 2 },
      { id: 'testing', name: 'Testing', color: 'yellow', order: 3 },
      { id: 'review', name: 'Review', color: 'purple', order: 4 },
      { id: 'deployment', name: 'Deployment', color: 'green', order: 5 },
    ],
    collaborators: [
      { id: 'user-current', name: 'Current User', color: 'blue' },
      { id: 'user-dev1', name: 'Developer 1', color: 'green' },
      { id: 'user-dev2', name: 'Developer 2', color: 'purple' },
      { id: 'user-qa', name: 'QA Tester', color: 'orange' },
    ],
  },
};

// Performance testing helpers
export const performanceHelpers = {
  /**
   * Measures render time for performance testing
   */
  measureRenderTime(renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    return end - start;
  },

  /**
   * Tests component with large datasets
   */
  createLargeDataset(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      ...mockFeatureData.basic,
      id: `feature-${i}`,
      title: `Feature ${i}`,
      description: `Description for feature ${i}`,
    }));
  },
};

// Accessibility testing helpers
export const a11yHelpers = {
  /**
   * Checks if drag and drop is accessible via keyboard
   */
  async testKeyboardNavigation(user: any, container: HTMLElement) {
    // Tab through interactive elements
    await user.tab();
    const activeElement = document.activeElement;
    
    // Should be able to activate with Enter or Space
    if (activeElement) {
      await user.keyboard('{Enter}');
      // or await user.keyboard(' ');
    }
  },

  /**
   * Checks if screen reader announcements are present
   */
  checkScreenReaderContent(container: HTMLElement) { const srOnly = container.querySelectorAll('.sr-only');
    const ariaLabels = container.querySelectorAll('[aria-label]');
    const ariaDescriptions = container.querySelectorAll('[aria-describedby]');
    
    return {
      hasScreenReaderContent: srOnly.length > 0,
      hasAriaLabels: ariaLabels.length > 0,
      hasAriaDescriptions: ariaDescriptions.length > 0 };
  },
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };