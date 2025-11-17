/**
 * Smart Transaction Categorization Engine
 *
 * Zero-cost automatic categorization using:
 * - Rule-based matching
 * - Fuzzy merchant matching
 * - User learning patterns
 * - Historical transaction analysis
 *
 * Target: 85%+ accuracy without AI APIs
 */

import { supabase } from '../../../lib/supabase';
import {
  normalizeMerchantName,
  similarity,
  fuzzyContains,
  isSameMerchant,
  calculateConfidence
} from '../../utils/fuzzyMatch';

// ============================================================================
// Types
// ============================================================================

export interface CategorizationRule {
  id: string;
  userId: string;
  merchantPattern: string;
  descriptionKeywords: string[];
  amountMin?: number;
  amountMax?: number;
  categoryId: string;
  confidence: number;
  priority: number;
  ruleType: 'user_created' | 'system' | 'learned';
  usageCount: number;
  successCount: number;
  failureCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantData {
  id: string;
  merchantName: string;
  aliases: string[];
  defaultCategoryName: string;
  defaultSubcategory?: string;
  merchantType?: string;
  confidence: number;
}

export interface Transaction {
  id?: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: string;
  merchantName?: string;
  confidenceScore?: number;
  suggestedCategoryId?: string;
  categorizationRuleId?: string;
}

export interface CategorizationResult {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number;
  merchantName: string | null;
  ruleId: string | null;
  reasoning: string;
}

// ============================================================================
// Categorization Engine
// ============================================================================

export class CategorizationEngine {
  private userId: string;
  private userRulesCache: CategorizationRule[] | null = null;
  private merchantDbCache: Map<string, MerchantData> | null = null;
  private categoryCache: Map<string, { id: string; name: string }> | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Categorize a single transaction
   * Returns suggested category with confidence score
   */
  async categorize(transaction: Transaction): Promise<CategorizationResult> {
    // Extract merchant name from description
    const merchantName = normalizeMerchantName(transaction.description);

    // Try categorization strategies in order of priority
    const strategies = [
      () => this.categorizeByUserRules(transaction, merchantName),
      () => this.categorizeByMerchantDatabase(transaction, merchantName),
      () => this.categorizeByHistoricalPatterns(transaction, merchantName),
      () => this.categorizeByKeywords(transaction)
    ];

    for (const strategy of strategies) {
      const result = await strategy();
      if (result && result.confidence >= 0.4) {
        // Found a match with acceptable confidence
        return result;
      }
    }

    // No match found
    return {
      categoryId: null,
      categoryName: null,
      confidence: 0,
      merchantName,
      ruleId: null,
      reasoning: 'No matching pattern found'
    };
  }

  /**
   * Bulk categorize multiple transactions
   * Optimized for performance with caching
   */
  async categorizeBulk(transactions: Transaction[]): Promise<Map<string, CategorizationResult>> {
    // Preload caches
    await this.loadUserRules();
    await this.loadMerchantDatabase();
    await this.loadCategories();

    const results = new Map<string, CategorizationResult>();

    for (const txn of transactions) {
      // Skip if already categorized
      if (txn.categoryId) {
        continue;
      }

      const result = await this.categorize(txn);
      if (txn.id) {
        results.set(txn.id, result);
      }
    }

    return results;
  }

  /**
   * Learn from user correction
   * Creates or updates a rule based on user's manual categorization
   */
  async learnFromCorrection(
    transaction: Transaction,
    correctCategoryId: string
  ): Promise<void> {
    const merchantName = normalizeMerchantName(transaction.description);

    // Check if rule already exists for this merchant
    const { data: existingRules } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('user_id', this.userId)
      .eq('merchant_pattern', merchantName)
      .limit(1);

    if (existingRules && existingRules.length > 0) {
      // Update existing rule
      const rule = existingRules[0];
      await supabase
        .from('categorization_rules')
        .update({
          category_id: correctCategoryId,
          success_count: rule.success_count + 1,
          confidence: Math.min(1.0, rule.confidence + 0.05),
          updated_at: new Date().toISOString()
        })
        .eq('id', rule.id);
    } else {
      // Create new rule
      await supabase.from('categorization_rules').insert({
        user_id: this.userId,
        merchant_pattern: merchantName,
        category_id: correctCategoryId,
        confidence: 1.0, // User-created rules start at 100% confidence
        priority: 100, // User rules have highest priority
        rule_type: 'learned'
      });
    }

    // Invalidate cache
    this.userRulesCache = null;
  }

  /**
   * Create custom user rule
   */
  async createRule(rule: {
    merchantPattern: string;
    categoryId: string;
    descriptionKeywords?: string[];
    amountMin?: number;
    amountMax?: number;
  }): Promise<void> {
    await supabase.from('categorization_rules').insert({
      user_id: this.userId,
      merchant_pattern: rule.merchantPattern,
      category_id: rule.categoryId,
      description_keywords: rule.descriptionKeywords || [],
      amount_min: rule.amountMin,
      amount_max: rule.amountMax,
      confidence: 1.0,
      priority: 100,
      rule_type: 'user_created'
    });

    // Invalidate cache
    this.userRulesCache = null;
  }

