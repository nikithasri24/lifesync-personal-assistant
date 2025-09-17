import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

/**
 * Enhanced test setup for LifeSync component tests
 * Includes accessibility testing, mocks, and performance helpers
 */

// Extend Jest matchers to include accessibility testing
expect.extend(toHaveNoViolations)

// Mock URL.createObjectURL since it's not available in jsdom
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance.now for performance testing
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock local storage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock drag and drop for @dnd-kit testing
Object.defineProperty(window, 'DragEvent', {
  value: class DragEvent extends Event {
    constructor(type: string, init?: DragEventInit) {
      super(type, init);
      this.dataTransfer = new DataTransfer();
    }
    dataTransfer: DataTransfer;
  },
});

// Mock DataTransfer for drag and drop
Object.defineProperty(window, 'DataTransfer', {
  value: class DataTransfer {
    items: DataTransferItemList = [] as any;
    files: FileList = [] as any;
    types: string[] = [];
    getData = vi.fn();
    setData = vi.fn();
    clearData = vi.fn();
    setDragImage = vi.fn();
  },
});

// Suppress console errors during testing (optional - can be removed if needed)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};