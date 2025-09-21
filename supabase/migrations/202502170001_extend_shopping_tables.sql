-- Migration: extend shopping schema with additional metadata columns
-- Applies to tables: shopping_lists, shopping_items

-- Ensure uuid extension exists (no-op if already present)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- shopping_lists remains unchanged; ensure table exists
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    total_estimated_cost DECIMAL(10,2) DEFAULT 0,
    total_actual_cost DECIMAL(10,2) DEFAULT 0,
    store VARCHAR(255),
    shopping_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- shopping_items: add new metadata columns while keeping existing data
ALTER TABLE shopping_items
    ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
    ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS assigned_store VARCHAR(255),
    ADD COLUMN IF NOT EXISTS best_stores TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS nutrition_info JSONB,
    ADD COLUMN IF NOT EXISTS auto_added BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS store VARCHAR(255),
    ADD COLUMN IF NOT EXISTS aisle VARCHAR(100),
    ADD COLUMN IF NOT EXISTS recurring JSONB;

-- keep existing data for added columns; no destructive operations here

-- indexes to optimise filtering / ordering if they do not already exist
CREATE INDEX IF NOT EXISTS idx_shopping_items_priority ON shopping_items(priority);
CREATE INDEX IF NOT EXISTS idx_shopping_items_assigned_store ON shopping_items(assigned_store);
CREATE INDEX IF NOT EXISTS idx_shopping_items_recipe_id ON shopping_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_store ON shopping_items(store);

