-- ============================================
-- COPALITE v1.2 — Agent LLM Configuration
-- ============================================

-- Add config jsonb column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS config jsonb DEFAULT NULL;

-- Set default LLM config for agents that don't have one
UPDATE agents
SET config = '{"provider":"anthropic","model":"claude-sonnet-4-20250514","temperature":0.3,"maxTokens":4096,"timeout":120}'
WHERE config IS NULL;
