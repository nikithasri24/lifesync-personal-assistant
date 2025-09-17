/// <reference types="vitest/globals" />

declare global {
  namespace Vi {
    interface ExpectMatcher<T = any> {
      toHaveNoViolations(): T;
    }
  }
}

export {};