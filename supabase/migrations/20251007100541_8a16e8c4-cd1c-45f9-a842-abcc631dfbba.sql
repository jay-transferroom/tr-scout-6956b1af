-- Drop the public access policy on players_new table
DROP POLICY IF EXISTS "Public users can view players_new" ON public.players_new;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view players_new"
ON public.players_new
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Keep the existing policy for recruitment and director roles to manage the table
-- (This policy already exists, just ensuring it's documented here for clarity)
