/**
 * Inbox Types
 * Type definitions for the Quick Capture / Universal Inbox feature
 */

export type InboxItemType = 'task' | 'note' | 'event' | 'habit' | 'goal' | 'reminder' | 'idea' | 'shopping' | 'other';
export type InboxItemPriority = 'urgent' | 'high' | 'medium' | 'low';
export type InboxItemStatus = 'pending' | 'processed' | 'dismissed';
export type InboxItemSource = 'manual' | 'voice' | 'share' | 'email' | 'widget' | 'notification' | 'cli';

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  
  // AI suggestions
  suggested_type: InboxItemType | null;
  suggested_priority: InboxItemPriority | null;
  suggested_date: string | null;
  suggested_tags: string[];
  ai_summary: string | null;
  
  // Status
  status: InboxItemStatus;
  processed_at: string | null;
  processed_to_type: string | null;
  processed_to_id: string | null;
  
  // Source
  source: InboxItemSource;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateInboxItemInput {
  content: string;
  source?: InboxItemSource;
}

export interface ProcessInboxItemInput {
  itemId: string;
  action: 'convert' | 'dismiss';
  convertTo?: InboxItemType;
  // Additional data for conversion
  taskData?: {
    title?: string;
    priority?: InboxItemPriority;
    due_date?: string;
    project_id?: string;
    tags?: string[];
  };
  noteData?: {
    title?: string;
    category?: string;
    tags?: string[];
  };
  eventData?: {
    title?: string;
    start_date?: string;
    end_date?: string;
    location?: string;
  };
}

export interface InboxStats {
  pending: number;
  processedToday: number;
  total: number;
  byType: Record<InboxItemType, number>;
}

