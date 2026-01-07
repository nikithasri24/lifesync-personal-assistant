/**
 * Smart Expense Categorization Engine
 *
 * Automatically categorizes financial transactions using:
 * - Merchant name patterns
 * - Transaction amount patterns
 * - Historical user behavior
 * - Machine learning-like classification
 */

import type { FinancialTransactionData } from './types';

export interface CategoryRule {
  id: string;
  name: string;
  keywords: string[];
  merchantPatterns: RegExp[];
  amountRanges?: { min?: number; max?: number }[];
  confidence: number;
  color: string;
  icon: string;
  subcategories?: string[];
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
  subcategory?: string;
}

export interface SpendingPattern {
  category: string;
  averageAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  typical_days?: number[];
  seasonality?: 'high_summer' | 'high_winter' | 'holiday_spike' | 'none';
}

// Comprehensive categorization rules
const CATEGORY_RULES: CategoryRule[] = [
  // Food & Dining
  {
    id: 'groceries',
    name: 'Groceries',
    keywords: ['walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joe', 'aldi', 'publix', 'wegmans'],
    merchantPatterns: [/walmart/i, /target/i, /costco/i, /grocery/i, /market/i, /food.*store/i],
    amountRanges: [{ min: 20, max: 300 }],
    confidence: 0.9,
    color: '#10B981',
    icon: '🛒',
    subcategories: ['fresh_produce', 'meat_seafood', 'dairy', 'pantry_staples', 'snacks']
  },
  {
    id: 'dining_out',
    name: 'Dining Out',
    keywords: ['restaurant', 'pizza', 'mcdonald', 'burger', 'starbucks', 'coffee', 'doordash', 'uber eats', 'grubhub'],
    merchantPatterns: [/restaurant/i, /pizza/i, /coffee/i, /cafe/i, /bar/i, /grill/i, /diner/i, /bistro/i],
    amountRanges: [{ min: 5, max: 200 }],
    confidence: 0.85,
    color: '#F59E0B',
    icon: '🍽️',
    subcategories: ['fast_food', 'casual_dining', 'coffee_shops', 'delivery', 'fine_dining']
  },

  // Transportation
  {
    id: 'gas_fuel',
    name: 'Gas & Fuel',
    keywords: ['shell', 'exxon', 'chevron', 'bp', 'mobil', 'gas station', 'fuel'],
    merchantPatterns: [/shell/i, /exxon/i, /chevron/i, /bp/i, /mobil/i, /gas/i, /fuel/i, /station/i],
    amountRanges: [{ min: 20, max: 100 }],
    confidence: 0.95,
    color: '#EF4444',
    icon: '⛽',
    subcategories: ['regular_gas', 'premium_gas', 'diesel']
  },
  {
    id: 'rideshare',
    name: 'Rideshare & Taxi',
    keywords: ['uber', 'lyft', 'taxi', 'cab'],
    merchantPatterns: [/uber/i, /lyft/i, /taxi/i, /cab/i],
    confidence: 0.9,
    color: '#8B5CF6',
    icon: '🚗',
    subcategories: ['rideshare', 'taxi', 'airport_transport']
  },
  {
    id: 'public_transport',
    name: 'Public Transportation',
    keywords: ['metro', 'subway', 'bus', 'train', 'transit', 'mta'],
    merchantPatterns: [/metro/i, /subway/i, /transit/i, /mta/i, /bus/i, /train/i],
    confidence: 0.85,
    color: '#06B6D4',
    icon: '🚇'
  },

  // Utilities & Bills
  {
    id: 'electricity',
    name: 'Electricity',
    keywords: ['electric', 'power', 'energy', 'pge', 'utility'],
    merchantPatterns: [/electric/i, /power/i, /energy/i, /utility/i],
    amountRanges: [{ min: 50, max: 400 }],
    confidence: 0.9,
    color: '#FBBF24',
    icon: '⚡'
  },
  {
    id: 'internet_phone',
    name: 'Internet & Phone',
    keywords: ['verizon', 'att', 'comcast', 'spectrum', 'tmobile', 'internet', 'wireless'],
    merchantPatterns: [/verizon/i, /at&t/i, /comcast/i, /spectrum/i, /tmobile/i, /wireless/i],
    confidence: 0.85,
    color: '#3B82F6',
    icon: '📱'
  },

  // Entertainment
  {
    id: 'streaming',
    name: 'Streaming Services',
    keywords: ['netflix', 'spotify', 'apple music', 'hulu', 'disney', 'amazon prime', 'youtube premium'],
    merchantPatterns: [/netflix/i, /spotify/i, /hulu/i, /disney/i, /prime.*video/i, /youtube/i],
    amountRanges: [{ min: 5, max: 50 }],
    confidence: 0.95,
    color: '#EC4899',
    icon: '🎬',
    subcategories: ['video_streaming', 'music_streaming', 'gaming']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    keywords: ['movie', 'theater', 'cinema', 'concert', 'tickets', 'event'],
    merchantPatterns: [/movie/i, /theater/i, /cinema/i, /concert/i, /tickets/i],
    confidence: 0.8,
    color: '#F97316',
    icon: '🎭',
    subcategories: ['movies', 'concerts', 'sports_events', 'theater']
  },

  // Shopping
  {
    id: 'clothing',
    name: 'Clothing & Accessories',
    keywords: ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'clothing', 'fashion'],
    merchantPatterns: [/nike/i, /adidas/i, /zara/i, /clothing/i, /fashion/i, /apparel/i],
    confidence: 0.8,
    color: '#84CC16',
    icon: '👕',
    subcategories: ['casual_wear', 'work_attire', 'shoes', 'accessories']
  },
  {
    id: 'electronics',
    name: 'Electronics',
    keywords: ['apple', 'best buy', 'amazon', 'electronics', 'computer', 'phone'],
    merchantPatterns: [/apple/i, /best.*buy/i, /electronics/i, /computer/i],
    confidence: 0.85,
    color: '#6366F1',
    icon: '📱'
  },

  // Healthcare
  {
    id: 'healthcare',
    name: 'Healthcare',
    keywords: ['pharmacy', 'cvs', 'walgreens', 'hospital', 'clinic', 'doctor', 'medical'],
    merchantPatterns: [/pharmacy/i, /cvs/i, /walgreens/i, /medical/i, /clinic/i, /doctor/i],
    confidence: 0.9,
    color: '#DC2626',
    icon: '🏥',
    subcategories: ['prescriptions', 'doctor_visits', 'dental', 'vision']
  },

  // Financial
  {
    id: 'bank_fees',
    name: 'Bank Fees',
    keywords: ['fee', 'overdraft', 'atm', 'maintenance'],
    merchantPatterns: [/fee/i, /overdraft/i, /atm/i, /maintenance/i],
    confidence: 0.95,
    color: '#991B1B',
    icon: '🏦'
  },
  {
    id: 'investments',
    name: 'Investments',
    keywords: ['robinhood', 'fidelity', 'schwab', 'vanguard', 'etrade', 'investment'],
    merchantPatterns: [/robinhood/i, /fidelity/i, /schwab/i, /vanguard/i, /investment/i],
    confidence: 0.9,
    color: '#059669',
    icon: '📈'
  }
];

