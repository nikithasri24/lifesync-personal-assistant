-- ============================================================================
-- Phase 0: Infrastructure Foundation - Conversations Table
-- Purpose: Store AI conversation history for contextual memory
-- Enables: AI Contextual Memory, Life Coach Mode, "Last week you mentioned..."
-- Safe to run multiple times (idempotent)
-- Created: December 15, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: Create conversations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Conversation content
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"role": "user", "content": "...", "timestamp": "..."}, {"role": "assistant", "content": "...", "tool_calls": [...]}]
  
  -- AI-generated summary for long-term memory retrieval
  summary TEXT DEFAULT NULL,
  
  -- Context snapshot at conversation start (for debugging/analysis)
  context_snapshot JSONB DEFAULT NULL,
  
  -- Metadata
  started_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  message_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PART 2: Indexes for efficient retrieval
-- ============================================================================

-- Primary lookup: user's recent conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_recent 
  ON conversations(user_id, last_message_at DESC);

-- Session lookup
CREATE INDEX IF NOT EXISTS idx_conversations_session 
  ON conversations(session_id);

-- Full-text search on summaries (for "find conversation about...")
CREATE INDEX IF NOT EXISTS idx_conversations_summary_search 
  ON conversations USING gin(to_tsvector('english', coalesce(summary, '')));

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_date 
  ON conversations(user_id, started_at);

-- ============================================================================
-- PART 3: Row Level Security
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 4: Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_message_at = now();
  NEW.message_count = jsonb_array_length(NEW.messages);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- ============================================================================
-- PART 5: Helper functions
-- ============================================================================

-- Get recent conversations for context loading
CREATE OR REPLACE FUNCTION get_recent_conversations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS SETOF conversations AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM conversations
  WHERE user_id = p_user_id
  ORDER BY last_message_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search conversations by summary
CREATE OR REPLACE FUNCTION search_conversations(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  summary TEXT,
  started_at TIMESTAMPTZ,
  message_count INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.summary,
    c.started_at,
    c.message_count,
    ts_rank(to_tsvector('english', coalesce(c.summary, '')), plainto_tsquery('english', p_query)) as rank
  FROM conversations c
  WHERE c.user_id = p_user_id
    AND c.summary IS NOT NULL
    AND to_tsvector('english', coalesce(c.summary, '')) @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration creates:
-- ✅ conversations table for AI memory
-- ✅ Indexes for recent lookups, session, and full-text search
-- ✅ RLS policies for user isolation
-- ✅ Auto-update trigger for metadata
-- ✅ Helper functions for retrieval
-- ============================================================================

