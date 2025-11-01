-- Player-Based Tournament Schema
-- This replaces team-based tournaments with individual player brackets

-- Tournament Players table (links players to tournaments)
CREATE TABLE IF NOT EXISTS tournament_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id),
    school_name VARCHAR NOT NULL,
    utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1.0 AND utr_rating <= 16.0),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- Tournament Bracket Slots table (stores bracket structure with drag-drop positions)
CREATE TABLE IF NOT EXISTS tournament_bracket_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    slot_number INTEGER NOT NULL,
    pool_side VARCHAR NOT NULL CHECK (pool_side IN ('A', 'B')),
    player_id UUID REFERENCES players(id),
    school_name VARCHAR,
    utr_rating DECIMAL(3,1),
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, round_number, slot_number, pool_side)
);

-- Tournament Bracket Matches table (individual player vs player matches)
CREATE TABLE IF NOT EXISTS tournament_bracket_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    pool_side VARCHAR CHECK (pool_side IN ('A', 'B')),
    slot_id_1 UUID REFERENCES tournament_bracket_slots(id),
    slot_id_2 UUID REFERENCES tournament_bracket_slots(id),
    player1_id UUID REFERENCES players(id),
    player2_id UUID REFERENCES players(id),
    player1_school VARCHAR,
    player2_school VARCHAR,
    winner_player_id UUID REFERENCES players(id),
    score_summary VARCHAR,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'bye')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Settings table (track bracket locked status, etc.)
CREATE TABLE IF NOT EXISTS tournament_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE UNIQUE,
    is_bracket_locked BOOLEAN DEFAULT FALSE,
    bracket_locked_at TIMESTAMP,
    bracket_locked_by UUID REFERENCES coaches(id),
    auto_balance_utr BOOLEAN DEFAULT TRUE,
    avoid_same_school_first_round BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_player ON tournament_players(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_school ON tournament_players(school_name);
CREATE INDEX IF NOT EXISTS idx_bracket_slots_tournament ON tournament_bracket_slots(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bracket_slots_round ON tournament_bracket_slots(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_bracket_matches_tournament ON tournament_bracket_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bracket_matches_round ON tournament_bracket_matches(tournament_id, round_number);

