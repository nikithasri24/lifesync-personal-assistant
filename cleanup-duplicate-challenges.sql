-- Cleanup Script: Remove duplicate 75 Hard challenges
-- Keeps only the most recent challenge for each unique name+start_date combination

-- Step 1: Preview duplicates (run this first to see what will be deleted)
SELECT
  name,
  start_date,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY created_at DESC) as all_ids
FROM sfh_challenges
WHERE user_id = auth.uid()
GROUP BY name, start_date
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates (keeps the most recent one by created_at)
WITH ranked_challenges AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, start_date
      ORDER BY created_at DESC
    ) as rn
  FROM sfh_challenges
  WHERE user_id = auth.uid()
)
DELETE FROM sfh_challenges
WHERE id IN (
  SELECT id
  FROM ranked_challenges
  WHERE rn > 1
)
AND user_id = auth.uid();

-- Step 3: Verify cleanup
SELECT
  COUNT(*) as total_challenges,
  COUNT(DISTINCT (name, start_date)) as unique_challenges
FROM sfh_challenges
WHERE user_id = auth.uid();
