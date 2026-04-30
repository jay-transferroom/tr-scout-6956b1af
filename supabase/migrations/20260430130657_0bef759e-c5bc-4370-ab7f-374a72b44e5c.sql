
-- Add a per-config ratings jsonb column so the configurable rating dropdowns
-- (Overall Rating, Potential, Position, Leadership) persist alongside the
-- legacy single `rating` column. This lets the "Players Scouted" counter
-- count any row with at least one filled rating field.
ALTER TABLE public.match_scouting_reports
  ADD COLUMN IF NOT EXISTS ratings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Reassign all scouting_assignments held by non-demo profiles to the three
-- demo Chelsea scout accounts (Oliver Smith, Emma Johnson, Dave Chester)
-- using a round-robin distribution by row_number.
WITH demo_scouts AS (
  SELECT unnest(ARRAY[
    '945ce791-acdf-4bba-9108-3aad08cdca8d'::uuid, -- Oliver Smith
    'bbd94222-705e-4918-963b-e77ca1d5003d'::uuid, -- Emma Johnson
    'a1f0d135-f118-43d1-9abe-c45c7987a2d1'::uuid  -- Dave Chester
  ]) AS scout_id, generate_series(0, 2) AS idx
),
to_reassign AS (
  SELECT id,
         (row_number() OVER (ORDER BY created_at, id) - 1) % 3 AS bucket
  FROM public.scouting_assignments
  WHERE assigned_to_scout_id NOT IN (
    '945ce791-acdf-4bba-9108-3aad08cdca8d'::uuid,
    'bbd94222-705e-4918-963b-e77ca1d5003d'::uuid,
    'a1f0d135-f118-43d1-9abe-c45c7987a2d1'::uuid
  )
)
UPDATE public.scouting_assignments sa
SET assigned_to_scout_id = ds.scout_id,
    updated_at = now()
FROM to_reassign tr
JOIN demo_scouts ds ON ds.idx = tr.bucket
WHERE sa.id = tr.id;
