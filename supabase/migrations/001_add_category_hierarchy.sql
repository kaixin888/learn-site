-- Add parent_id and sort_order to categories table for two-level hierarchy
-- Run this in Supabase SQL Editor

-- Add parent_id (self-referencing, null = top-level)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add sort_order if not exists
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Set default sort_order for existing categories
UPDATE categories SET sort_order = 0 WHERE sort_order IS NULL;

-- Create index for faster tree queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
