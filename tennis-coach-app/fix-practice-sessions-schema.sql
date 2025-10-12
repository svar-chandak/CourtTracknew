-- Add coach_id column to practice_sessions table
ALTER TABLE public.practice_sessions 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to have the correct coach_id
UPDATE public.practice_sessions 
SET coach_id = (
    SELECT t.coach_id 
    FROM public.teams t 
    WHERE t.id = practice_sessions.team_id
)
WHERE coach_id IS NULL;

-- Make coach_id NOT NULL after populating existing records
ALTER TABLE public.practice_sessions 
ALTER COLUMN coach_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_coach_id ON public.practice_sessions(coach_id);

-- Update RLS policies to use coach_id directly
DROP POLICY IF EXISTS "Coaches can view practice sessions for their teams" ON public.practice_sessions;
DROP POLICY IF EXISTS "Coaches can insert practice sessions for their teams" ON public.practice_sessions;
DROP POLICY IF EXISTS "Coaches can update practice sessions for their teams" ON public.practice_sessions;
DROP POLICY IF EXISTS "Coaches can delete practice sessions for their teams" ON public.practice_sessions;

-- Create new RLS policies using coach_id
CREATE POLICY "Coaches can view their own practice sessions" ON public.practice_sessions
    FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own practice sessions" ON public.practice_sessions
    FOR INSERT WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own practice sessions" ON public.practice_sessions
    FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own practice sessions" ON public.practice_sessions
    FOR DELETE USING (coach_id = auth.uid());

-- Add comment for documentation
COMMENT ON COLUMN public.practice_sessions.coach_id IS 'Direct reference to the coach who created this practice session';
