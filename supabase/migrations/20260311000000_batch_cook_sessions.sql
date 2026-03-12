-- Batch Cook Sessions
-- Supports the "cook in bulk on weekends, eat freely through the week" meal prep style.
-- Each session records what was cooked and how many servings remain per dish.
-- Individual meal_logs record what each person actually ate from the pool.

-- ============================================================
-- batch_cook_sessions: a single cooking event (e.g. "Sunday Prep")
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_cook_sessions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  cook_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE batch_cook_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own batch cook sessions"
  ON batch_cook_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- batch_cook_dishes: individual dishes within a session
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_cook_dishes (
  id                 UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id         UUID    NOT NULL REFERENCES batch_cook_sessions(id) ON DELETE CASCADE,
  recipe_id          UUID    REFERENCES recipes(id) ON DELETE SET NULL,
  custom_name        TEXT,
  servings_cooked    INTEGER NOT NULL DEFAULT 4 CHECK (servings_cooked > 0),
  servings_remaining INTEGER NOT NULL DEFAULT 4 CHECK (servings_remaining >= 0),
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT dish_has_name CHECK (recipe_id IS NOT NULL OR custom_name IS NOT NULL)
);

ALTER TABLE batch_cook_dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage dishes in their sessions"
  ON batch_cook_dishes
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM batch_cook_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM batch_cook_sessions WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- meal_logs: what each person actually ate (from pool or freeform)
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_logs (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date       DATE    NOT NULL DEFAULT CURRENT_DATE,
  meal_type         TEXT    NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  batch_dish_id     UUID    REFERENCES batch_cook_dishes(id) ON DELETE SET NULL,
  recipe_id         UUID    REFERENCES recipes(id) ON DELETE SET NULL,
  custom_name       TEXT,
  servings_consumed INTEGER NOT NULL DEFAULT 1 CHECK (servings_consumed > 0),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meal logs"
  ON meal_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Partners can read each other's meal logs (for the shared today view)
CREATE POLICY "Partners can view each other meal logs"
  ON meal_logs
  FOR SELECT
  USING (
    user_id IN (
      SELECT CASE WHEN requester_id = auth.uid() THEN receiver_id ELSE requester_id END
      FROM profile_connections
      WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
        AND status = 'accepted'
    )
  );

-- ============================================================
-- Trigger: auto-decrement servings_remaining when a meal is logged
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_dish_servings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.batch_dish_id IS NOT NULL THEN
    UPDATE batch_cook_dishes
    SET
      servings_remaining = GREATEST(0, servings_remaining - NEW.servings_consumed),
      updated_at = NOW()
    WHERE id = NEW.batch_dish_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_dish_servings
  AFTER INSERT ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION decrement_dish_servings();

-- Re-increment when a log is deleted (undo)
CREATE OR REPLACE FUNCTION increment_dish_servings_on_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.batch_dish_id IS NOT NULL THEN
    UPDATE batch_cook_dishes
    SET
      servings_remaining = LEAST(servings_cooked, servings_remaining + OLD.servings_consumed),
      updated_at = NOW()
    WHERE id = OLD.batch_dish_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_increment_dish_servings_on_delete
  AFTER DELETE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_dish_servings_on_delete();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_batch_cook_sessions_user_id  ON batch_cook_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_cook_sessions_cook_date ON batch_cook_sessions(cook_date DESC);
CREATE INDEX IF NOT EXISTS idx_batch_cook_dishes_session_id  ON batch_cook_dishes(session_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date           ON meal_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_logs_batch_dish          ON meal_logs(batch_dish_id);
