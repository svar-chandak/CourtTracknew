-- Complete Tennis Schema Update
-- Run this in Supabase SQL Editor to update your database for the tennis app

-- 1. Update teams table to add team_level and gender
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_level VARCHAR(20) CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('boys', 'girls', 'mixed'));

-- 2. Update players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS team_level VARCHAR(20) CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Remove old columns
ALTER TABLE players 
DROP COLUMN IF EXISTS skill_level,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- 3. Update matches table to add match_type
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'team_match' CHECK (match_type IN ('team_match', 'individual'));

-- 4. Update match_results table to use new division system
ALTER TABLE match_results 
DROP COLUMN IF EXISTS position,
ADD COLUMN IF NOT EXISTS division VARCHAR(20) CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
ADD COLUMN IF NOT EXISTS position_number INTEGER CHECK (position_number >= 1 AND position_number <= 6);

-- 5. Update lineups table to use new division system
ALTER TABLE lineups 
DROP COLUMN IF EXISTS position,
ADD COLUMN IF NOT EXISTS division VARCHAR(20) CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
ADD COLUMN IF NOT EXISTS position_number INTEGER CHECK (position_number >= 1 AND position_number <= 6);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_team_level ON teams(team_level);
CREATE INDEX IF NOT EXISTS idx_teams_gender ON teams(gender);
CREATE INDEX IF NOT EXISTS idx_players_gender ON players(gender);
CREATE INDEX IF NOT EXISTS idx_players_team_level ON players(team_level);
CREATE INDEX IF NOT EXISTS idx_players_utr_rating ON players(utr_rating);
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);
CREATE INDEX IF NOT EXISTS idx_match_results_division ON match_results(division);
CREATE INDEX IF NOT EXISTS idx_lineups_division ON lineups(division);

-- 7. Set default values for existing records
UPDATE teams SET team_level = 'varsity' WHERE team_level IS NULL;
UPDATE teams SET gender = 'boys' WHERE gender IS NULL;
UPDATE players SET gender = 'male' WHERE gender IS NULL;
UPDATE matches SET match_type = 'team_match' WHERE match_type IS NULL;

-- 8. Update RLS policies (if needed)
-- Note: You may need to update your RLS policies to include the new columns
