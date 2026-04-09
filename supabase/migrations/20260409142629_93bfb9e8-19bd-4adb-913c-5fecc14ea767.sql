
CREATE TABLE public.match_report_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name TEXT NOT NULL UNIQUE,
  ratings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.match_report_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view match report config"
  ON public.match_report_config FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert match report config"
  ON public.match_report_config FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update match report config"
  ON public.match_report_config FOR UPDATE
  TO authenticated USING (true);

CREATE TRIGGER update_match_report_config_updated_at
  BEFORE UPDATE ON public.match_report_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
