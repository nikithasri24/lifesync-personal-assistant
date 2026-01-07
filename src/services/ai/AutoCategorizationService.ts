/**
 * Auto-Categorization Service
 * AI-powered automatic categorization for tasks, expenses, and notes
 */

import { logger } from '@/services/logger';

export type CategorizableType = 'task' | 'expense' | 'note' | 'inbox_item';

export interface CategorizationResult {
  category: string;
  confidence: number; // 0-1
  subcategory?: string;
  tags?: string[];
  reasoning?: string;
}

// Task categories
const TASK_CATEGORIES = [
  'work', 'personal', 'shopping', 'errands', 'health', 'finance',
  'home', 'family', 'social', 'learning', 'creative', 'admin'
] as const;

// Expense categories
const EXPENSE_CATEGORIES = [
  'food', 'transportation', 'utilities', 'entertainment', 'shopping',
  'health', 'education', 'subscriptions', 'housing', 'travel', 'gifts', 'other'
] as const;

// Note categories
const NOTE_CATEGORIES = [
  'idea', 'reminder', 'reference', 'journal', 'meeting', 'project', 'personal'
] as const;

// Keyword mappings for rule-based categorization
const TASK_KEYWORDS: Record<string, string[]> = {
  shopping: ['buy', 'purchase', 'order', 'shop', 'groceries', 'amazon', 'store', 'mall'],
  errands: ['pick up', 'drop off', 'return', 'mail', 'post office', 'bank', 'pharmacy'],
  health: ['doctor', 'dentist', 'gym', 'workout', 'exercise', 'medicine', 'appointment', 'therapy'],
  work: ['meeting', 'email', 'report', 'presentation', 'deadline', 'project', 'client', 'boss'],
  home: ['clean', 'fix', 'repair', 'organize', 'laundry', 'dishes', 'vacuum', 'garden'],
  finance: ['pay', 'bill', 'budget', 'tax', 'invoice', 'expense', 'bank', 'transfer'],
  family: ['kids', 'school', 'parent', 'mom', 'dad', 'husband', 'wife', 'family'],
  social: ['call', 'text', 'birthday', 'party', 'dinner', 'lunch', 'friend', 'visit'],
  learning: ['read', 'study', 'course', 'learn', 'practice', 'book', 'tutorial'],
  creative: ['write', 'draw', 'design', 'create', 'art', 'music', 'photo'],
  admin: ['renew', 'update', 'cancel', 'schedule', 'book', 'register', 'apply'],
};

const EXPENSE_KEYWORDS: Record<string, string[]> = {
  food: ['restaurant', 'grocery', 'coffee', 'lunch', 'dinner', 'breakfast', 'uber eats', 'doordash', 'starbucks', 'mcdonalds'],
  transportation: ['gas', 'uber', 'lyft', 'parking', 'toll', 'metro', 'bus', 'train', 'shell', 'chevron', 'exxon'],
  utilities: ['electric', 'water', 'gas bill', 'internet', 'phone', 'verizon', 'att', 'comcast'],
  entertainment: ['netflix', 'spotify', 'movie', 'concert', 'game', 'hulu', 'disney', 'hbo'],
  shopping: ['amazon', 'target', 'walmart', 'costco', 'clothing', 'shoes', 'electronics'],
  health: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'insurance', 'gym'],
  subscriptions: ['subscription', 'monthly', 'annual', 'membership', 'premium'],
  housing: ['rent', 'mortgage', 'hoa', 'maintenance', 'furniture', 'home depot', 'lowes'],
  travel: ['hotel', 'airbnb', 'flight', 'airline', 'vacation', 'booking'],
  gifts: ['gift', 'present', 'birthday gift', 'christmas', 'wedding'],
};

class AutoCategorizationService {
  /**
   * Categorize content based on type
   */
  categorize(content: string, type: CategorizableType): CategorizationResult {
    const normalizedContent = content.toLowerCase().trim();

    switch (type) {
      case 'task':
        return this.categorizeTask(normalizedContent);
      case 'expense':
        return this.categorizeExpense(normalizedContent);
      case 'note':
      case 'inbox_item':
        return this.categorizeNote(normalizedContent);
      default:
        return { category: 'other', confidence: 0.3 };
    }
  }

  /**
   * Categorize a task
   */
  private categorizeTask(content: string): CategorizationResult {
    let bestMatch = { category: 'personal', score: 0 };

    for (const [category, keywords] of Object.entries(TASK_KEYWORDS)) {
      const matchCount = keywords.filter(kw => content.includes(kw)).length;
      const score = matchCount / keywords.length;

      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    // Generate tags from matched keywords
    const tags: string[] = [];
    for (const [category, keywords] of Object.entries(TASK_KEYWORDS)) {
      keywords.forEach(kw => {
        if (content.includes(kw) && !tags.includes(kw)) {
          tags.push(kw);
        }
      });
    }

    return {
      category: bestMatch.category,
      confidence: Math.min(0.9, bestMatch.score * 2 + 0.3),
      tags: tags.slice(0, 5),
    };
  }

  /**
   * Categorize an expense
   */
  private categorizeExpense(content: string): CategorizationResult {
    let bestMatch = { category: 'other', score: 0 };

    for (const [category, keywords] of Object.entries(EXPENSE_KEYWORDS)) {
      const matchCount = keywords.filter(kw => content.includes(kw)).length;
      const score = matchCount / keywords.length;

      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    return {
      category: bestMatch.category,
      confidence: Math.min(0.95, bestMatch.score * 2 + 0.4),
    };
  }

  /**
   * Categorize a note or inbox item
   */
  private categorizeNote(content: string): CategorizationResult {
    // Simple heuristics for notes
    if (content.includes('idea') || content.includes('what if')) {
      return { category: 'idea', confidence: 0.7 };
    }
    if (content.includes('remind') || content.includes('don\'t forget')) {
      return { category: 'reminder', confidence: 0.8 };
    }
    if (content.includes('meeting') || content.includes('discussed')) {
      return { category: 'meeting', confidence: 0.7 };
    }
    if (content.includes('feel') || content.includes('today i')) {
      return { category: 'journal', confidence: 0.6 };
    }

    return { category: 'reference', confidence: 0.4 };
  }

  /**
   * Suggest priority based on content
   */
  suggestPriority(content: string): 'high' | 'medium' | 'low' {
    const normalizedContent = content.toLowerCase();

    const urgentKeywords = ['urgent', 'asap', 'immediately', 'today', 'now', 'critical', 'emergency'];
    const highKeywords = ['important', 'deadline', 'due', 'must', 'need to', 'required'];
    const lowKeywords = ['someday', 'maybe', 'when possible', 'eventually', 'nice to have'];

    if (urgentKeywords.some(kw => normalizedContent.includes(kw))) {
      return 'high';
    }
    if (highKeywords.some(kw => normalizedContent.includes(kw))) {
      return 'high';
    }
    if (lowKeywords.some(kw => normalizedContent.includes(kw))) {
      return 'low';
    }

    return 'medium';
  }
}

export const autoCategorizationService = new AutoCategorizationService();

