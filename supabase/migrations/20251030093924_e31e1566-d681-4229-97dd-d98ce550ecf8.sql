-- Update James Wilson to Dave Chester
UPDATE profiles 
SET 
  first_name = 'Dave',
  last_name = 'Chester',
  updated_at = now()
WHERE id = 'a1f0d135-f118-43d1-9abe-c45c7987a2d1';