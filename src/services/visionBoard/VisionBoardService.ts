/**
 * Vision Board Service
 * Manages visual goal representation and inspiration images
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import {
  getUserLifeDreams,
  updateLifeDream,
} from '@/goals/api/lifeGoalsAPI';
import type { LifeDream } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';

// ============================================================================
// Types
// ============================================================================

export interface VisionBoardItem {
  id: string;
  type: 'dream' | 'goal';
  title: string;
  description?: string;
  category: string;
  images: string[];
  notes?: string;
  status: string;
  priority?: string;
  target_date?: string;
  created_at: string;
}

export interface VisionBoardCategory {
  name: string;
  items: VisionBoardItem[];
  color: string;
}

// ============================================================================
// Vision Board Service
// ============================================================================

class VisionBoardService {
  /**
   * Get all vision board items (dreams with images)
   */
  async getVisionBoard(userId: string): Promise<VisionBoardItem[]> {
    try {
      const dreams = await getUserLifeDreams();

      // Filter for dreams with vision board images
      const dreamsWithImages = dreams.filter(dream =>
        dream.visionBoardImages && dream.visionBoardImages.length > 0
      );

      return dreamsWithImages.map(dream => ({
        id: dream.id,
        type: 'dream' as const,
        title: dream.title,
        description: dream.description,
        category: dream.category || 'other',
        images: dream.visionBoardImages || [],
        notes: dream.visionBoardNotes,
        status: dream.status,
        priority: dream.priority,
        target_date: dream.estimatedTimeframe,
        created_at: dream.createdAt,
      }));
    } catch (error) {
      logger.error('VisionBoardService', 'Failed to get vision board', { error });
      return [];
    }
  }

  /**
   * Get vision board organized by category
   */
  async getVisionBoardByCategory(userId: string): Promise<VisionBoardCategory[]> {
    const items = await this.getVisionBoard(userId);

    const categoryColors: Record<string, string> = {
      career: '#3b82f6',
      health: '#10b981',
      relationships: '#ec4899',
      finance: '#f59e0b',
      travel: '#8b5cf6',
      personal: '#6366f1',
      education: '#14b8a6',
      lifestyle: '#f97316',
      other: '#6b7280',
    };

    const grouped = items.reduce((acc, item) => {
      const cat = item.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, VisionBoardItem[]>);

    return Object.entries(grouped).map(([name, items]) => ({
      name,
      items,
      color: categoryColors[name] || categoryColors.other,
    }));
  }

  /**
   * Add image to a dream's vision board
   */
  async addImage(dreamId: string, imageUrl: string): Promise<boolean> {
    try {
      // Get all dreams to find the current one
      const dreams = await getUserLifeDreams();
      const dream = dreams.find(d => d.id === dreamId);

      if (!dream) {
        logger.error('VisionBoardService', 'Dream not found', { dreamId });
        return false;
      }

      const currentImages = dream.visionBoardImages || [];
      await updateLifeDream(dreamId, {
        visionBoardImages: [...currentImages, imageUrl],
      });

      logger.info('VisionBoardService', 'Image added to vision board', { dreamId });
      return true;
    } catch (error) {
      logger.error('VisionBoardService', 'Failed to add image', { error });
      return false;
    }
  }

  /**
   * Remove image from a dream's vision board
   */
  async removeImage(dreamId: string, imageUrl: string): Promise<boolean> {
    try {
      // Get all dreams to find the current one
      const dreams = await getUserLifeDreams();
      const dream = dreams.find(d => d.id === dreamId);

      if (!dream) {
        logger.error('VisionBoardService', 'Dream not found', { dreamId });
        return false;
      }

      const currentImages = dream.visionBoardImages || [];
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl);

      await updateLifeDream(dreamId, {
        visionBoardImages: updatedImages,
      });

      return true;
    } catch (error) {
      logger.error('VisionBoardService', 'Failed to remove image', { error });
      return false;
    }
  }

  /**
   * Update vision board notes for a dream
   */
  async updateNotes(dreamId: string, notes: string): Promise<boolean> {
    try {
      await updateLifeDream(dreamId, {
        visionBoardNotes: notes,
      });
      return true;
    } catch (error) {
      logger.error('VisionBoardService', 'Failed to update notes', { error });
      return false;
    }
  }

  /**
   * Get vision board summary for AI
   */
  async getSummary(userId: string): Promise<{
    totalItems: number;
    categories: string[];
    topPriorities: VisionBoardItem[];
    recentlyAdded: VisionBoardItem[];
  }> {
    const items = await this.getVisionBoard(userId);

    const categories = [...new Set(items.map(i => i.category))];
    const topPriorities = items
      .filter(i => i.priority === 'this-year' || i.priority === 'within-2-years')
      .slice(0, 5);
    const recentlyAdded = items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      totalItems: items.length,
      categories,
      topPriorities,
      recentlyAdded,
    };
  }
}

export const visionBoardService = new VisionBoardService();

