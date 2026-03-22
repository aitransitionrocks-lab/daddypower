-- 004_workout_content.sql
-- Workouts (bilingual, equipment, exercises), progress_logs, check_ins
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. workouts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_de      TEXT NOT NULL,
  title_en      TEXT,
  description_de TEXT,
  description_en TEXT,
  category      TEXT,
  difficulty    TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_min  INTEGER,
  equipment     TEXT[] DEFAULT '{}',
  exercises     JSONB NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  video_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workouts_category_idx ON public.workouts (category);
CREATE INDEX IF NOT EXISTS workouts_active_idx   ON public.workouts (is_active);

DROP TRIGGER IF EXISTS workouts_updated_at ON public.workouts;
CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- authenticated members can read active workouts
DROP POLICY IF EXISTS "workouts_auth_select" ON public.workouts;
CREATE POLICY "workouts_auth_select" ON public.workouts
  FOR SELECT TO authenticated
  USING (is_active = true);

-- admin full access
DROP POLICY IF EXISTS "workouts_admin_all" ON public.workouts;
CREATE POLICY "workouts_admin_all" ON public.workouts
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 2. progress_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  workout_id  UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  duration_sec INTEGER,
  completed   BOOLEAN DEFAULT false,
  notes       TEXT,
  metrics     JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS progress_logs_user_id_idx
  ON public.progress_logs (user_id);
CREATE INDEX IF NOT EXISTS progress_logs_workout_id_idx
  ON public.progress_logs (workout_id);
CREATE INDEX IF NOT EXISTS progress_logs_created_at_idx
  ON public.progress_logs (user_id, created_at);

ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- authenticated can insert own
DROP POLICY IF EXISTS "progress_logs_auth_insert" ON public.progress_logs;
CREATE POLICY "progress_logs_auth_insert" ON public.progress_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- authenticated can read own
DROP POLICY IF EXISTS "progress_logs_auth_select" ON public.progress_logs;
CREATE POLICY "progress_logs_auth_select" ON public.progress_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- admin full access
DROP POLICY IF EXISTS "progress_logs_admin_all" ON public.progress_logs;
CREATE POLICY "progress_logs_admin_all" ON public.progress_logs
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 3. check_ins (daily, unique per user per day)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.check_ins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  check_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  mood        INTEGER CHECK (mood BETWEEN 1 AND 10),
  energy      INTEGER CHECK (energy BETWEEN 1 AND 10),
  sleep_hours NUMERIC(3,1),
  notes       TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS check_ins_user_date_idx
  ON public.check_ins (user_id, check_date);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- authenticated can insert own
DROP POLICY IF EXISTS "check_ins_auth_insert" ON public.check_ins;
CREATE POLICY "check_ins_auth_insert" ON public.check_ins
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- authenticated can read own
DROP POLICY IF EXISTS "check_ins_auth_select" ON public.check_ins;
CREATE POLICY "check_ins_auth_select" ON public.check_ins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- authenticated can update own
DROP POLICY IF EXISTS "check_ins_auth_update" ON public.check_ins;
CREATE POLICY "check_ins_auth_update" ON public.check_ins
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admin full access
DROP POLICY IF EXISTS "check_ins_admin_all" ON public.check_ins;
CREATE POLICY "check_ins_admin_all" ON public.check_ins
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

COMMIT;
