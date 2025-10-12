-- Create team matches and individual position matches tables
-- This supports school vs school matches with individual position scoring

-- Team matches table (school vs school)
CREATE TABLE IF NOT EXISTS public.team_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    team_level TEXT NOT NULL CHECK (team_level IN ('varsity', 'jv', 'freshman')),
    match_date DATE NOT NULL,
    match_time TIME,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    winner TEXT CHECK (winner IN ('home', 'away', 'tie')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Individual position matches table (1st singles, 2nd singles, etc.)
CREATE TABLE IF NOT EXISTS public.individual_position_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    team_match_id UUID REFERENCES public.team_matches(id) ON DELETE CASCADE,
    division TEXT NOT NULL CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
    position INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc.
    
    -- Players
    home_player1_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    home_player2_id UUID REFERENCES public.players(id) ON DELETE SET NULL, -- For doubles
    away_player1_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    away_player2_id UUID REFERENCES public.players(id) ON DELETE SET NULL, -- For doubles
    
    -- Match details
    winner TEXT CHECK (winner IN ('home', 'away')),
    score TEXT, -- e.g., "6-4, 6-2"
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    court_number INTEGER,
    scheduled_time TIME,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_matches_tournament_id ON public.team_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_matches_home_team_id ON public.team_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_team_matches_away_team_id ON public.team_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_team_matches_team_level ON public.team_matches(team_level);
CREATE INDEX IF NOT EXISTS idx_team_matches_status ON public.team_matches(status);
CREATE INDEX IF NOT EXISTS idx_team_matches_match_date ON public.team_matches(match_date);

CREATE INDEX IF NOT EXISTS idx_individual_position_matches_team_match_id ON public.individual_position_matches(team_match_id);
CREATE INDEX IF NOT EXISTS idx_individual_position_matches_division ON public.individual_position_matches(division);
CREATE INDEX IF NOT EXISTS idx_individual_position_matches_status ON public.individual_position_matches(status);
CREATE INDEX IF NOT EXISTS idx_individual_position_matches_home_player1_id ON public.individual_position_matches(home_player1_id);
CREATE INDEX IF NOT EXISTS idx_individual_position_matches_away_player1_id ON public.individual_position_matches(away_player1_id);

-- RLS Policies for team_matches
ALTER TABLE public.team_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view team matches for their teams" ON public.team_matches
    FOR SELECT USING (
        home_team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        ) OR
        away_team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can insert team matches for their teams" ON public.team_matches
    FOR INSERT WITH CHECK (
        home_team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update team matches for their teams" ON public.team_matches
    FOR UPDATE USING (
        home_team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        ) OR
        away_team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can delete team matches for their teams" ON public.team_matches
    FOR DELETE USING (
        home_team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

-- RLS Policies for individual_position_matches
ALTER TABLE public.individual_position_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view individual position matches for their team matches" ON public.individual_position_matches
    FOR SELECT USING (
        team_match_id IN (
            SELECT id FROM public.team_matches 
            WHERE home_team_id IN (
                SELECT id FROM public.teams 
                WHERE coach_id = auth.uid()
            ) OR away_team_id IN (
                SELECT id FROM public.teams 
                WHERE coach_id = auth.uid()
            )
        )
    );

CREATE POLICY "Coaches can insert individual position matches for their team matches" ON public.individual_position_matches
    FOR INSERT WITH CHECK (
        team_match_id IN (
            SELECT id FROM public.team_matches 
            WHERE home_team_id IN (
                SELECT id FROM public.teams 
                WHERE coach_id = auth.uid()
            )
        )
    );

CREATE POLICY "Coaches can update individual position matches for their team matches" ON public.individual_position_matches
    FOR UPDATE USING (
        team_match_id IN (
            SELECT id FROM public.team_matches 
            WHERE home_team_id IN (
                SELECT id FROM public.teams 
                WHERE coach_id = auth.uid()
            ) OR away_team_id IN (
                SELECT id FROM public.teams 
                WHERE coach_id = auth.uid()
            )
        )
    );

CREATE POLICY "Coaches can delete individual position matches for their team matches" ON public.individual_position_matches
    FOR DELETE USING (
        team_match_id IN (
            SELECT id FROM public.team_matches 
            WHERE home_team_id IN (
                SELECT id FROM public.teams 
                WHERE coach_id = auth.uid()
            )
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.team_matches IS 'School vs school matches (Varsity, JV, Freshman)';
COMMENT ON TABLE public.individual_position_matches IS 'Individual position matches within team matches (1st singles, 2nd singles, etc.)';
COMMENT ON COLUMN public.team_matches.team_level IS 'Team level: varsity, jv, or freshman';
COMMENT ON COLUMN public.individual_position_matches.division IS 'Division: boys_singles, girls_singles, boys_doubles, girls_doubles, mixed_doubles';
COMMENT ON COLUMN public.individual_position_matches.position IS 'Position number: 1st, 2nd, 3rd, etc.';
