-- Fix Matches Table - Add Missing match_type Column
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'team_match' CHECK (match_type IN ('team_match', 'individual'));

-- Update existing records to have the default match_type
UPDATE matches 
SET match_type = 'team_match' 
WHERE match_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;
