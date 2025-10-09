-- Enable RLS on squad_recommendations
ALTER TABLE public.squad_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view squad recommendations
CREATE POLICY "Authenticated users can view squad recommendations"
ON public.squad_recommendations
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow recruitment and director to manage squad recommendations
CREATE POLICY "Recruitment and director can manage squad recommendations"
ON public.squad_recommendations
FOR ALL
TO authenticated
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