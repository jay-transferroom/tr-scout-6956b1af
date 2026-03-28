
CREATE TABLE public.user_access_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scout_access_mode text NOT NULL DEFAULT 'all',
  scout_access_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  shortlist_access_mode text NOT NULL DEFAULT 'all',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_access_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view access settings"
  ON public.user_access_settings FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors can manage access settings"
  ON public.user_access_settings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'director'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'director'
  ));

CREATE TRIGGER update_user_access_settings_updated_at
  BEFORE UPDATE ON public.user_access_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
