-- RLS Policies for Tennis Coach App

-- Enable RLS on all tables
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;

-- COACHES TABLE POLICIES
-- Allow users to read their own coach record
CREATE POLICY "Allow users to read their own coach record" ON coaches
FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Allow users to insert their own coach record
CREATE POLICY "Allow users to insert their own coach record" ON coaches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id::text);

-- Allow users to update their own coach record
CREATE POLICY "Allow users to update their own coach record" ON coaches
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- TEAMS TABLE POLICIES
-- Allow users to read their own team
CREATE POLICY "Allow users to read their own team" ON teams
FOR SELECT
TO authenticated
USING (auth.uid()::text = coach_id::text);

-- Allow users to insert their own team
CREATE POLICY "Allow users to insert their own team" ON teams
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = coach_id::text);

-- Allow users to update their own team
CREATE POLICY "Allow users to update their own team" ON teams
FOR UPDATE
TO authenticated
USING (auth.uid()::text = coach_id::text)
WITH CHECK (auth.uid()::text = coach_id::text);

-- Allow users to read other teams (for matches, tournaments)
CREATE POLICY "Allow users to read all teams" ON teams
FOR SELECT
TO authenticated
USING (true);

-- PLAYERS TABLE POLICIES
-- Allow users to read players from their team
CREATE POLICY "Allow users to read players from their team" ON players
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to insert players to their team
CREATE POLICY "Allow users to insert players to their team" ON players
FOR INSERT
TO authenticated
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to update players from their team
CREATE POLICY "Allow users to update players from their team" ON players
FOR UPDATE
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
)
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to delete players from their team
CREATE POLICY "Allow users to delete players from their team" ON players
FOR DELETE
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- MATCHES TABLE POLICIES
-- Allow users to read matches involving their team
CREATE POLICY "Allow users to read matches involving their team" ON matches
FOR SELECT
TO authenticated
USING (
  home_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  ) OR
  away_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to create matches for their team
CREATE POLICY "Allow users to create matches for their team" ON matches
FOR INSERT
TO authenticated
WITH CHECK (
  home_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  ) OR
  away_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to update matches involving their team
CREATE POLICY "Allow users to update matches involving their team" ON matches
FOR UPDATE
TO authenticated
USING (
  home_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  ) OR
  away_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
)
WITH CHECK (
  home_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  ) OR
  away_team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- TOURNAMENTS TABLE POLICIES
-- Allow users to read all tournaments
CREATE POLICY "Allow users to read all tournaments" ON tournaments
FOR SELECT
TO authenticated
USING (true);

-- Allow users to create tournaments
CREATE POLICY "Allow users to create tournaments" ON tournaments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = creator_id::text);

-- Allow users to update tournaments they created
CREATE POLICY "Allow users to update tournaments they created" ON tournaments
FOR UPDATE
TO authenticated
USING (auth.uid()::text = creator_id::text)
WITH CHECK (auth.uid()::text = creator_id::text);

-- TOURNAMENT_TEAMS TABLE POLICIES
-- Allow users to read tournament teams
CREATE POLICY "Allow users to read tournament teams" ON tournament_teams
FOR SELECT
TO authenticated
USING (true);

-- Allow users to join tournaments with their team
CREATE POLICY "Allow users to join tournaments with their team" ON tournament_teams
FOR INSERT
TO authenticated
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to leave tournaments
CREATE POLICY "Allow users to leave tournaments" ON tournament_teams
FOR DELETE
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- TOURNAMENT_MATCHES TABLE POLICIES
-- Allow users to read tournament matches
CREATE POLICY "Allow users to read tournament matches" ON tournament_matches
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update tournament matches (for score entry)
CREATE POLICY "Allow users to update tournament matches" ON tournament_matches
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- MATCH_RESULTS TABLE POLICIES
-- Allow users to read match results for matches involving their team
CREATE POLICY "Allow users to read match results for their matches" ON match_results
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

-- Allow users to insert match results for their matches
CREATE POLICY "Allow users to insert match results for their matches" ON match_results
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

-- Allow users to update match results for their matches
CREATE POLICY "Allow users to update match results for their matches" ON match_results
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

-- CHALLENGE_MATCHES TABLE POLICIES
-- Allow users to read challenge matches for their team
CREATE POLICY "Allow users to read challenge matches for their team" ON challenge_matches
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to create challenge matches for their team
CREATE POLICY "Allow users to create challenge matches for their team" ON challenge_matches
FOR INSERT
TO authenticated
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to update challenge matches for their team
CREATE POLICY "Allow users to update challenge matches for their team" ON challenge_matches
FOR UPDATE
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
)
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- LINEUPS TABLE POLICIES
-- Allow users to read lineups for their team
CREATE POLICY "Allow users to read lineups for their team" ON lineups
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to create lineups for their team
CREATE POLICY "Allow users to create lineups for their team" ON lineups
FOR INSERT
TO authenticated
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to update lineups for their team
CREATE POLICY "Allow users to update lineups for their team" ON lineups
FOR UPDATE
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
)
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);

-- Allow users to delete lineups for their team
CREATE POLICY "Allow users to delete lineups for their team" ON lineups
FOR DELETE
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE coach_id::text = auth.uid()::text
  )
);
