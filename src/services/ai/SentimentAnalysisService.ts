/**
 * Sentiment Analysis Service
 * Analyzes mood and sentiment from journal entries and text content
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { format, subDays, parseISO } from 'date-fns';

export type Sentiment = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';

export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // -1 to 1
  emotions: string[];
  keywords: string[];
  confidence: number;
}

export interface MoodTrend {
  date: string;
  sentiment: Sentiment;
  score: number;
  entryCount: number;
}

export interface EmotionalPattern {
  emotion: string;
  frequency: number;
  triggers: string[];
  dayOfWeekPattern: Record<string, number>;
}

export interface JournalInsights {
  averageSentiment: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
  dominantEmotions: string[];
  emotionalPatterns: EmotionalPattern[];
  moodTrends: MoodTrend[];
  recommendations: string[];
}

// Emotion keywords
const EMOTION_KEYWORDS: Record<string, string[]> = {
  happy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'wonderful', 'amazing', 'great', 'fantastic'],
  grateful: ['grateful', 'thankful', 'blessed', 'appreciate', 'fortunate', 'lucky'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'content', 'tranquil'],
  anxious: ['anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'panic', 'fear'],
  sad: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'lonely', 'heartbroken'],
  angry: ['angry', 'frustrated', 'annoyed', 'irritated', 'furious', 'mad', 'upset'],
  tired: ['tired', 'exhausted', 'drained', 'fatigued', 'burnt out', 'sleepy'],
  motivated: ['motivated', 'inspired', 'determined', 'driven', 'ambitious', 'focused'],
  confused: ['confused', 'uncertain', 'lost', 'unsure', 'puzzled', 'conflicted'],
  hopeful: ['hopeful', 'optimistic', 'looking forward', 'excited about', 'anticipating'],
};

// Positive and negative word lists
const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy',
  'joy', 'excited', 'grateful', 'blessed', 'success', 'accomplished', 'proud', 'peaceful',
  'calm', 'relaxed', 'inspired', 'motivated', 'hopeful', 'optimistic', 'beautiful', 'perfect'
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'frustrated',
  'stressed', 'anxious', 'worried', 'depressed', 'tired', 'exhausted', 'overwhelmed',
  'disappointed', 'failed', 'lonely', 'scared', 'confused', 'hurt', 'painful', 'difficult'
];

class SentimentAnalysisService {
  /**
   * Analyze sentiment of text
   */
  analyzeSentiment(text: string): SentimentResult {
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);

    // Count positive and negative words
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (POSITIVE_WORDS.some(pw => word.includes(pw))) positiveCount++;
      if (NEGATIVE_WORDS.some(nw => word.includes(nw))) negativeCount++;
    });

    // Calculate score (-1 to 1)
    const total = positiveCount + negativeCount;
    let score = 0;
    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
    }

    // Determine sentiment
    let sentiment: Sentiment;
    if (score > 0.5) sentiment = 'very_positive';
    else if (score > 0.1) sentiment = 'positive';
    else if (score < -0.5) sentiment = 'very_negative';
    else if (score < -0.1) sentiment = 'negative';
    else sentiment = 'neutral';

    // Detect emotions
    const emotions: string[] = [];
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (keywords.some(kw => normalizedText.includes(kw))) {
        emotions.push(emotion);
      }
    }

    // Extract keywords
    const keywords = [...POSITIVE_WORDS, ...NEGATIVE_WORDS]
      .filter(kw => normalizedText.includes(kw))
      .slice(0, 5);

    return {
      sentiment,
      score,
      emotions: emotions.slice(0, 5),
      keywords,
      confidence: Math.min(0.9, 0.3 + (total / words.length) * 2),
    };
  }

  /**
   * Get journal insights for a user
   */
  async getJournalInsights(userId: string, days = 30): Promise<JournalInsights> {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const { data: entries } = await supabase
      .from('journal_entries')
      .select('id, content, mood, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .order('created_at', { ascending: true });

    if (!entries || entries.length === 0) {
      return {
        averageSentiment: 0,
        sentimentTrend: 'stable',
        dominantEmotions: [],
        emotionalPatterns: [],
        moodTrends: [],
        recommendations: ['Start journaling to track your emotional patterns'],
      };
    }

    // Analyze each entry
    const analyses = entries.map(entry => ({
      date: format(parseISO(entry.created_at), 'yyyy-MM-dd'),
      analysis: this.analyzeSentiment(entry.content || ''),
      mood: entry.mood,
    }));

    // Calculate average sentiment
    const avgScore = analyses.reduce((sum, a) => sum + a.analysis.score, 0) / analyses.length;

    // Determine trend
    const firstHalf = analyses.slice(0, Math.floor(analyses.length / 2));
    const secondHalf = analyses.slice(Math.floor(analyses.length / 2));
    const firstAvg = firstHalf.reduce((sum, a) => sum + a.analysis.score, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((sum, a) => sum + a.analysis.score, 0) / (secondHalf.length || 1);
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondAvg - firstAvg > 0.2) trend = 'improving';
    else if (firstAvg - secondAvg > 0.2) trend = 'declining';

    // Count emotions
    const emotionCounts: Record<string, number> = {};
    analyses.forEach(a => {
      a.analysis.emotions.forEach(e => {
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
    });

    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion]) => emotion);

    // Generate recommendations
    const recommendations = this.generateRecommendations(avgScore, trend, dominantEmotions);

    // Build mood trends
    const moodTrends: MoodTrend[] = [];
    const dateGroups: Record<string, { scores: number[]; sentiments: Sentiment[] }> = {};
    
    analyses.forEach(a => {
      if (!dateGroups[a.date]) {
        dateGroups[a.date] = { scores: [], sentiments: [] };
      }
      dateGroups[a.date].scores.push(a.analysis.score);
      dateGroups[a.date].sentiments.push(a.analysis.sentiment);
    });

    Object.entries(dateGroups).forEach(([date, data]) => {
      const avgDayScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
      moodTrends.push({
        date,
        sentiment: this.scoreToSentiment(avgDayScore),
        score: avgDayScore,
        entryCount: data.scores.length,
      });
    });

    return {
      averageSentiment: avgScore,
      sentimentTrend: trend,
      dominantEmotions,
      emotionalPatterns: [],
      moodTrends,
      recommendations,
    };
  }

  private scoreToSentiment(score: number): Sentiment {
    if (score > 0.5) return 'very_positive';
    if (score > 0.1) return 'positive';
    if (score < -0.5) return 'very_negative';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private generateRecommendations(avgScore: number, trend: string, emotions: string[]): string[] {
    const recs: string[] = [];

    if (avgScore < -0.2) {
      recs.push('Consider talking to someone about how you\'re feeling');
      recs.push('Try incorporating more self-care activities');
    }

    if (emotions.includes('anxious') || emotions.includes('stressed')) {
      recs.push('Practice deep breathing or meditation');
      recs.push('Consider reducing caffeine intake');
    }

    if (emotions.includes('tired') || emotions.includes('exhausted')) {
      recs.push('Prioritize getting more sleep');
      recs.push('Take short breaks throughout the day');
    }

    if (trend === 'declining') {
      recs.push('Your mood has been declining - consider what might be causing this');
    }

    if (trend === 'improving') {
      recs.push('Great progress! Keep doing what\'s working for you');
    }

    if (recs.length === 0) {
      recs.push('Keep journaling to track your emotional patterns');
    }

    return recs.slice(0, 3);
  }
}

export const sentimentAnalysisService = new SentimentAnalysisService();

