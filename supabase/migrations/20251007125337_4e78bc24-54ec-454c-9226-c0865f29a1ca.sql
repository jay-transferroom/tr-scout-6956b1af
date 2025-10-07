-- Allow recruitment and director roles to create notifications for scouts
CREATE POLICY "Recruitment and director can create notifications"
ON notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('recruitment', 'director')
  )
);