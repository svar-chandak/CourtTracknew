-- Fix the check constraint for attendance_records
-- Drop the existing problematic constraint
ALTER TABLE public.attendance_records 
DROP CONSTRAINT IF EXISTS check_session_or_match;

-- Create a simple constraint that just validates UUID format
-- This allows event_id to be null or a valid UUID
ALTER TABLE public.attendance_records 
ADD CONSTRAINT check_event_id_uuid 
CHECK (event_id IS NULL OR event_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Add comment for documentation
COMMENT ON CONSTRAINT check_event_id_uuid ON public.attendance_records IS 'Ensures event_id is a valid UUID when not null';
