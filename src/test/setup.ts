import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

/**
 * Enhanced test setup for LifeSync component tests
 * Includes accessibility testing, mocks, and performance helpers
 */

// Extend Jest matchers to include accessibility testing
expect.extend(toHaveNoViolations)

// Force-disable Supabase integration for unit tests to avoid auth requirements
if (typeof process !== 'undefined') {
  process.env.VITE_SUPABASE_URL = 'your-project-url'
  process.env.VITE_SUPABASE_ANON_KEY = 'your-anon-key'
}

// Provide a basic jest compatibility layer for suites that still reference jest.*
if (!(globalThis as any).jest) {
  (globalThis as any).jest = {
    ...vi,
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    useFakeTimers: vi.useFakeTimers,
    clearAllTimers: vi.clearAllTimers,
    runAllTimers: vi.runAllTimers,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    advanceTimersByTime: vi.advanceTimersByTime,
    advanceTimersToNextTimer: vi.advanceTimersToNextTimer,
    setSystemTime: vi.setSystemTime,
  }
}

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
const storage = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key)! : null)),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key)
  }),
  clear: vi.fn(() => {
    storage.clear()
  }),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock matchMedia for environments without it
// Robust matchMedia mock compatible with both addEventListener and addListener
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => {
    const listeners: Array<(e: { matches: boolean; media: string }) => void> = []
    const mql = {
      matches: query.includes('prefers-color-scheme') ? false : false,
      media: query,
      onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null,
      addListener: vi.fn((cb: any) => {
        listeners.push(cb)
      }),
      removeListener: vi.fn((cb: any) => {
        const i = listeners.indexOf(cb)
        if (i >= 0) listeners.splice(i, 1)
      }),
      addEventListener: vi.fn((_type: string, cb: any) => {
        listeners.push(cb)
      }),
      removeEventListener: vi.fn((_type: string, cb: any) => {
        const i = listeners.indexOf(cb)
        if (i >= 0) listeners.splice(i, 1)
      }),
      dispatchEvent: vi.fn((_ev: Event) => true),
    } as any
    return mql
  }),
})

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