export class ExpenseCategorizationEngine {
  private userPatterns: Map<string, SpendingPattern> = new Map();
  private categoryHistory: Map<string, string> = new Map(); // merchant -> category mapping

  /**
   * Categorize a transaction using multiple signals
   */
  categorizeTransaction(transaction: FinancialTransactionData): CategorySuggestion[] {
    const suggestions: CategorySuggestion[] = [];
    const merchant = transaction.payee?.toLowerCase() ?? transaction.description?.toLowerCase() ?? '';
    const amount = Math.abs(transaction.amount);

    // 1. Check historical categorization
    const historicalCategory = this.categoryHistory.get(merchant);
    if (historicalCategory) {
      suggestions.push({
        categoryId: historicalCategory,
        categoryName: this.getCategoryName(historicalCategory),
        confidence: 0.95,
        reason: 'Previously categorized this merchant'
      });
    }

    // 2. Apply rule-based categorization
    for (const rule of CATEGORY_RULES) {
      let confidence = 0;
      const reasons: string[] = [];

      // Check keywords
      const keywordMatches = rule.keywords.filter(keyword =>
        merchant.includes(keyword.toLowerCase())
      ).length;
      if (keywordMatches > 0) {
        confidence += 0.3 * (keywordMatches / rule.keywords.length);
        reasons.push(`Matched ${keywordMatches} keywords`);
      }

      // Check regex patterns
      const patternMatches = rule.merchantPatterns.filter(pattern =>
        pattern.test(merchant)
      ).length;
      if (patternMatches > 0) {
        confidence += 0.4;
        reasons.push('Matched merchant pattern');
      }

      // Check amount ranges
      if (rule.amountRanges) {
        const amountMatch = rule.amountRanges.some(range => {
          const minMatch = !range.min || amount >= range.min;
          const maxMatch = !range.max || amount <= range.max;
          return minMatch && maxMatch;
        });
        if (amountMatch) {
          confidence += 0.2;
          reasons.push('Amount in typical range');
        }
      }

      // Adjust confidence based on rule's base confidence
      confidence *= rule.confidence;

      if (confidence > 0.3) {
        suggestions.push({
          categoryId: rule.id,
          categoryName: rule.name,
          confidence: Math.min(confidence, 0.95),
          reason: reasons.join(', '),
          subcategory: this.suggestSubcategory(rule, merchant, amount)
        });
      }
    }

    // 3. Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Learn from user categorization to improve future suggestions
   */
  learnFromUserCategorization(
    transaction: FinancialTransactionData,
    selectedCategoryId: string
  ): void {
    const merchant = transaction.payee?.toLowerCase() ?? transaction.description?.toLowerCase() ?? '';

    // Store merchant -> category mapping
    if (merchant) {
      this.categoryHistory.set(merchant, selectedCategoryId);
    }

    // Update spending patterns
    this.updateSpendingPattern(selectedCategoryId, transaction);
  }

  /**
   * Detect potential bills (recurring transactions)
   */
  detectPotentialBills(transactions: FinancialTransactionData[]): FinancialTransactionData[] {
    const merchantFrequency = new Map<string, FinancialTransactionData[]>();

    // Group transactions by merchant
    transactions.forEach(transaction => {
      const merchant = (transaction.payee?.toLowerCase() ?? transaction.description?.toLowerCase() ?? '').trim();
      if (merchant) {
        const existingTransactions = merchantFrequency.get(merchant) ?? [];
        merchantFrequency.set(merchant, [...existingTransactions, transaction]);
      }
    });

    const potentialBills: FinancialTransactionData[] = [];

    // Analyze for recurring patterns
    merchantFrequency.forEach((merchantTransactions) => {
      if (merchantTransactions.length >= 3) {
        // Check for similar amounts
        const amounts = merchantTransactions.map(t => Math.abs(t.amount));
        const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const amountVariance = amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount < 0.15);

        // Check for regular timing (monthly, weekly, etc.)
        const dates = merchantTransactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
        const intervals: number[] = [];
        for (let i = 1; i < dates.length; i++) {
          const daysDiff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
          intervals.push(daysDiff);
        }

        const avgInterval = intervals.length > 0
          ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
          : 0;
        const regularInterval = intervals.every(interval => Math.abs(interval - avgInterval) < 7);

        if (amountVariance && regularInterval) {
          // Mark as potential bill
          const latestTransaction = merchantTransactions[merchantTransactions.length - 1];
          potentialBills.push({
            ...latestTransaction,
            tags: [...new Set([...(latestTransaction.tags ?? []), 'potential_bill', 'recurring'])]
          });
        }
      }
    });

    return potentialBills;
  }

