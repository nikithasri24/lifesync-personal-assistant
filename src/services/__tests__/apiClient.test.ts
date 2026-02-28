/**
 * Legacy ApiClient tests
 * The apiClient has been deprecated in favor of the API layer (src/api/*.ts).
 * These tests verify the stub compatibility layer still exists and works.
 */

import { describe, it, expect } from 'vitest';
import { apiClient } from '../apiClient';

describe('ApiClient', () => {
  describe('API Structure', () => {
    it('should be a singleton instance', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient).toBe('object');
    });

    it('should have setAuthContext method', () => {
      expect(typeof apiClient.setAuthContext).toBe('function');
      // Should not throw when called
      expect(() => apiClient.setAuthContext('test-user')).not.toThrow();
      expect(() => apiClient.setAuthContext(null)).not.toThrow();
    });

    it('should have getAuthContext method', () => {
      expect(typeof apiClient.getAuthContext).toBe('function');
    });

    it('should track auth context correctly', () => {
      apiClient.setAuthContext('user-123');
      expect(apiClient.getAuthContext()).toBe('user-123');
      apiClient.setAuthContext(null);
      expect(apiClient.getAuthContext()).toBeNull();
    });
  });

  describe('Deprecation Notice', () => {
    it('should exist as a backward-compatibility stub', () => {
      // The apiClient module is deprecated.
      // Real API calls should use src/api/*.ts instead.
      expect(apiClient).toBeDefined();
    });
  });
});
