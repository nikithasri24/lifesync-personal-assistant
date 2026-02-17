/**
 * Together Feature Input Validation and Sanitization
 * Prevents XSS, validates file uploads, sanitizes user input
 */

import DOMPurify from 'isomorphic-dompurify';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/services/logger';

// =====================================================
// FILE UPLOAD VALIDATION
// =====================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] as const;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav'] as const;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

/**
 * Validate image file for photo uploads
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    logger.warn('Together', 'Invalid image file type rejected', { type: file.type });
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    logger.warn('Together', 'Image file too large', { size: file.size, maxSize: MAX_IMAGE_SIZE });
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum (${MAX_IMAGE_SIZE / 1024 / 1024} MB)`,
    };
  }

  // Sanitize filename (remove special characters, prevent path traversal)
  const sanitizedName = sanitizeFilename(file.name);

  return {
    valid: true,
    sanitizedName,
  };
}

/**
 * Validate video file
 */
export function validateVideoFile(file: File): FileValidationResult {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type as typeof ALLOWED_VIDEO_TYPES[number])) {
    return {
      valid: false,
      error: `Invalid video type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video size exceeds maximum (${MAX_VIDEO_SIZE / 1024 / 1024} MB)`,
    };
  }

  return {
    valid: true,
    sanitizedName: sanitizeFilename(file.name),
  };
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): FileValidationResult {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type as typeof ALLOWED_AUDIO_TYPES[number])) {
    return {
      valid: false,
      error: `Invalid audio type. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_AUDIO_SIZE) {
    return {
      valid: false,
      error: `Audio size exceeds maximum (${MAX_AUDIO_SIZE / 1024 / 1024} MB)`,
    };
  }

  return {
    valid: true,
    sanitizedName: sanitizeFilename(file.name),
  };
}

/**
 * Sanitize filename to prevent path traversal and special characters
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  const nameOnly = filename.split('/').pop()?.split('\\').pop() || 'file';

  // Remove special characters except dots, dashes, underscores
  const sanitized = nameOnly.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Ensure it's not empty
  return sanitized || `file_${Date.now()}`;
}

// =====================================================
// TEXT INPUT SANITIZATION
// =====================================================

/**
 * Sanitize HTML/Markdown content to prevent XSS
 * Allows safe HTML tags for rich text formatting
 */
export function sanitizeMessageBody(content: string): string {
  // Configure DOMPurify to allow safe formatting tags
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'a', // Links allowed but href will be sanitized
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
  };

  const sanitized = DOMPurify.sanitize(content, config);

  // Log if content was modified (potential XSS attempt)
  if (sanitized !== content) {
    logger.warn('Together', 'Message content sanitized (potential XSS)', {
      originalLength: content.length,
      sanitizedLength: sanitized.length,
    });
  }

  return sanitized;
}

/**
 * Sanitize plain text (strip all HTML)
 */
export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize title/subject lines (plain text only, limited length)
 */
export function sanitizeTitle(title: string, maxLength: number = 200): string {
  const plain = sanitizePlainText(title);
  return plain.slice(0, maxLength).trim();
}

// =====================================================
// FORM VALIDATION
// =====================================================

export interface MilestoneValidation {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate milestone form data
 */
export function validateMilestone(data: {
  title?: string;
  milestone_date?: string;
  milestone_type?: string;
  for_whom?: string;
}): MilestoneValidation {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.length > 200) {
    errors.title = 'Title must be 200 characters or less';
  }

  // Date validation
  if (!data.milestone_date) {
    errors.milestone_date = 'Date is required';
  } else {
    const date = new Date(data.milestone_date);
    if (isNaN(date.getTime())) {
      errors.milestone_date = 'Invalid date format';
    }
  }

  // Type validation
  const validTypes = ['birthday', 'anniversary', 'first_date', 'move_in', 'engagement', 'wedding', 'custom'];
  if (data.milestone_type && !validTypes.includes(data.milestone_type)) {
    errors.milestone_type = 'Invalid milestone type';
  }

  // For whom validation
  const validForWhom = ['me', 'partner', 'both'];
  if (data.for_whom && !validForWhom.includes(data.for_whom)) {
    errors.for_whom = 'Invalid "for whom" value';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate partner message form data
 */
export function validatePartnerMessage(data: {
  title?: string;
  message_body?: string;
  reveal_trigger?: string;
  reveal_date?: string;
}): MilestoneValidation {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.length > 200) {
    errors.title = 'Title must be 200 characters or less';
  }

  // Message body validation
  if (!data.message_body || data.message_body.trim().length === 0) {
    errors.message_body = 'Message is required';
  } else if (data.message_body.length > 10000) {
    errors.message_body = 'Message must be 10,000 characters or less';
  }

  // Reveal trigger validation
  const validTriggers = ['first_login', 'specific_date', 'achievement', 'manual'];
  if (data.reveal_trigger && !validTriggers.includes(data.reveal_trigger)) {
    errors.reveal_trigger = 'Invalid reveal trigger';
  }

  // Reveal date validation (required for specific_date trigger)
  if (data.reveal_trigger === 'specific_date') {
    if (!data.reveal_date) {
      errors.reveal_date = 'Reveal date is required for scheduled messages';
    } else {
      const date = new Date(data.reveal_date);
      if (isNaN(date.getTime())) {
        errors.reveal_date = 'Invalid date format';
      } else if (date < new Date()) {
        errors.reveal_date = 'Reveal date must be in the future';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate challenge/achievement reward form data
 */
export function validateChallenge(data: {
  title?: string;
  target_value?: number;
  reward_description?: string;
  expiration_date?: string;
}): MilestoneValidation {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Challenge title is required';
  } else if (data.title.length > 200) {
    errors.title = 'Title must be 200 characters or less';
  }

  // Target value validation
  if (data.target_value !== undefined) {
    if (data.target_value <= 0) {
      errors.target_value = 'Target value must be greater than 0';
    } else if (data.target_value > 1000000) {
      errors.target_value = 'Target value is unreasonably large';
    }
  }

  // Reward description validation
  if (data.reward_description && data.reward_description.length > 1000) {
    errors.reward_description = 'Reward description must be 1,000 characters or less';
  }

  // Expiration date validation (optional, but must be valid if provided)
  if (data.expiration_date) {
    const date = new Date(data.expiration_date);
    if (isNaN(date.getTime())) {
      errors.expiration_date = 'Invalid date format';
    } else if (date < new Date()) {
      errors.expiration_date = 'Expiration date must be in the future';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// =====================================================
// URL VALIDATION
// =====================================================

/**
 * Validate and sanitize URLs
 */
export function validateUrl(url: string): { valid: boolean; sanitized?: string; error?: string } {
  try {
    const parsed = new URL(url);

    // Only allow https and http protocols
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS URLs are allowed',
      };
    }

    return {
      valid: true,
      sanitized: parsed.toString(),
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}