  /**
   * Generate spending insights and anomalies
   */
  generateSpendingInsights(transactions: FinancialTransactionData[]): {
    insights: string[];
    anomalies: { transaction: FinancialTransactionData; reason: string }[];
  } {
    const insights: string[] = [];
    const anomalies: { transaction: FinancialTransactionData; reason: string }[] = [];

    // Category spending analysis
    const categorySpending = new Map<string, {
      total: number;
      count: number;
      transactions: FinancialTransactionData[]
    }>();

    transactions.forEach(transaction => {
      const suggestions = this.categorizeTransaction(transaction);
      const category = suggestions[0]?.categoryId ?? 'uncategorized';

      const existingCategoryData = categorySpending.get(category) ?? {
        total: 0,
        count: 0,
        transactions: []
      };

      const updatedCategoryData = {
        total: existingCategoryData.total + Math.abs(transaction.amount),
        count: existingCategoryData.count + 1,
        transactions: [...existingCategoryData.transactions, transaction]
      };

      categorySpending.set(category, updatedCategoryData);
    });

    // Generate insights
    const sortedCategories = Array.from(categorySpending.entries())
      .sort((a, b) => b[1].total - a[1].total);

    if (sortedCategories.length > 0) {
      const [topCategoryId, topCategoryData] = sortedCategories[0];
      insights.push(
        `Your highest spending category is ${this.getCategoryName(topCategoryId)} at $${topCategoryData.total.toFixed(2)}`
      );
    }

    // Detect anomalies (unusually large transactions)
    categorySpending.forEach((data, category) => {
      if (data.transactions.length === 0) return;

      const amounts = data.transactions.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const threshold = avgAmount * 2.5;

      data.transactions.forEach(transaction => {
        const transactionAmount = Math.abs(transaction.amount);
        if (transactionAmount > threshold) {
          anomalies.push({
            transaction,
            reason: `Unusually large ${this.getCategoryName(category)} expense (${transactionAmount.toFixed(2)} vs avg ${avgAmount.toFixed(2)})`
          });
        }
      });
    });

    return { insights, anomalies };
  }

