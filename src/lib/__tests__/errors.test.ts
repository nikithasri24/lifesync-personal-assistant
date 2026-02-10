import { describe, it, expect } from 'vitest';
import {
  LifeSyncError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  DatabaseError,
  NetworkError,
  parseToLifeSyncError,
  isRetryableError,
  getUserErrorMessage,
  isAuthError,
  isNetworkError,
} from '../errors';

describe('Error Classes', () => {
  describe('AuthenticationError', () => {
    it('should create authentication error with proper properties', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error).toBeInstanceOf(LifeSyncError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.canRetry).toBe(false);
      expect(error.message).toBe('Invalid token');
      expect(error.userMessage).toBe('Your session has expired. Please log in again.');
    });

    it('should include context when provided', () => {
      const error = new AuthenticationError('Token expired', { userId: '123' });

      expect(error.context).toEqual({ userId: '123' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with fields', () => {
      const error = new ValidationError(
        'Validation failed',
        { email: 'Invalid email format' }
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.canRetry).toBe(true);
      expect(error.fields).toEqual({ email: 'Invalid email format' });
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource info', () => {
      const error = new NotFoundError('User', '123');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found: 123');
      expect(error.context?.resource).toBe('User');
      expect(error.context?.id).toBe('123');
    });
  });

  describe('DatabaseError', () => {
    it('should create database error', () => {
      const error = new DatabaseError('Connection failed');

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.canRetry).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection timeout');

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(0);
      expect(error.canRetry).toBe(true);
      expect(error.userMessage).toContain('internet connection');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError('Too many requests', 60);

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.canRetry).toBe(true);
    });
  });

  describe('parseToLifeSyncError', () => {
    it('should pass through LifeSyncError unchanged', () => {
      const original = new AuthenticationError('Test error');
      const parsed = parseToLifeSyncError(original);

      expect(parsed).toBe(original);
    });

    it('should parse authentication error from object', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const parsed = parseToLifeSyncError(error);

      expect(parsed).toBeInstanceOf(AuthenticationError);
      expect(parsed.message).toBe('Unauthorized');
    });

    it('should parse validation error from object', () => {
      const error = { status: 400, message: 'Bad request' };
      const parsed = parseToLifeSyncError(error);

      expect(parsed).toBeInstanceOf(ValidationError);
    });

    it('should parse not found error from object', () => {
      const error = { status: 404, message: 'Not found' };
      const parsed = parseToLifeSyncError(error);

      expect(parsed).toBeInstanceOf(NotFoundError);
    });

    it('should parse server error from object', () => {
      const error = { status: 500, message: 'Internal server error' };
      const parsed = parseToLifeSyncError(error);

      expect(parsed).toBeInstanceOf(ServerError);
    });

    it('should parse database error from PostgreSQL error code', () => {
      const error = { code: 'P0001', message: 'Database error' };
      const parsed = parseToLifeSyncError(error);

      expect(parsed).toBeInstanceOf(DatabaseError);
    });

    it('should parse network error from TypeError', () => {
      const error = new TypeError('fetch failed');
      const parsed = parseToLifeSyncError(error);

      expect(parsed).toBeInstanceOf(NetworkError);
    });

    it('should parse string error', () => {
      const parsed = parseToLifeSyncError('Something went wrong');

      expect(parsed).toBeInstanceOf(LifeSyncError);
      expect(parsed.message).toBe('Something went wrong');
    });

    it('should handle unknown error types', () => {
      const parsed = parseToLifeSyncError(null);

      expect(parsed).toBeInstanceOf(LifeSyncError);
      expect(parsed.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      expect(isRetryableError(new NetworkError('Test'))).toBe(true);
      expect(isRetryableError(new DatabaseError('Test'))).toBe(true);
      expect(isRetryableError(new ServerError('Test'))).toBe(true);
      expect(isRetryableError(new RateLimitError('Test'))).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(new AuthenticationError('Test'))).toBe(false);
      expect(isRetryableError(new AuthorizationError('Test'))).toBe(false);
      expect(isRetryableError(new NotFoundError('User'))).toBe(false);
    });
  });

  describe('getUserErrorMessage', () => {
    it('should return user-friendly message', () => {
      const error = new AuthenticationError('Invalid token');
      const message = getUserErrorMessage(error);

      expect(message).toBe('Your session has expired. Please log in again.');
    });

    it('should work with unknown errors', () => {
      const message = getUserErrorMessage('Random error');

      expect(message).toBe('Random error');
    });
  });

  describe('isAuthError', () => {
    it('should identify authentication errors', () => {
      expect(isAuthError(new AuthenticationError('Test'))).toBe(true);
      expect(isAuthError({ status: 401, message: 'Unauthorized' })).toBe(true);
      expect(isAuthError(new ValidationError('Test'))).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      expect(isNetworkError(new NetworkError('Test'))).toBe(true);
      expect(isNetworkError(new TypeError('fetch failed'))).toBe(true);
      expect(isNetworkError(new AuthenticationError('Test'))).toBe(false);
    });
  });
});
