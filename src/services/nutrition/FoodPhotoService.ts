/**
 * Food Photo Service
 * Handles photo upload to Supabase Storage and AI-powered nutrition analysis
 */

import { supabase } from '@/lib/supabase';
import { smartChat } from '@/lib/providers/factory';
import { logger } from '@/services/logger';
import type { Message } from '@/lib/providers/interfaces';

// ============================================================================
// Types
// ============================================================================

export interface NutritionEstimate {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  serving_size?: string;
  confidence: number; // 0.0 - 1.0
}

export interface FoodAnalysisResult {
  items: NutritionEstimate[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  description: string;
  confidence: number;
}

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
      const messages: Message[] = [
        {
          role: 'system',
          content: `You are a nutrition expert analyzing food photos. Identify all food items visible and estimate their nutritional content.

Respond in JSON format ONLY with this exact structure:
{
  "items": [
    {
      "name": "food item name",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number (optional),
      "serving_size": "estimated portion size",
      "confidence": number between 0.0 and 1.0
    }
  ],
  "description": "brief description of what you see",
  "confidence": overall confidence between 0.0 and 1.0
}

Be conservative with estimates. If uncertain, use lower confidence scores.`,
        },
        {
          role: 'user',
          content: `Analyze this food photo and estimate the nutrition:\n\n[Image: ${imageDataUrl.substring(0, 100)}...]`,
        },
      ];

      const response = await smartChat(messages, {
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Parse the JSON response
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]) as FoodAnalysisResult;

      // Calculate totals
      const totals = parsed.items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein_g,
          carbs: acc.carbs + item.carbs_g,
          fat: acc.fat + item.fat_g,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      logger.info('FoodPhotoService', 'Photo analyzed', {
        itemCount: parsed.items.length,
        totalCalories: totals.calories,
        confidence: parsed.confidence,
      });

      return {
        ...parsed,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
      };
    } catch (error) {
      logger.error('FoodPhotoService', 'Failed to analyze photo', { error });
      throw error;
    }
  }
}

export const foodPhotoService = new FoodPhotoService();

