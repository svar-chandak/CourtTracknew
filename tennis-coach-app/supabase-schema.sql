-- Tennis Coach Management App Database Schema
-- Run this in your Supabase SQL editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coaches table
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    school_name VARCHAR NOT NULL,
    team_code VARCHAR(6) UNIQUE NOT NULL,
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams/Schools table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_code VARCHAR(6) UNIQUE NOT NULL,
    school_name VARCHAR NOT NULL,
    coach_id UUID REFERENCES coaches(id),
    season_record_wins INTEGER DEFAULT 0,
    season_record_losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    grade INTEGER,
    email VARCHAR,
    phone VARCHAR,
    position_preference VARCHAR,
    skill_level VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    match_date DATE NOT NULL,
    match_time TIME,
    location VARCHAR,
    status VARCHAR DEFAULT 'scheduled',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual Match Results (Singles/Doubles)
CREATE TABLE match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    position VARCHAR NOT NULL,
    home_player_names VARCHAR[],
    away_player_names VARCHAR[],
    home_sets_won INTEGER DEFAULT 0,
    away_sets_won INTEGER DEFAULT 0,
    score_details JSONB,
    winner VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    tournament_code VARCHAR(8) UNIQUE NOT NULL,
    creator_id UUID REFERENCES coaches(id),
    tournament_type VARCHAR NOT NULL,
    max_teams INTEGER DEFAULT 8,
    status VARCHAR DEFAULT 'open',
    start_date DATE,
    location VARCHAR,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Participants
CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    seed_number INTEGER,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

-- Tournament Matches
CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    team1_id UUID REFERENCES teams(id),
    team2_id UUID REFERENCES teams(id),
    winner_team_id UUID REFERENCES teams(id),
    match_date DATE,
    match_time TIME,
    status VARCHAR DEFAULT 'pending',
    score_summary VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Challenge Matches (for lineup determination)
CREATE TABLE challenge_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    challenger_player_id UUID REFERENCES players(id),
    challenged_player_id UUID REFERENCES players(id),
    match_date DATE NOT NULL,
    winner_player_id UUID REFERENCES players(id),
    score VARCHAR,
    approved_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team Lineups
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    match_id UUID REFERENCES matches(id),
    position VARCHAR NOT NULL,
    player_ids UUID[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_coaches_email ON coaches(email);
CREATE INDEX idx_coaches_team_code ON coaches(team_code);
CREATE INDEX idx_teams_coach_id ON teams(coach_id);
CREATE INDEX idx_teams_team_code ON teams(team_code);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_match_results_match_id ON match_results(match_id);
CREATE INDEX idx_tournaments_code ON tournaments(tournament_code);
CREATE INDEX idx_tournament_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_teams_team ON tournament_teams(team_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_challenge_matches_team ON challenge_matches(team_id);
CREATE INDEX idx_lineups_team ON lineups(team_id);
CREATE INDEX idx_lineups_match ON lineups(match_id);

-- Row Level Security (RLS) Policies
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

-- Coaches can only see and modify their own data
CREATE POLICY "Coaches can view own profile" ON coaches
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Coaches can update own profile" ON coaches
    FOR UPDATE USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Coaches can view own team" ON teams
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own team" ON teams
    FOR UPDATE USING (auth.uid() = coach_id);

-- Players policies
CREATE POLICY "Team coaches can view players" ON players
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = players.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage players" ON players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = players.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Matches policies
CREATE POLICY "Coaches can view relevant matches" ON matches
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can create matches" ON matches
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Coaches can update relevant matches" ON matches
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
            AND teams.coach_id = auth.uid()
        )
    );

-- Match results policies
CREATE POLICY "Coaches can view match results" ON match_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_results.match_id
            AND (
                matches.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM teams 
                    WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
                    AND teams.coach_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Coaches can manage match results" ON match_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_results.match_id
            AND (
                matches.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM teams 
                    WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
                    AND teams.coach_id = auth.uid()
                )
            )
        )
    );

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments" ON tournaments
    FOR SELECT USING (true);

CREATE POLICY "Coaches can create tournaments" ON tournaments
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Tournament creators can update tournaments" ON tournaments
    FOR UPDATE USING (creator_id = auth.uid());

-- Tournament teams policies
CREATE POLICY "Anyone can view tournament teams" ON tournament_teams
    FOR SELECT USING (true);

CREATE POLICY "Team coaches can join tournaments" ON tournament_teams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = tournament_teams.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can leave tournaments" ON tournament_teams
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = tournament_teams.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Tournament matches policies
CREATE POLICY "Anyone can view tournament matches" ON tournament_matches
    FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage matches" ON tournament_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = tournament_matches.tournament_id 
            AND tournaments.creator_id = auth.uid()
        )
    );

-- Challenge matches policies
CREATE POLICY "Team coaches can view challenge matches" ON challenge_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = challenge_matches.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage challenge matches" ON challenge_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = challenge_matches.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Lineups policies
CREATE POLICY "Team coaches can view lineups" ON lineups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = lineups.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage lineups" ON lineups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = lineups.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for coaches table
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
