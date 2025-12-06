/**
 * Type declarations for Window extensions
 * Replaces 'as any' assertions for window object properties
 */

declare global {
  interface Window {
    /**
     * Cleanup function for 75 Hard duplicates
     * Returns void (fires and forgets the async operation)
     */
    cleanup75HardDuplicates?: () => void;

    /**
     * WebKit interface for iOS/Safari specific APIs
     */
    webkit?: {
      messageHandlers?: {
        health?: {
          postMessage: (message: unknown) => void;
        };
      };
    };
  }
}

export {};
