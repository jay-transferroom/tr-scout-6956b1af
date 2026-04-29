-- Allow recruitment and director (scout managers) to delete any match scouting reports
CREATE POLICY "Scout managers can delete any match scouting reports"
ON public.match_scouting_reports
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY (ARRAY['recruitment'::text, 'director'::text])
  )
);