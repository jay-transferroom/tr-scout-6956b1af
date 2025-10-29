-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view reports from their club" ON reports;

-- Create a new policy that handles NULL club_ids properly
-- Users with NULL club_id can see all reports
-- Users with a club_id can only see reports from scouts in their club
CREATE POLICY "Users can view reports from their club" 
ON reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM profiles scout_profile
    JOIN profiles user_profile ON (user_profile.id = auth.uid())
    WHERE scout_profile.id = reports.scout_id
    AND (
      -- If user has no club_id, they can see all reports
      user_profile.club_id IS NULL
      -- If both have club_ids, they must match
      OR (user_profile.club_id = scout_profile.club_id)
    )
  )
);