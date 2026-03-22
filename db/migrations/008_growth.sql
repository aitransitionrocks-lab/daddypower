-- 008_growth.sql
-- A/B experiments and user assignments
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. experiments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.experiments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  variants      JSONB NOT NULL DEFAULT '["control", "variant_a"]'::jsonb,
  traffic_pct   NUMERIC(5,2) DEFAULT 100.00
                CHECK (traffic_pct BETWEEN 0 AND 100),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  winner        TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS experiments_slug_idx
  ON public.experiments (slug);

DROP TRIGGER IF EXISTS experiments_updated_at ON public.experiments;
CREATE TRIGGER experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- admin full access
DROP POLICY IF EXISTS "experiments_admin_all" ON public.experiments;
CREATE POLICY "experiments_admin_all" ON public.experiments
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- authenticated can read running experiments (for client-side assignment)
DROP POLICY IF EXISTS "experiments_auth_select" ON public.experiments;
CREATE POLICY "experiments_auth_select" ON public.experiments
  FOR SELECT TO authenticated
  USING (status = 'running');

-- anon can read running experiments
DROP POLICY IF EXISTS "experiments_anon_select" ON public.experiments;
CREATE POLICY "experiments_anon_select" ON public.experiments
  FOR SELECT TO anon
  USING (status = 'running');

-- ============================================================================
-- 2. experiment_assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id   UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  user_id         UUID,
  lead_id         UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  anonymous_id    TEXT,
  variant         TEXT NOT NULL,
  converted       BOOLEAN DEFAULT false,
  converted_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiment_assignments_experiment_idx
  ON public.experiment_assignments (experiment_id);
CREATE INDEX IF NOT EXISTS experiment_assignments_user_idx
  ON public.experiment_assignments (user_id);
CREATE INDEX IF NOT EXISTS experiment_assignments_lead_idx
  ON public.experiment_assignments (lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS experiment_assignments_exp_user_idx
  ON public.experiment_assignments (experiment_id, user_id)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS experiment_assignments_exp_anon_idx
  ON public.experiment_assignments (experiment_id, anonymous_id)
  WHERE anonymous_id IS NOT NULL;

ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;

-- anon can insert (landing page experiments)
DROP POLICY IF EXISTS "experiment_assignments_anon_insert" ON public.experiment_assignments;
CREATE POLICY "experiment_assignments_anon_insert" ON public.experiment_assignments
  FOR INSERT TO anon
  WITH CHECK (true);

-- authenticated can insert and read own
DROP POLICY IF EXISTS "experiment_assignments_auth_insert" ON public.experiment_assignments;
CREATE POLICY "experiment_assignments_auth_insert" ON public.experiment_assignments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "experiment_assignments_auth_select" ON public.experiment_assignments;
CREATE POLICY "experiment_assignments_auth_select" ON public.experiment_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- admin full access
DROP POLICY IF EXISTS "experiment_assignments_admin_all" ON public.experiment_assignments;
CREATE POLICY "experiment_assignments_admin_all" ON public.experiment_assignments
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- service_role
DROP POLICY IF EXISTS "experiment_assignments_service_all" ON public.experiment_assignments;
CREATE POLICY "experiment_assignments_service_all" ON public.experiment_assignments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
