-- ============================================================================
-- Stores Table
-- Migration created: 2025-12-31
-- Purpose: Create stores table to back shopping store recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('grocery', 'wholesale', 'specialty', 'organic', 'international', 'pharmacy')),
  address TEXT,
  phone TEXT,
  website TEXT,
  logo TEXT,
  color TEXT DEFAULT '#4F46E5',

  coordinates JSONB,
  preferences JSONB,
  specialties TEXT[] DEFAULT '{}',
  best_for TEXT[] DEFAULT '{}',
  avg_prices JSONB,

  distance DOUBLE PRECISION,
  last_visited TIMESTAMPTZ,
  favorite BOOLEAN DEFAULT false,
  hours JSONB,
  has_delivery BOOLEAN,
  has_pickup BOOLEAN,
  delivery_fee NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_stores_type ON stores(type);
