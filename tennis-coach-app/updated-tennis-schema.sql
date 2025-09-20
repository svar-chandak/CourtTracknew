-- Updated Tennis Coach App Schema - Real High School Tennis Structure

-- Updated Teams table to include team level and gender
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_level VARCHAR(20) DEFAULT 'varsity' CHECK (team_level IN ('varsity', 'jv', 'freshman'));
ALTER TABLE teams ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('boys', 'girls', 'mixed'));

-- Updated Players table to include gender
ALTER TABLE players ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- Updated Matches table to include match type
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'team_match' CHECK (match_type IN ('team_match', 'individual'));

-- Updated Match Results table to include division
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS division VARCHAR(20) NOT NULL CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles'));
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS position_number INTEGER; -- 1st, 2nd, 3rd singles/doubles

-- Create a new table for team match divisions
CREATE TABLE IF NOT EXISTS team_match_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  division VARCHAR(20) NOT NULL CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
  position_number INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc.
  home_player_ids UUID[], -- Array of player IDs for home team
  away_player_ids UUID[], -- Array of player IDs for away team
  home_sets_won INTEGER DEFAULT 0,
  away_sets_won INTEGER DEFAULT 0,
  winner VARCHAR(10) CHECK (winner IN ('home', 'away')),
  score_details JSONB, -- Store set scores like {"sets": ["6-4", "3-6", "6-2"]}
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, division, position_number)
);

-- Update Lineups table to include division
ALTER TABLE lineups ADD COLUMN IF NOT EXISTS division VARCHAR(20) CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles'));
ALTER TABLE lineups ADD COLUMN IF NOT EXISTS position_number INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_level_gender ON teams(team_level, gender);
CREATE INDEX IF NOT EXISTS idx_players_gender ON players(gender);
CREATE INDEX IF NOT EXISTS idx_match_results_division ON match_results(division);
CREATE INDEX IF NOT EXISTS idx_team_match_divisions_match_id ON team_match_divisions(match_id);
CREATE INDEX IF NOT EXISTS idx_lineups_division ON lineups(division);

-- RLS policies for new table
ALTER TABLE team_match_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read team match divisions for their matches" ON team_match_divisions
FOR SELECT
TO authenticated
USING (
  match_id IN (
    SELECT id FROM matches WHERE 
    home_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    ) OR
    away_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    )
  )
);

CREATE POLICY "Allow users to insert team match divisions for their matches" ON team_match_divisions
FOR INSERT
TO authenticated
WITH CHECK (
  match_id IN (
    SELECT id FROM matches WHERE 
    home_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    ) OR
    away_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    )
  )
);

CREATE POLICY "Allow users to update team match divisions for their matches" ON team_match_divisions
FOR UPDATE
TO authenticated
USING (
  match_id IN (
    SELECT id FROM matches WHERE 
    home_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    ) OR
    away_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    )
  )
)
WITH CHECK (
  match_id IN (
    SELECT id FROM matches WHERE 
    home_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    ) OR
    away_team_id IN (
      SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
    )
  )
);
