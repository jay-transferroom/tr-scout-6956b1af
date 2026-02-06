
-- Create table for match-level scouting reports (per-player notes within a match)
CREATE TABLE public.match_scouting_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_identifier TEXT NOT NULL, -- composite key: "HomeTeam vs AwayTeam|2026-02-08"
  player_id TEXT NOT NULL, -- references players_new.id as text
  scout_id UUID NOT NULL, -- the user writing the report
  notes TEXT,
  rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one report per scout per player per match
ALTER TABLE public.match_scouting_reports
  ADD CONSTRAINT unique_match_player_scout UNIQUE (match_identifier, player_id, scout_id);

-- Enable RLS
ALTER TABLE public.match_scouting_reports ENABLE ROW LEVEL SECURITY;

-- Scouts can view reports from their club
CREATE POLICY "Users can view match scouting reports from their club"
  ON public.match_scouting_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles scout_profile
      JOIN profiles user_profile ON user_profile.id = auth.uid()
      WHERE scout_profile.id = match_scouting_reports.scout_id
        AND (user_profile.club_id IS NULL OR user_profile.club_id = scout_profile.club_id)
    )
  );

-- Users can create their own reports
CREATE POLICY "Users can create their own match scouting reports"
  ON public.match_scouting_reports
  FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

-- Users can update their own reports
CREATE POLICY "Users can update their own match scouting reports"
  ON public.match_scouting_reports
  FOR UPDATE
  USING (auth.uid() = scout_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete their own match scouting reports"
  ON public.match_scouting_reports
  FOR DELETE
  USING (auth.uid() = scout_id);

-- Trigger for updated_at
CREATE TRIGGER update_match_scouting_reports_updated_at
  BEFORE UPDATE ON public.match_scouting_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
