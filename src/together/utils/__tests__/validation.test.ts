/**
 * Unit tests for Together validation utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImageFile,
  validateVideoFile,
  validateAudioFile,
  sanitizeMessageBody,
  sanitizePlainText,
  sanitizeTitle,
  validateMilestone,
  validatePartnerMessage,
  validateChallenge,
  validateUrl,
} from '../validation';

vi.mock('@/services/logger');

describe('Together Validation Utilities', () => {
  describe('validateImageFile', () => {
    it('should accept valid JPEG image', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.sanitizedName).toBe('photo.jpg');
    });

    it('should accept valid PNG image', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file exceeding size limit', () => {
      const file = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB (over 10MB limit)

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should sanitize filename with special characters', () => {
      const file = new File(['content'], 'my photo (1).jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.sanitizedName).toBe('my_photo__1_.jpg');
    });

    it('should handle path traversal attempts in filename', () => {
      const file = new File(['content'], '../../etc/passwd.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.sanitizedName).toBe('passwd.jpg');
      expect(result.sanitizedName).not.toContain('/');
      expect(result.sanitizedName).not.toContain('\\');
    });
  });

  describe('validateVideoFile', () => {
    it('should accept valid MP4 video', () => {
      const file = new File(['content'], 'video.mp4', { type: 'video/mp4' });
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 }); // 50MB

      const result = validateVideoFile(file);

      expect(result.valid).toBe(true);
    });

    it('should reject video exceeding size limit', () => {
      const file = new File(['content'], 'large-video.mp4', { type: 'video/mp4' });
      Object.defineProperty(file, 'size', { value: 150 * 1024 * 1024 }); // 150MB

      const result = validateVideoFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });
  });

  describe('validateAudioFile', () => {
    it('should accept valid MP3 audio', () => {
      const file = new File(['content'], 'song.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB

      const result = validateAudioFile(file);

      expect(result.valid).toBe(true);
    });

    it('should reject audio exceeding size limit', () => {
      const file = new File(['content'], 'long-audio.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 }); // 25MB

      const result = validateAudioFile(file);

      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeMessageBody', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeMessageBody(input);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
    });

    it('should remove script tags (XSS prevention)', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeMessageBody(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should sanitize dangerous event handlers', () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeMessageBody(input);

      expect(result).not.toContain('onclick');
      expect(result).toContain('Click me');
    });

    it('should allow safe links', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeMessageBody(input);

      expect(result).toContain('href');
      expect(result).toContain('https://example.com');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Bad link</a>';
      const result = sanitizeMessageBody(input);

      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizePlainText', () => {
    it('should strip all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizePlainText(input);

      expect(result).toBe('Hello world!');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should handle XSS attempts', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizePlainText(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });
  });

  describe('sanitizeTitle', () => {
    it('should strip HTML and enforce length limit', () => {
      const input = '<p>My Title</p>';
      const result = sanitizeTitle(input, 100);

      expect(result).toBe('My Title');
    });

    it('should truncate to max length', () => {
      const input = 'A'.repeat(300);
      const result = sanitizeTitle(input, 200);

      expect(result.length).toBe(200);
    });

    it('should trim whitespace', () => {
      const input = '  Title with spaces  ';
      const result = sanitizeTitle(input);

      expect(result).toBe('Title with spaces');
    });
  });

  describe('validateMilestone', () => {
    it('should validate correct milestone data', () => {
      const data = {
        title: 'Anniversary',
        milestone_date: '2024-06-15',
        milestone_type: 'anniversary',
        for_whom: 'both',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should require title', () => {
      const data = {
        milestone_date: '2024-06-15',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe('Title is required');
    });

    it('should reject empty title', () => {
      const data = {
        title: '   ',
        milestone_date: '2024-06-15',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe('Title is required');
    });

    it('should enforce title length limit', () => {
      const data = {
        title: 'A'.repeat(250),
        milestone_date: '2024-06-15',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(false);
      expect(result.errors.title).toContain('200 characters');
    });

    it('should require milestone date', () => {
      const data = {
        title: 'Anniversary',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(false);
      expect(result.errors.milestone_date).toBe('Date is required');
    });

    it('should validate date format', () => {
      const data = {
        title: 'Anniversary',
        milestone_date: 'invalid-date',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(false);
      expect(result.errors.milestone_date).toBe('Invalid date format');
    });

    it('should reject invalid milestone type', () => {
      const data = {
        title: 'Anniversary',
        milestone_date: '2024-06-15',
        milestone_type: 'invalid_type',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(false);
      expect(result.errors.milestone_type).toBe('Invalid milestone type');
    });

    it('should reject invalid for_whom value', () => {
      const data = {
        title: 'Anniversary',
        milestone_date: '2024-06-15',
        for_whom: 'invalid',
      };

      const result = validateMilestone(data);

      expect(result.valid).toBe(false);
      expect(result.errors.for_whom).toBe('Invalid "for whom" value');
    });
  });

  describe('validatePartnerMessage', () => {
    it('should validate correct message data', () => {
      const data = {
        title: 'Love Note',
        message_body: 'You are amazing!',
        reveal_trigger: 'manual',
      };

      const result = validatePartnerMessage(data);

      expect(result.valid).toBe(true);
    });

    it('should require title and message', () => {
      const data = {};

      const result = validatePartnerMessage(data);

      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe('Title is required');
      expect(result.errors.message_body).toBe('Message is required');
    });

    it('should require reveal date for specific_date trigger', () => {
      const data = {
        title: 'Scheduled Message',
        message_body: 'Read this later!',
        reveal_trigger: 'specific_date',
      };

      const result = validatePartnerMessage(data);

      expect(result.valid).toBe(false);
      expect(result.errors.reveal_date).toBe('Reveal date is required for scheduled messages');
    });

    it('should reject past reveal dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const data = {
        title: 'Message',
        message_body: 'Content',
        reveal_trigger: 'specific_date',
        reveal_date: pastDate.toISOString(),
      };

      const result = validatePartnerMessage(data);

      expect(result.valid).toBe(false);
      expect(result.errors.reveal_date).toBe('Reveal date must be in the future');
    });

    it('should enforce message length limit', () => {
      const data = {
        title: 'Long Message',
        message_body: 'A'.repeat(15000),
      };

      const result = validatePartnerMessage(data);

      expect(result.valid).toBe(false);
      expect(result.errors.message_body).toContain('10,000 characters');
    });
  });

  describe('validateChallenge', () => {
    it('should validate correct challenge data', () => {
      const data = {
        title: 'Complete 30 workouts',
        target_value: 30,
        reward_description: 'Dinner date!',
      };

      const result = validateChallenge(data);

      expect(result.valid).toBe(true);
    });

    it('should require title', () => {
      const data = {
        target_value: 10,
      };

      const result = validateChallenge(data);

      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe('Challenge title is required');
    });

    it('should reject zero or negative target value', () => {
      const data = {
        title: 'Challenge',
        target_value: 0,
      };

      const result = validateChallenge(data);

      expect(result.valid).toBe(false);
      expect(result.errors.target_value).toContain('greater than 0');
    });

    it('should reject unreasonably large target value', () => {
      const data = {
        title: 'Challenge',
        target_value: 2000000,
      };

      const result = validateChallenge(data);

      expect(result.valid).toBe(false);
      expect(result.errors.target_value).toContain('unreasonably large');
    });

    it('should reject past expiration dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const data = {
        title: 'Challenge',
        expiration_date: pastDate.toISOString(),
      };

      const result = validateChallenge(data);

      expect(result.valid).toBe(false);
      expect(result.errors.expiration_date).toBe('Expiration date must be in the future');
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTPS URL', () => {
      const result = validateUrl('https://example.com');

      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://example.com/');
    });

    it('should accept valid HTTP URL', () => {
      const result = validateUrl('http://example.com/path');

      expect(result.valid).toBe(true);
    });

    it('should reject javascript: URLs', () => {
      const result = validateUrl('javascript:alert(1)');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTP and HTTPS');
    });

    it('should reject file: URLs', () => {
      const result = validateUrl('file:///etc/passwd');

      expect(result.valid).toBe(false);
    });

    it('should reject invalid URL format', () => {
      const result = validateUrl('not a url');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });
  });
});
