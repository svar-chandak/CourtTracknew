-- Consolidated Tennis Coach Management App Database Schema
-- This is the single source of truth for the database schema
-- Run this in your Supabase SQL editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
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
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_code VARCHAR(6) UNIQUE NOT NULL,
    school_name VARCHAR NOT NULL,
    coach_id UUID REFERENCES coaches(id),
    team_level VARCHAR DEFAULT 'varsity' CHECK (team_level IN ('varsity', 'jv', 'freshman')),
    gender VARCHAR DEFAULT 'mixed' CHECK (gender IN ('boys', 'girls', 'mixed')),
    season_record_wins INTEGER DEFAULT 0,
    season_record_losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Players table (with student login support)
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id VARCHAR UNIQUE NOT NULL, -- Student login ID
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE, -- Student login email
    password_hash VARCHAR, -- Student login password
    grade INTEGER CHECK (grade >= 9 AND grade <= 12),
    gender VARCHAR NOT NULL CHECK (gender IN ('male', 'female')),
    position_preference VARCHAR CHECK (position_preference IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
    team_level VARCHAR CHECK (team_level IN ('varsity', 'jv', 'freshman')),
    utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1.0 AND utr_rating <= 16.0),
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    match_date DATE NOT NULL,
    match_time TIME,
    location VARCHAR,
    match_type VARCHAR DEFAULT 'team_match' CHECK (match_type IN ('team_match', 'individual')),
    status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team Match Divisions table (for team matches)
CREATE TABLE IF NOT EXISTS team_match_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    division VARCHAR NOT NULL CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
    position_number INTEGER NOT NULL CHECK (position_number >= 1),
    home_player_ids UUID[] NOT NULL,
    away_player_ids UUID[] NOT NULL,
    home_sets_won INTEGER DEFAULT 0,
    away_sets_won INTEGER DEFAULT 0,
    winner VARCHAR CHECK (winner IN ('home', 'away')),
    score_details JSONB,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    tournament_code VARCHAR(8) UNIQUE NOT NULL,
    creator_id UUID REFERENCES coaches(id),
    tournament_type VARCHAR NOT NULL CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'dual_match')),
    max_teams INTEGER NOT NULL CHECK (max_teams >= 2 AND max_teams <= 32),
    status VARCHAR DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed')),
    start_date DATE,
    location VARCHAR,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Teams table
CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    seed_number INTEGER,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

-- Tournament Matches table
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    team1_id UUID REFERENCES teams(id),
    team2_id UUID REFERENCES teams(id),
    winner_team_id UUID REFERENCES teams(id),
    match_date DATE,
    match_time TIME,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    score_summary VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lineups table
CREATE TABLE IF NOT EXISTS lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    position VARCHAR NOT NULL,
    player_ids UUID[] NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Challenge Matches table
CREATE TABLE IF NOT EXISTS challenge_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    challenger_player_id UUID REFERENCES players(id),
    challenged_player_id UUID REFERENCES players(id),
    match_date DATE NOT NULL,
    winner_player_id UUID REFERENCES players(id),
    score VARCHAR,
    approved_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    announcement_type VARCHAR DEFAULT 'general' CHECK (announcement_type IN ('general', 'match_reminder', 'practice_change', 'emergency')),
    is_urgent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    event_type VARCHAR NOT NULL CHECK (event_type IN ('practice', 'match')),
    event_id UUID, -- References practice_sessions or matches
    event_date DATE NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Practice Sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    practice_date DATE NOT NULL,
    practice_time TIME,
    location VARCHAR,
    description TEXT,
    coach_id UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_team ON tournament_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_lineups_team ON lineups(team_id);
CREATE INDEX IF NOT EXISTS idx_lineups_match ON lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player ON attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_announcements_team ON announcements(team_id);

-- Row Level Security (RLS) Policies
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_match_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Coach policies
CREATE POLICY "Coaches can view their own profile" ON coaches
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Coaches can update their own profile" ON coaches
    FOR UPDATE USING (auth.uid() = id);

-- Team policies
CREATE POLICY "Coaches can view their own teams" ON teams
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own teams" ON teams
    FOR UPDATE USING (auth.uid() = coach_id);

-- Player policies
CREATE POLICY "Coaches can view players on their teams" ON players
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM teams WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can manage players on their teams" ON players
    FOR ALL USING (
        team_id IN (
            SELECT id FROM teams WHERE coach_id = auth.uid()
        )
    );

-- Match policies
CREATE POLICY "Coaches can view matches involving their teams" ON matches
    FOR SELECT USING (
        home_team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid()) OR
        away_team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid())
    );

CREATE POLICY "Coaches can create matches for their teams" ON matches
    FOR INSERT WITH CHECK (
        home_team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid())
    );

CREATE POLICY "Coaches can update matches involving their teams" ON matches
    FOR UPDATE USING (
        home_team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid()) OR
        away_team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid())
    );

-- Tournament policies
CREATE POLICY "Coaches can view tournaments they created or joined" ON tournaments
    FOR SELECT USING (
        creator_id = auth.uid() OR
        id IN (
            SELECT tournament_id FROM tournament_teams 
            WHERE team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid())
        )
    );

CREATE POLICY "Coaches can create tournaments" ON tournaments
    FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Additional policies for other tables follow similar patterns...
-- (Additional RLS policies would be added here for completeness)

-- Functions for common operations
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_tournament_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
