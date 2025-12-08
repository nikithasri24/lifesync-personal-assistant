/**
 * Type declarations for Window extensions
 * Replaces 'as any' assertions for window object properties
 */

declare global {
  interface Window {
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
