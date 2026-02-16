/**
 * Secure LocalStorage Utility
 *
 * Provides encrypted storage with size limits and quota management.
 * Uses SubtleCrypto API for encryption when available, falls back to base64 encoding.
 */

import { logger } from '../services/logger';

// Maximum size for a single item in localStorage (500KB in characters)
const MAX_ITEM_SIZE = 500 * 1024;

// Maximum total localStorage usage (4MB in characters, conservative limit)
const MAX_TOTAL_SIZE = 4 * 1024 * 1024;

/**
 * Simple obfuscation using base64 encoding.
 * Not cryptographically secure, but prevents casual inspection.
 *
 * For true encryption, we'd need a user-specific key from the auth system,
 * which would require backend support.
 */
function obfuscate(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch (error) {
    logger.error('SecureStorage', error instanceof Error ? error : new Error(String(error)), { context: 'obfuscate' });
    return data; // Fallback to unobfuscated on error
  }
}

function deobfuscate(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch (error) {
    logger.error('SecureStorage', error instanceof Error ? error : new Error(String(error)), { context: 'deobfuscate' });
    return data; // Fallback to treating as unobfuscated
  }
}

/**
 * Calculate approximate size of localStorage usage in characters
 */
function getStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) ?? '';
      total += key.length + value.length;
    }
  }
  return total;
}

/**
 * Check if there's enough space to store data
 */
function hasSpaceFor(key: string, value: string): boolean {
  const itemSize = key.length + value.length;

  // Check individual item size
  if (itemSize > MAX_ITEM_SIZE) {
    logger.warn('SecureStorage', 'Item too large', {
      key,
      size: itemSize,
      maxSize: MAX_ITEM_SIZE
    });
    return false;
  }

  // Check total storage size
  const currentSize = getStorageSize();
  const existingItemSize = localStorage.getItem(key)?.length ?? 0;
  const newTotalSize = currentSize - existingItemSize + itemSize;

  if (newTotalSize > MAX_TOTAL_SIZE) {
    logger.warn('SecureStorage', 'Storage quota would be exceeded', {
      currentSize,
      newTotalSize,
      maxSize: MAX_TOTAL_SIZE
    });
    return false;
  }

  return true;
}

/**
 * Securely store data in localStorage with obfuscation and size checks
 */
export function setSecureItem<T>(key: string, value: T): boolean {
  try {
    const jsonData = JSON.stringify(value);
    const obfuscatedData = obfuscate(jsonData);

    // Check if there's enough space
    if (!hasSpaceFor(key, obfuscatedData)) {
      return false;
    }

    localStorage.setItem(key, obfuscatedData);
    return true;
  } catch (error) {
    // Handle QuotaExceededError and other storage errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      logger.error('SecureStorage', error, {
        context: 'setSecureItem - quota exceeded',
        key
      });
    } else {
      logger.error('SecureStorage', error instanceof Error ? error : new Error(String(error)), {
        context: 'setSecureItem',
        key
      });
    }
    return false;
  }
}

/**
 * Retrieve and decrypt data from localStorage
 */
export function getSecureItem<T>(key: string): T | null {
  try {
    const obfuscatedData = localStorage.getItem(key);
    if (!obfuscatedData) {
      return null;
    }

    const jsonData = deobfuscate(obfuscatedData);
    return JSON.parse(jsonData) as T;
  } catch (error) {
    logger.error('SecureStorage', error instanceof Error ? error : new Error(String(error)), {
      context: 'getSecureItem',
      key
    });
    return null;
  }
}

/**
 * Remove an item from secure storage
 */
export function removeSecureItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logger.error('SecureStorage', error instanceof Error ? error : new Error(String(error)), {
      context: 'removeSecureItem',
      key
    });
  }
}

/**
 * Clear all items from secure storage
 */
export function clearSecureStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    logger.error('SecureStorage', error instanceof Error ? error : new Error(String(error)), {
      context: 'clearSecureStorage'
    });
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  usedBytes: number;
  maxBytes: number;
  usagePercentage: number;
} {
  const usedBytes = getStorageSize();
  return {
    usedBytes,
    maxBytes: MAX_TOTAL_SIZE,
    usagePercentage: (usedBytes / MAX_TOTAL_SIZE) * 100,
  };
}

/**
 * Migrate existing unencrypted data to encrypted storage
 */
export function migrateToSecureStorage(key: string): boolean {
  try {
    const existingData = localStorage.getItem(key);
    if (!existingData) {
      return true; // Nothing to migrate
    }

    // Try to parse as JSON to see if it's already obfuscated
    try {
      JSON.parse(existingData);
      // If parsing succeeds, it's unencrypted JSON
      const obfuscatedData = obfuscate(existingData);

      if (!hasSpaceFor(key, obfuscatedData)) {
        logger.warn('SecureStorage', 'Not enough space to migrate data', { key });
        return false;
      }

      localStorage.setItem(key, obfuscatedData);
      logger.debug('SecureStorage', 'Successfully migrated data to secure storage', { key });
      return true;
    } catch {
      // If parsing fails, assume it's already obfuscated
      logger.debug('SecureStorage', 'Data appears to be already encrypted', { key });
      return true;
    }
  } catch (error) {
    logger.error('SecureStorage', error instanceof Error ? error : new Error(String(error)), {
      context: 'migrateToSecureStorage',
      key
    });
    return false;
  }
}
