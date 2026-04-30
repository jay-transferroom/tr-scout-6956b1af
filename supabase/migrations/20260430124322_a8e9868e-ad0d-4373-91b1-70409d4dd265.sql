-- Reassign Bobby Chucas (9d293f14-...) and Jay Hughes (18c1f67c-...) assignments
-- across the three demo scout accounts in a deterministic round-robin.
WITH demo_scouts AS (
  SELECT unnest(ARRAY[
    '945ce791-acdf-4bba-9108-3aad08cdca8d'::uuid, -- Oliver Smith
    'bbd94222-705e-4918-963b-e77ca1d5003d'::uuid, -- Emma Johnson
    'a1f0d135-f118-43d1-9abe-c45c7987a2d1'::uuid  -- Dave Chester
  ]) AS scout_id, generate_series(0,2) AS idx
),
to_reassign AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS rn
  FROM public.scouting_assignments
  WHERE assigned_to_scout_id IN (
    '9d293f14-16da-4846-a190-9771f3464e24',
    '18c1f67c-208a-4861-98df-083feebb72dc'
  )
)
UPDATE public.scouting_assignments sa
SET assigned_to_scout_id = ds.scout_id,
    updated_at = now()
FROM to_reassign tr
JOIN demo_scouts ds ON ds.idx = (tr.rn % 3)
WHERE sa.id = tr.id;