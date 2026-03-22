-- 005_challenge_system.sql
-- Challenge programs, daily structure, user progress
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. challenge_programs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.challenge_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    UUID,  -- FK added in 006 after partner_network exists
  title_de      TEXT NOT NULL,
  title_en      TEXT,
  description_de TEXT,
  description_en TEXT,
  duration_days INTEGER NOT NULL DEFAULT 21,
  difficulty    TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_public     BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS challenge_programs_active_idx
  ON public.challenge_programs (is_active);

DROP TRIGGER IF EXISTS challenge_programs_updated_at ON public.challenge_programs;
CREATE TRIGGER challenge_programs_updated_at
  BEFORE UPDATE ON public.challenge_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.challenge_programs ENABLE ROW LEVEL SECURITY;

-- authenticated can read active/public programs
DROP POLICY IF EXISTS "challenge_programs_auth_select" ON public.challenge_programs;
CREATE POLICY "challenge_programs_auth_select" ON public.challenge_programs
  FOR SELECT TO authenticated
  USING (is_active = true);

-- admin full access
DROP POLICY IF EXISTS "challenge_programs_admin_all" ON public.challenge_programs;
CREATE POLICY "challenge_programs_admin_all" ON public.challenge_programs
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 2. challenge_days (unique challenge_id + day_number)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.challenge_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  UUID NOT NULL REFERENCES public.challenge_programs(id) ON DELETE CASCADE,
  day_number    INTEGER NOT NULL CHECK (day_number > 0),
  title_de      TEXT,
  title_en      TEXT,
  description_de TEXT,
  description_en TEXT,
  workout_id    UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  content       JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_days_challenge_day_idx
  ON public.challenge_days (challenge_id, day_number);

DROP TRIGGER IF EXISTS challenge_days_updated_at ON public.challenge_days;
CREATE TRIGGER challenge_days_updated_at
  BEFORE UPDATE ON public.challenge_days
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.challenge_days ENABLE ROW LEVEL SECURITY;

-- authenticated can read
DROP POLICY IF EXISTS "challenge_days_auth_select" ON public.challenge_days;
CREATE POLICY "challenge_days_auth_select" ON public.challenge_days
  FOR SELECT TO authenticated
  USING (true);

-- admin full access
DROP POLICY IF EXISTS "challenge_days_admin_all" ON public.challenge_days;
CREATE POLICY "challenge_days_admin_all" ON public.challenge_days
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 3. user_challenge_progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  challenge_id      UUID NOT NULL REFERENCES public.challenge_programs(id) ON DELETE CASCADE,
  source_partner_id UUID,  -- FK added in 006 after partner_network exists
  current_day       INTEGER NOT NULL DEFAULT 1,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_challenge_progress_user_idx
  ON public.user_challenge_progress (user_id);
CREATE INDEX IF NOT EXISTS user_challenge_progress_challenge_idx
  ON public.user_challenge_progress (challenge_id);

DROP TRIGGER IF EXISTS user_challenge_progress_updated_at ON public.user_challenge_progress;
CREATE TRIGGER user_challenge_progress_updated_at
  BEFORE UPDATE ON public.user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- authenticated can manage own progress
DROP POLICY IF EXISTS "user_challenge_progress_auth_insert" ON public.user_challenge_progress;
CREATE POLICY "user_challenge_progress_auth_insert" ON public.user_challenge_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_challenge_progress_auth_select" ON public.user_challenge_progress;
CREATE POLICY "user_challenge_progress_auth_select" ON public.user_challenge_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_challenge_progress_auth_update" ON public.user_challenge_progress;
CREATE POLICY "user_challenge_progress_auth_update" ON public.user_challenge_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admin full access
DROP POLICY IF EXISTS "user_challenge_progress_admin_all" ON public.user_challenge_progress;
CREATE POLICY "user_challenge_progress_admin_all" ON public.user_challenge_progress
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

COMMIT;
