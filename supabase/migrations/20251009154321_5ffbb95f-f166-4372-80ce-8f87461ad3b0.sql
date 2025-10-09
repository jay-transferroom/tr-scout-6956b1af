-- Enable RLS on squad tables
ALTER TABLE public.squad_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."squad_average_starter-rating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_league_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_maresca_formation ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view squad coaches
CREATE POLICY "Authenticated users can view squad coaches"
ON public.squad_coaches
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view squad average starter ratings
CREATE POLICY "Authenticated users can view squad average ratings"
ON public."squad_average_starter-rating"
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view squad league ratings
CREATE POLICY "Authenticated users can view squad league ratings"
ON public.squad_league_ratings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view squad maresca formation
CREATE POLICY "Authenticated users can view squad formations"
ON public.squad_maresca_formation
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow recruitment and director to manage squad coaches
CREATE POLICY "Recruitment and director can manage squad coaches"
ON public.squad_coaches
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('recruitment', 'director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('recruitment', 'director')
  )
);