  // =========================================================================
  // Private Methods - Categorization Strategies
  // =========================================================================

  /**
   * Strategy 1: Match against user's custom rules
   * Highest priority - user explicitly taught the system
   */
  private async categorizeByUserRules(
    transaction: Transaction,
    merchantName: string
  ): Promise<CategorizationResult | null> {
    const rules = await this.loadUserRules();

    // Sort by priority and confidence
    const sortedRules = [...rules].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.confidence - a.confidence;
    });

    for (const rule of sortedRules) {
      // Check merchant pattern match
      if (isSameMerchant(merchantName, rule.merchantPattern, 0.8)) {
        // Check amount range if specified
        if (rule.amountMin !== undefined && transaction.amount < rule.amountMin) {
          continue;
        }
        if (rule.amountMax !== undefined && transaction.amount > rule.amountMax) {
          continue;
        }

        // Check description keywords if specified
        if (rule.descriptionKeywords && rule.descriptionKeywords.length > 0) {
          const matchesKeywords = rule.descriptionKeywords.some(keyword =>
            fuzzyContains(transaction.description, keyword, 0.8)
          );
          if (!matchesKeywords) {
            continue;
          }
        }

        // Match found!
        const category = await this.getCategoryById(rule.categoryId);
        return {
          categoryId: rule.categoryId,
          categoryName: category?.name || null,
          confidence: rule.confidence,
          merchantName,
          ruleId: rule.id,
          reasoning: `Matched user rule: "${rule.merchantPattern}"`
        };
      }
    }

