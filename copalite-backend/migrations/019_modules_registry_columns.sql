-- Migration 019: Add missing columns to modules_registry
-- These columns exist in the entity but were never migrated to the database

ALTER TABLE modules_registry ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]';
ALTER TABLE modules_registry ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]';
