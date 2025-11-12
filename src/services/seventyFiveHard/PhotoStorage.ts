/**
 * Photo Storage Implementation for Supabase
 *
 * Handles uploading, retrieving, and deleting progress photos.
 * Uses Supabase Storage with proper error handling and optimization.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../types/seventyFiveHard';
import { ChallengeError } from '../../types/seventyFiveHard';
import type { IPhotoStorage } from './ChallengeService';

export class SupabasePhotoStorage implements IPhotoStorage {
  private readonly BUCKET_NAME = '75hard-photos';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  private bucketChecked = false;

  constructor(private supabase: SupabaseClient) {
    // Don't call async functions in constructor
  }

  /**
   * Ensure the storage bucket exists (called on first upload)
   */
  private async ensureBucketExists(): Promise<void> {
    // Only check once per instance
    if (this.bucketChecked) return;

    try {
      // First, try to get bucket info (faster than listing all buckets)
      const { data, error } = await this.supabase.storage.getBucket(this.BUCKET_NAME);

      if (data) {
        // Bucket exists
        this.bucketChecked = true;
        return;
      }

      // Bucket doesn't exist, try to create it
      if (error?.message?.includes('not found') || !data) {
        const { error: createError } = await this.supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false, // Private bucket - requires authentication
          fileSizeLimit: this.MAX_FILE_SIZE,
          allowedMimeTypes: this.ALLOWED_TYPES,
        });

        if (createError) {
          // Bucket might already exist (race condition) or user lacks permission
          if (createError.message?.includes('already exists')) {
            console.log('[PhotoStorage] Bucket already exists');
          } else {
            console.warn('[PhotoStorage] Could not create bucket (might need manual setup):', createError.message);
          }
        }
      }

      this.bucketChecked = true;
    } catch (error) {
      console.error('[PhotoStorage] Failed to ensure bucket exists:', error);
      // Mark as checked to avoid repeated failures
      this.bucketChecked = true;
    }
  }

  /**
   * Upload a photo to Supabase Storage
   *
   * @param file - The image file to upload
   * @param path - Storage path (e.g., "75hard/user-id/challenge-id/day-1")
   * @returns Public URL or signed URL for the uploaded photo
   */
  async upload(file: File, path: string): Promise<Result<string>> {
    try {
      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          ok: false,
          error: new ChallengeError(
            `File size (${this.formatBytes(file.size)}) exceeds maximum allowed size (${this.formatBytes(this.MAX_FILE_SIZE)})`,
            'FILE_TOO_LARGE'
          ),
        };
      }

      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        return {
          ok: false,
          error: new ChallengeError(
            `File type ${file.type} is not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`,
            'INVALID_FILE_TYPE'
          ),
        };
      }

      // Generate unique filename with extension
      const extension = this.getFileExtension(file.name);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const filename = `${path}/${timestamp}-${randomString}${extension}`;

      // Optimize image if needed (convert HEIC, compress large files)
      const processedFile = await this.processImage(file);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filename, processedFile, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to upload photo: ${error.message}`,
            'UPLOAD_FAILED',
            error
          ),
        };
      }

      // Get public URL (for public buckets) or signed URL (for private buckets)
      const { data: urlData } = this.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      if (!urlData.publicUrl) {
        // Fallback to signed URL if public URL fails (for private buckets)
        const { data: signedData, error: signedError } = await this.supabase.storage
          .from(this.BUCKET_NAME)
          .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedError || !signedData) {
          return {
            ok: false,
            error: new ChallengeError(
              'Failed to generate photo URL',
              'URL_GENERATION_FAILED',
              signedError
            ),
          };
        }

        return { ok: true, value: signedData.signedUrl };
      }

      return { ok: true, value: urlData.publicUrl };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error during photo upload',
          'UPLOAD_ERROR',
          error
        ),
      };
    }
  }

  /**
   * Delete a photo from storage
   *
   * @param url - The URL of the photo to delete
   */
  async delete(url: string): Promise<Result<void>> {
    try {
      // Extract path from URL
      const path = this.extractPathFromUrl(url);
      if (!path) {
        return {
          ok: false,
          error: new ChallengeError('Invalid photo URL', 'INVALID_URL'),
        };
      }

      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to delete photo: ${error.message}`,
            'DELETE_FAILED',
            error
          ),
        };
      }

      return { ok: true, value: undefined };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error during photo deletion',
          'DELETE_ERROR',
          error
        ),
      };
    }
  }

  /**
   * Get a downloadable URL for a photo
   *
   * @param path - Storage path of the photo
   * @param expiresIn - Expiry time in seconds (default: 1 hour)
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<Result<string>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(path, expiresIn);

      if (error || !data) {
        return {
          ok: false,
          error: new ChallengeError(
            'Failed to generate signed URL',
            'SIGNED_URL_FAILED',
            error
          ),
        };
      }

      return { ok: true, value: data.signedUrl };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error generating signed URL',
          'SIGNED_URL_ERROR',
          error
        ),
      };
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Process image for optimization
   * - Convert HEIC to JPEG
   * - Compress large files
   * - Generate thumbnails (future enhancement)
   */
  private async processImage(file: File): Promise<File | Blob> {
    // For now, return original file
    // Future: Add image compression using canvas or sharp
    // Future: Generate thumbnails for faster loading
    return file;
  }

  /**
   * Extract storage path from full URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/object\/[^/]+\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return '.' + parts[parts.length - 1].toLowerCase();
    }
    return '.jpg'; // Default extension
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * In-memory photo storage for testing/development
 */
export class InMemoryPhotoStorage implements IPhotoStorage {
  private photos = new Map<string, string>();

  async upload(file: File, path: string): Promise<Result<string>> {
    // Create a fake URL
    const url = `memory://${path}/${file.name}`;

    // Store file as data URL (not efficient, but works for testing)
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = () => {
        this.photos.set(url, reader.result as string);
        resolve({ ok: true, value: url });
      };
      reader.onerror = () => {
        resolve({
          ok: false,
          error: new ChallengeError('Failed to read file', 'FILE_READ_ERROR'),
        });
      };
      reader.readAsDataURL(file);
    });
  }

  async delete(url: string): Promise<Result<void>> {
    this.photos.delete(url);
    return { ok: true, value: undefined };
  }

  async getSignedUrl(path: string): Promise<Result<string>> {
    return { ok: true, value: `memory://${path}` };
  }

  // Test helper
  getStoredPhoto(url: string): string | undefined {
    return this.photos.get(url);
  }
}
