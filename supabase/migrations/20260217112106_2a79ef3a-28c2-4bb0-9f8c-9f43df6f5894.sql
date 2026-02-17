
-- Store club rating weights as a JSON blob per club
CREATE TABLE public.club_rating_weights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name text NOT NULL UNIQUE,
  weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  league_adjustments boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by_user_id uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.club_rating_weights ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can view club rating weights"
  ON public.club_rating_weights FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Recruitment and director can manage
CREATE POLICY "Recruitment and director can manage club rating weights"
  ON public.club_rating_weights FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['recruitment','director'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['recruitment','director'])
  ));

-- Auto-update timestamp
CREATE TRIGGER update_club_rating_weights_updated_at
  BEFORE UPDATE ON public.club_rating_weights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
