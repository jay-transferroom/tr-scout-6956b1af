
INSERT INTO public.players (name, club, positions, age, date_of_birth, nationality, dominant_foot, contract_status, contract_expiry, region, image_url, transferroom_rating, future_rating, xtv_score)
SELECT 
  pn.name,
  'Nottingham Forest',
  ARRAY[pn.firstposition] || CASE WHEN pn.secondposition IS NOT NULL THEN ARRAY[pn.secondposition] ELSE ARRAY[]::text[] END,
  COALESCE(pn.age, 0),
  COALESCE(pn.birthdate, '2000-01-01'),
  COALESCE(pn.firstnationality, 'Unknown'),
  'Right',
  'Under Contract',
  pn.contractexpiration,
  'Europe',
  pn.imageurl,
  pn.rating,
  pn.potential,
  pn.xtv
FROM players_new pn
WHERE LOWER(pn.currentteam) = 'nottingham forest'
ON CONFLICT DO NOTHING;
