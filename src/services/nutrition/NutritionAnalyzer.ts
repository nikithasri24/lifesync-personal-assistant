/**
 * Nutrition Analyzer
 * Vision-first nutrition estimation with OpenFoodFacts enrichment.
 */

import Groq from 'groq-sdk';
import { z } from 'zod';
import { logger } from '@/services/logger';
import { openFoodFactsService } from './OpenFoodFactsService';

export type NutritionSource = 'vision' | 'openfoodfacts';

export interface NutritionEstimate {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  serving_size?: string;
  confidence: number; // 0.0 - 1.0
  estimated_grams?: number;
  brand?: string;
  packaged?: boolean;
  count?: number;
  source: NutritionSource;
  matchConfidence?: number;
  matchedProduct?: {
    name: string;
    brand?: string;
    barcode: string;
    servingSize?: string;
  };
  matchedNutrition?: {
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  };
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

const GROQ_API_KEY =
  (import.meta.env.GROQ_API_KEY as string | undefined) ??
  (import.meta.env.VITE_GROQ_API_KEY as string | undefined);
const VISION_MODEL =
  (import.meta.env.VITE_GROQ_VISION_MODEL as string | undefined) ??
  'llama-3.2-11b-vision-preview';

const VisionSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      brand: z.string().optional(),
      estimated_grams: z.number().optional(),
      calories: z.number(),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
      fiber_g: z.number().optional(),
      serving_size: z.string().optional(),
      packaged: z.boolean().optional(),
      confidence: z.number().min(0).max(1),
    })
  ),
  description: z.string(),
  confidence: z.number().min(0).max(1),
});

class NutritionAnalyzer {
  private client?: Groq;

  private getClient(): Groq {
    if (!this.client) {
      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
      }
      this.client = new Groq({
        apiKey: GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    }
    return this.client;
  }

  async analyzePhoto(imageDataUrl: string): Promise<FoodAnalysisResult> {
    const vision = await this.runVisionModel(imageDataUrl);
    const deduped = this.mergeSimilarItems(vision.items);
    const items = await this.enrichWithOpenFoodFacts(deduped);

    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories * (item.count ?? 1),
        protein: acc.protein + item.protein_g * (item.count ?? 1),
        carbs: acc.carbs + item.carbs_g * (item.count ?? 1),
        fat: acc.fat + item.fat_g * (item.count ?? 1),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      items,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      description: vision.description,
      confidence: vision.confidence,
    };
  }

  private async runVisionModel(imageDataUrl: string): Promise<z.infer<typeof VisionSchema>> {
    const messages = [
      {
        role: 'system',
        content: `You are a nutrition expert analyzing food photos.
Identify all food items visible and estimate their nutrition and portion size.

Respond in JSON ONLY with this exact structure:
{
  "items": [
    {
      "name": "food item name",
      "brand": "brand if visible",
      "estimated_grams": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number (optional),
      "serving_size": "estimated portion size",
      "packaged": boolean,
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
        content: [
          { type: 'text', text: 'Analyze this food photo and estimate nutrition.' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ];

    const response = await this.getClient().chat.completions.create({
      model: VISION_MODEL,
      messages: messages as unknown as Groq.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content ?? '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse vision response as JSON');
    }

    const parsed = VisionSchema.parse(JSON.parse(jsonMatch[0]));
    return parsed;
  }

  private async enrichWithOpenFoodFacts(
    items: z.infer<typeof VisionSchema>['items']
  ): Promise<NutritionEstimate[]> {
    const results = await Promise.all(
      items.map(async (item) => {
        if (!item.packaged) {
          return {
            ...item,
            source: 'vision' as const,
          };
        }

        try {
          const query = `${item.brand ?? ''} ${item.name}`.trim();
          if (!query) {
            return { ...item, source: 'vision' as const };
          }

          const { products } = await openFoodFactsService.searchProducts(query);
          const match = products[0];
          if (!match || match.caloriesPer100g <= 0) {
            return { ...item, source: 'vision' as const };
          }
          const matchConfidence = this.scoreMatch(item, match);
          if (matchConfidence < 0.3) {
            return { ...item, source: 'vision' as const };
          }

          return {
            ...item,
            source: 'vision' as const,
            matchConfidence,
            matchedProduct: {
              name: match.name,
              brand: match.brand,
              barcode: match.barcode,
              servingSize: match.servingSize,
            },
            matchedNutrition: {
              caloriesPer100g: match.caloriesPer100g,
              proteinPer100g: match.proteinPer100g,
              carbsPer100g: match.carbsPer100g,
              fatPer100g: match.fatPer100g,
            },
          };
        } catch (error) {
          logger.warn('NutritionAnalyzer', 'OpenFoodFacts enrichment failed', { error });
          return {
            ...item,
            source: 'vision' as const,
          };
        }
      })
    );

    return results;
  }

  private mergeSimilarItems(
    items: z.infer<typeof VisionSchema>['items']
  ): z.infer<typeof VisionSchema>['items'] {
    const merged = new Map<string, z.infer<typeof VisionSchema>['items'][number] & { count: number }>();

    for (const item of items) {
      const key = `${item.brand ?? ''}|${item.name}`.trim().toLowerCase();
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { ...item, count: 1 });
        continue;
      }

      merged.set(key, {
        ...existing,
        calories: (existing.calories + item.calories) / (existing.count + 1),
        protein_g: (existing.protein_g + item.protein_g) / (existing.count + 1),
        carbs_g: (existing.carbs_g + item.carbs_g) / (existing.count + 1),
        fat_g: (existing.fat_g + item.fat_g) / (existing.count + 1),
        fiber_g: ((existing.fiber_g ?? 0) + (item.fiber_g ?? 0)) / (existing.count + 1),
        estimated_grams: ((existing.estimated_grams ?? 0) + (item.estimated_grams ?? 0)) / (existing.count + 1),
        packaged: existing.packaged || item.packaged,
        confidence: Math.max(existing.confidence, item.confidence),
        count: existing.count + 1,
      });
    }

    return Array.from(merged.values());
  }

  private scoreMatch(
    item: z.infer<typeof VisionSchema>['items'][number],
    match: { name: string; brand?: string }
  ): number {
    const itemTokens = new Set(item.name.toLowerCase().split(/\s+/).filter(Boolean));
    const matchTokens = new Set(match.name.toLowerCase().split(/\s+/).filter(Boolean));
    const overlap = [...itemTokens].filter((token) => matchTokens.has(token)).length;
    const union = new Set([...itemTokens, ...matchTokens]).size || 1;
    const baseScore = overlap / union;
    const brandBoost = item.brand && match.brand && item.brand.toLowerCase() === match.brand.toLowerCase() ? 0.2 : 0;
    return Math.min(1, baseScore + brandBoost);
  }
}

export const nutritionAnalyzer = new NutritionAnalyzer();
