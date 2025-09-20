-- Quick Fix: Add match_type column to matches table
-- Run this in your Supabase SQL Editor

ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'team_match' CHECK (match_type IN ('team_match', 'individual'));

-- Update any existing records
UPDATE matches 
SET match_type = 'team_match' 
WHERE match_type IS NULL;

-- Verify the fix
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'matches' AND column_name = 'match_type';
