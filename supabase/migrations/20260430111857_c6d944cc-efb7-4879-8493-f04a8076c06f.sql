UPDATE public.match_report_config
SET ratings = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(ratings) elem
  WHERE elem->>'name' <> 'Test'
)
WHERE club_name = 'Chelsea';