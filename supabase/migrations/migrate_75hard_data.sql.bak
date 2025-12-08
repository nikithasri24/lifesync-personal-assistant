-- 75 Hard Data Migration SQL Script
-- Migrates data from old schema to new schema
--
-- OLD TABLES: sfh_challenges (plural), sfh_entries
-- NEW TABLES: sfh_challenge (singular), sfh_daily_checkins
--
-- Strategy: For each user, migrate their most recent ACTIVE challenge

DO $$
DECLARE
    v_old_challenge RECORD;
    v_new_challenge_id UUID;
    v_tasks JSONB;
    v_task_id TEXT;
    v_migrated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_entries_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 Starting 75 Hard Data Migration';
    RAISE NOTICE '====================================';

    -- Loop through each user's most recent challenge (regardless of active status)
    -- Note: Old system had bugs creating duplicates, so we take the most recent one
    FOR v_old_challenge IN
        SELECT DISTINCT ON (user_id)
            id,
            user_id,
            name,
            start_date,
            current_day,
            rules,
            created_at
        FROM sfh_challenges
        ORDER BY user_id, created_at DESC
    LOOP
        -- Check if user already has a migrated challenge
        IF EXISTS (
            SELECT 1 FROM sfh_challenge
            WHERE user_id = v_old_challenge.user_id
            AND status = 'active'
        ) THEN
            RAISE NOTICE 'User % already has migrated challenge, skipping',
                substring(v_old_challenge.user_id::text, 1, 8);
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END IF;

        -- Convert rules to tasks JSONB
        IF v_old_challenge.rules IS NOT NULL AND jsonb_array_length(v_old_challenge.rules) > 0 THEN
            -- Use existing rules as tasks
            v_tasks := (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', COALESCE(rule->>'id', gen_random_uuid()::text),
                        'title', rule->>'title',
                        'description', COALESCE(rule->>'description', ''),
                        'order', rn
                    ) ORDER BY rn
                )
                FROM (
                    SELECT rule, row_number() OVER () as rn
                    FROM jsonb_array_elements(v_old_challenge.rules) AS rule
                ) t
            );
        ELSE
            -- Use default tasks if no rules
            v_tasks := '[
                {"id": "task1", "title": "Follow a Diet", "description": "No cheat meals or alcohol", "order": 1},
                {"id": "task2", "title": "Workout Twice Daily", "description": "45 minutes each, one outdoors", "order": 2},
                {"id": "task3", "title": "Drink 1 Gallon of Water", "description": "", "order": 3},
                {"id": "task4", "title": "Read 10 Pages", "description": "Non-fiction", "order": 4},
                {"id": "task5", "title": "Take Progress Photo", "description": "", "order": 5}
            ]'::jsonb;
        END IF;

        -- Insert new challenge
        INSERT INTO sfh_challenge (
            user_id,
            start_date,
            current_day,
            status,
            tasks,
            created_at
        ) VALUES (
            v_old_challenge.user_id,
            v_old_challenge.start_date,
            GREATEST(v_old_challenge.current_day, 1),
            'active',
            v_tasks,
            v_old_challenge.created_at
        )
        RETURNING id INTO v_new_challenge_id;

        RAISE NOTICE 'Migrated challenge for user %: %',
            substring(v_old_challenge.user_id::text, 1, 8),
            v_new_challenge_id;

        v_migrated_count := v_migrated_count + 1;

        -- Migrate entries to daily check-ins
        INSERT INTO sfh_daily_checkins (
            challenge_id,
            date,
            day_number,
            task_completions,
            photo,
            weight,
            notes,
            created_at
        )
        SELECT
            v_new_challenge_id,
            e.date,
            e.day,
            -- Convert rule_completions to task_completions
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'taskId', COALESCE(rc->>'ruleId', rc->>'rule_id', ''),
                            'completed', COALESCE((rc->>'completed')::boolean, false),
                            'completedAt', COALESCE(rc->>'completedAt', rc->>'completed_at')
                        )
                    )
                    FROM jsonb_array_elements(e.rule_completions) AS rc
                ),
                '[]'::jsonb
            ),
            e.progress_photo_url,
            e.weight,
            e.notes,
            e.created_at
        FROM sfh_entries e
        WHERE e.challenge_id = v_old_challenge.id
        ON CONFLICT (challenge_id, date) DO NOTHING;

        GET DIAGNOSTICS v_entries_count = ROW_COUNT;
        RAISE NOTICE '  Migrated % entries', v_entries_count;

    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '📊 Migration Summary';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Challenges migrated: %', v_migrated_count;
    RAISE NOTICE 'Challenges skipped: %', v_skipped_count;
    RAISE NOTICE '✅ Migration completed successfully!';

END $$;

-- Verify migration
SELECT
    'sfh_challenge' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users
FROM sfh_challenge
UNION ALL
SELECT
    'sfh_daily_checkins' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT challenge_id) as unique_challenges
FROM sfh_daily_checkins;
