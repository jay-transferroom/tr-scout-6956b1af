-- Create table for saved squad configurations
CREATE TABLE IF NOT EXISTS public.squad_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name TEXT NOT NULL,
  name TEXT NOT NULL,
  formation TEXT NOT NULL,
  squad_type TEXT NOT NULL DEFAULT 'first-team',
  position_assignments JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.squad_configurations ENABLE ROW LEVEL SECURITY;

-- Users can view squad configurations from their club
CREATE POLICY "Users can view squad configurations from their club"
ON public.squad_configurations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.club_id IS NULL
      OR EXISTS (
        SELECT 1 FROM profiles creator
        WHERE creator.id = squad_configurations.created_by_user_id
        AND creator.club_id = profiles.club_id
      )
    )
  )
);

-- Recruitment and director can create squad configurations
CREATE POLICY "Recruitment and director can create squad configurations"
ON public.squad_configurations
FOR INSERT
WITH CHECK (
  created_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('recruitment', 'director')
  )
);

-- Users can update their own squad configurations
CREATE POLICY "Users can update their own squad configurations"
ON public.squad_configurations
FOR UPDATE
USING (created_by_user_id = auth.uid());

-- Users can delete their own squad configurations
CREATE POLICY "Users can delete their own squad configurations"
ON public.squad_configurations
FOR DELETE
USING (created_by_user_id = auth.uid());