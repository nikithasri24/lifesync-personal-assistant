import { vi } from 'vitest';

export const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  api: vi.fn(),
  apiResponse: vi.fn(),
  perf: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
};

export const logDebug = vi.fn();
export const logInfo = vi.fn();
export const logWarn = vi.fn();
export const logError = vi.fn();
export const logApi = vi.fn();
export const logApiResponse = vi.fn();
export const logPerf = vi.fn();