  private getCategoryName(categoryId: string): string {
    const rule = CATEGORY_RULES.find(r => r.id === categoryId);
    return rule?.name ?? categoryId;
  }

  private suggestSubcategory(rule: CategoryRule, merchant: string, amount: number): string | undefined {
    if (!rule.subcategories || rule.subcategories.length === 0) return undefined;

    // Simple subcategory logic - can be enhanced with more sophisticated rules
    if (rule.id === 'groceries') {
      if (merchant.includes('produce') || merchant.includes('fruit')) return 'fresh_produce';
      if (merchant.includes('meat') || merchant.includes('butcher')) return 'meat_seafood';
      if (amount > 150) return 'pantry_staples';
    }

    if (rule.id === 'dining_out') {
      if (amount < 15) return 'fast_food';
      if (merchant.includes('coffee') || merchant.includes('starbucks')) return 'coffee_shops';
      if (merchant.includes('delivery') || merchant.includes('doordash')) return 'delivery';
    }

    return rule.subcategories[0] ?? undefined; // Null-coalescing to ensure undefined if no subcategories
  }

  private updateSpendingPattern(_categoryId: string, _transaction: FinancialTransactionData): void {
    // Update user spending patterns for better future categorization
    // This would be implemented with more sophisticated pattern recognition
    // TODO: Implement actual spending pattern learning mechanism
  }

  /**
   * Get category rules for UI display
   */
  getCategoryRules(): CategoryRule[] {
    return CATEGORY_RULES;
  }

  /**
   * Bulk categorize transactions
   */
  bulkCategorize(transactions: FinancialTransactionData[]): Map<string, CategorySuggestion[]> {
    const results = new Map<string, CategorySuggestion[]>();

    transactions.forEach(transaction => {
      if (transaction.id) {
        const suggestions = this.categorizeTransaction(transaction);
        results.set(transaction.id, suggestions);
      }
    });

    return results;
  }
}

// Singleton instance
export const expenseCategorizationEngine = new ExpenseCategorizationEngine();
