-- Update Player Schema for Realistic High School Tennis
-- Run this in Supabase SQL Editor

-- Update players table to replace skill_level with team_level and add utr_rating
ALTER TABLE players 
DROP COLUMN IF EXISTS skill_level,
ADD COLUMN IF NOT EXISTS team_level VARCHAR(20) CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_players_team_level ON players(team_level);
CREATE INDEX IF NOT EXISTS idx_players_utr_rating ON players(utr_rating);

-- Update RLS policies (if needed)
-- The existing policies should still work since we're just changing column names
