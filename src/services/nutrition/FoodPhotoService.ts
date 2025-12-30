/**
 * Food Photo Service
 * Handles photo upload to Supabase Storage and AI-powered nutrition analysis
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { nutritionAnalyzer, type FoodAnalysisResult, type NutritionEstimate } from './NutritionAnalyzer';

// ============================================================================
// Types
// ============================================================================

export type { NutritionEstimate, FoodAnalysisResult };

const FOOD_PHOTOS_BUCKET = 'food-photos';

// ============================================================================
// Food Photo Service
// ============================================================================

class FoodPhotoService {
  /**
   * Upload food photo to Supabase Storage
   * Returns the public URL of the uploaded image
   */
  async uploadPhoto(file: File | Blob, userId: string): Promise<string> {
    const timestamp = Date.now();
    const extension = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
    const filePath = `${userId}/${timestamp}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(FOOD_PHOTOS_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      logger.error('FoodPhotoService', 'Failed to upload photo', { error: uploadError });
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(FOOD_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    logger.info('FoodPhotoService', 'Photo uploaded', { path: filePath });
    return urlData.publicUrl;
  }

  /**
   * Convert data URL (from camera capture) to Blob
   */
  dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  /**
   * Analyze food photo using AI vision model
   * Returns estimated nutrition information
   */
  async analyzePhoto(imageDataUrl: string): Promise<FoodAnalysisResult> {
    try {
      const result = await nutritionAnalyzer.analyzePhoto(imageDataUrl);
      logger.info('FoodPhotoService', 'Photo analyzed', {
        itemCount: result.items.length,
        totalCalories: result.totalCalories,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      logger.error('FoodPhotoService', 'Failed to analyze photo', { error });
      throw error;
    }
  }
}

export const foodPhotoService = new FoodPhotoService();