    return null;
  }

  /**
   * Strategy 2: Match against system merchant database
   * Pre-populated database of common merchants
   */
  private async categorizeByMerchantDatabase(
    transaction: Transaction,
    merchantName: string
  ): Promise<CategorizationResult | null> {
    const merchantDb = await this.loadMerchantDatabase();

    // Try to find best merchant match
    let bestMatch: { merchant: MerchantData; score: number } | null = null;

    for (const merchant of merchantDb.values()) {
      // Check main merchant name
      let score = similarity(merchantName, merchant.merchantName);

      // Check aliases
      for (const alias of merchant.aliases) {
        const aliasScore = similarity(merchantName, alias);
        score = Math.max(score, aliasScore);
      }

      if (score > (bestMatch?.score || 0.6)) {
        bestMatch = { merchant, score };
      }
    }

    if (!bestMatch) {
      return null;
    }

    // Find category by name
    const category = await this.getCategoryByName(bestMatch.merchant.defaultCategoryName);
    if (!category) {
      return null;
    }

    const confidence = calculateConfidence(
      bestMatch.score,
      true, // Amount match not checked for merchant db
      bestMatch.merchant.confidence * 100 // Use merchant's confidence as history
    );

    return {
      categoryId: category.id,
      categoryName: category.name,
      confidence,
      merchantName,
      ruleId: null,
      reasoning: `Matched merchant database: "${bestMatch.merchant.merchantName}" (${Math.round(bestMatch.score * 100)}% match)`
    };
  }

  /**
   * Strategy 3: Analyze user's transaction history
   * Find similar past transactions and use their categories
   */
  private async categorizeByHistoricalPatterns(
    transaction: Transaction,
    merchantName: string
  ): Promise<CategorizationResult | null> {
    // Get user's past transactions with similar merchant names
    const { data: similarTxns } = await supabase
      .from('transactions')
      .select('merchant_name, category_id, amount')
      .eq('user_id', this.userId)
      .not('category_id', 'is', null)
      .not('merchant_name', 'is', null)
      .order('date', { ascending: false })
      .limit(500); // Last 500 transactions

    if (!similarTxns || similarTxns.length === 0) {
      return null;
    }

    // Find transactions with similar merchant names
    const matches: Array<{ categoryId: string; similarity: number; amount: number }> = [];

    for (const txn of similarTxns) {
      if (!txn.merchant_name || !txn.category_id) continue;

      const matchScore = similarity(merchantName, txn.merchant_name);
      if (matchScore >= 0.75) {
        matches.push({
          categoryId: txn.category_id,
          similarity: matchScore,
          amount: txn.amount
        });
      }
    }

    if (matches.length === 0) {
      return null;
    }

    // Find most common category among matches
    const categoryCounts = new Map<string, { count: number; totalSimilarity: number }>();

    for (const match of matches) {
      const existing = categoryCounts.get(match.categoryId) || { count: 0, totalSimilarity: 0 };
      categoryCounts.set(match.categoryId, {
        count: existing.count + 1,
        totalSimilarity: existing.totalSimilarity + match.similarity
      });
    }

    // Get category with highest count
    let bestCategory: { id: string; count: number; avgSimilarity: number } | null = null;

    for (const [categoryId, stats] of categoryCounts.entries()) {
      const avgSimilarity = stats.totalSimilarity / stats.count;
      if (!bestCategory || stats.count > bestCategory.count) {
        bestCategory = {
          id: categoryId,
          count: stats.count,
          avgSimilarity
        };
      }
    }

    if (!bestCategory) {
      return null;
    }

    const category = await this.getCategoryById(bestCategory.id);
    const confidence = calculateConfidence(
      bestCategory.avgSimilarity,
      true,
      bestCategory.count
    );

    return {
      categoryId: bestCategory.id,
      categoryName: category?.name || null,
      confidence,
      merchantName,
      ruleId: null,
      reasoning: `Based on ${bestCategory.count} similar past transactions`
    };
  }

  /**
   * Strategy 4: Simple keyword matching
   * Last resort - match common keywords in description
   */
  private async categorizeByKeywords(
    transaction: Transaction
  ): Promise<CategorizationResult | null> {
    const description = transaction.description.toLowerCase();

    // Common keyword patterns
    const patterns = [
      { keywords: ['grocery', 'supermarket', 'food market', 'safeway', 'walmart'], category: 'Groceries' },
      { keywords: ['restaurant', 'cafe', 'coffee', 'diner', 'pizza'], category: 'Food & Dining' },
      { keywords: ['gas', 'fuel', 'chevron', 'shell', '76'], category: 'Transportation' },
      { keywords: ['uber', 'lyft', 'taxi', 'rideshare'], category: 'Transportation' },
      { keywords: ['amazon', 'target', 'store', 'retail'], category: 'Shopping' },
      { keywords: ['netflix', 'spotify', 'hulu', 'disney'], category: 'Entertainment' },
      { keywords: ['electric', 'power', 'gas bill', 'water', 'utility'], category: 'Bills & Utilities' },
      { keywords: ['rent', 'lease', 'apartment'], category: 'Housing' },
      { keywords: ['pharmacy', 'cvs', 'walgreens', 'medical'], category: 'Health & Fitness' }
    ];

    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (description.includes(keyword)) {
          const category = await this.getCategoryByName(pattern.category);
          if (category) {
            return {
              categoryId: category.id,
              categoryName: category.name,
              confidence: 0.5, // Low confidence for keyword matching
              merchantName: normalizeMerchantName(transaction.description),
              ruleId: null,
              reasoning: `Keyword match: "${keyword}"`
            };
          }
        }
      }
    }

    return null;
  }

  // =========================================================================
  // Private Methods - Data Loading & Caching
  // =========================================================================

  private async loadUserRules(): Promise<CategorizationRule[]> {
    if (this.userRulesCache) {
      return this.userRulesCache;
    }

    const { data } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('user_id', this.userId)
      .order('priority', { ascending: false });

    this.userRulesCache = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      merchantPattern: row.merchant_pattern,
      descriptionKeywords: row.description_keywords || [],
      amountMin: row.amount_min,
      amountMax: row.amount_max,
      categoryId: row.category_id,
      confidence: row.confidence,
      priority: row.priority,
      ruleType: row.rule_type,
      usageCount: row.usage_count,
      successCount: row.success_count,
      failureCount: row.failure_count,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));

    return this.userRulesCache;
  }

  private async loadMerchantDatabase(): Promise<Map<string, MerchantData>> {
    if (this.merchantDbCache) {
      return this.merchantDbCache;
    }

    const { data } = await supabase
      .from('merchant_database')
      .select('*')
      .order('match_count', { ascending: false });

    this.merchantDbCache = new Map();

    for (const row of data || []) {
      this.merchantDbCache.set(row.id, {
        id: row.id,
        merchantName: row.merchant_name,
        aliases: row.aliases || [],
        defaultCategoryName: row.default_category_name,
        defaultSubcategory: row.default_subcategory,
        merchantType: row.merchant_type,
        confidence: row.confidence
      });
    }

    return this.merchantDbCache;
  }

  private async loadCategories(): Promise<Map<string, { id: string; name: string }>> {
    if (this.categoryCache) {
      return this.categoryCache;
    }

    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', this.userId);

    this.categoryCache = new Map();

    for (const row of data || []) {
      this.categoryCache.set(row.id, { id: row.id, name: row.name });
      this.categoryCache.set(row.name.toLowerCase(), { id: row.id, name: row.name });
    }

    return this.categoryCache;
  }

  private async getCategoryById(categoryId: string): Promise<{ id: string; name: string } | null> {
    const categories = await this.loadCategories();
    return categories.get(categoryId) || null;
  }

  private async getCategoryByName(name: string): Promise<{ id: string; name: string } | null> {
    const categories = await this.loadCategories();
    return categories.get(name.toLowerCase()) || null;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.userRulesCache = null;
    this.merchantDbCache = null;
    this.categoryCache = null;
  }
}
