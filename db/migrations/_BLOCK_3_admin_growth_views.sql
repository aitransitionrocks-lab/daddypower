-- 007_admin_extensions.sql
-- Admin notes and lead scores
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. admin_notes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id     UUID,
  partner_id  UUID REFERENCES public.partner_network(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL,
  note        TEXT NOT NULL,
  note_type   TEXT DEFAULT 'general'
              CHECK (note_type IN ('general', 'support', 'billing', 'compliance', 'internal')),
  is_pinned   BOOLEAN DEFAULT false,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_notes_lead_id_idx
  ON public.admin_notes (lead_id);
CREATE INDEX IF NOT EXISTS admin_notes_user_id_idx
  ON public.admin_notes (user_id);
CREATE INDEX IF NOT EXISTS admin_notes_partner_id_idx
  ON public.admin_notes (partner_id);
CREATE INDEX IF NOT EXISTS admin_notes_author_id_idx
  ON public.admin_notes (author_id);

DROP TRIGGER IF EXISTS admin_notes_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- admin full access
DROP POLICY IF EXISTS "admin_notes_admin_all" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_all" ON public.admin_notes
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 2. lead_scores
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL DEFAULT 0,
  factors     JSONB DEFAULT '{}'::jsonb,
  scored_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_scores_lead_id_idx
  ON public.lead_scores (lead_id);

DROP TRIGGER IF EXISTS lead_scores_updated_at ON public.lead_scores;
CREATE TRIGGER lead_scores_updated_at
  BEFORE UPDATE ON public.lead_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;

-- admin full access
DROP POLICY IF EXISTS "lead_scores_admin_all" ON public.lead_scores;
CREATE POLICY "lead_scores_admin_all" ON public.lead_scores
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- service_role (scoring functions)
DROP POLICY IF EXISTS "lead_scores_service_all" ON public.lead_scores;
CREATE POLICY "lead_scores_service_all" ON public.lead_scores
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
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
-- 009_views.sql
-- Analytical views: v_funnel_daily, v_partner_overview, v_members
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. v_funnel_daily — daily funnel metrics
-- ============================================================================
CREATE OR REPLACE VIEW public.v_funnel_daily AS
SELECT
  d.day,
  -- Leads
  COALESCE(l.new_leads, 0)           AS new_leads,
  -- Quiz completions
  COALESCE(q.quiz_completions, 0)    AS quiz_completions,
  -- Events breakdown
  COALESCE(e.page_views, 0)          AS page_views,
  COALESCE(e.quiz_starts, 0)         AS quiz_starts,
  COALESCE(e.video_views, 0)         AS video_views,
  COALESCE(e.cta_clicks, 0)          AS cta_clicks,
  -- Signups (auth.users created that day)
  COALESCE(e.signup_events, 0)       AS signup_events,
  -- Subscriptions
  COALESCE(s.new_subscriptions, 0)   AS new_subscriptions
FROM (
  -- Generate a date series for the last 90 days
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE,
    '1 day'::interval
  )::date AS day
) d
LEFT JOIN (
  SELECT created_at::date AS day, COUNT(*) AS new_leads
  FROM public.leads
  GROUP BY created_at::date
) l ON l.day = d.day
LEFT JOIN (
  SELECT created_at::date AS day, COUNT(*) AS quiz_completions
  FROM public.quiz_results
  GROUP BY created_at::date
) q ON q.day = d.day
LEFT JOIN (
  SELECT
    created_at::date AS day,
    COUNT(*) FILTER (WHERE event_name = 'page_view')   AS page_views,
    COUNT(*) FILTER (WHERE event_name = 'quiz_start')  AS quiz_starts,
    COUNT(*) FILTER (WHERE event_name = 'video_view')  AS video_views,
    COUNT(*) FILTER (WHERE event_name = 'cta_click')   AS cta_clicks,
    COUNT(*) FILTER (WHERE event_name = 'signup')      AS signup_events
  FROM public.events
  GROUP BY created_at::date
) e ON e.day = d.day
LEFT JOIN (
  SELECT created_at::date AS day, COUNT(*) AS new_subscriptions
  FROM public.subscriptions
  WHERE status IN ('active', 'trialing')
  GROUP BY created_at::date
) s ON s.day = d.day
ORDER BY d.day DESC;

-- ============================================================================
-- 2. v_partner_overview — partner dashboard summary
-- ============================================================================
CREATE OR REPLACE VIEW public.v_partner_overview AS
SELECT
  pn.id                AS partner_id,
  pn.user_id,
  pn.contact_name,
  pn.contact_email,
  pn.company_name,
  pn.status,
  pn.tier,
  pn.commission_rate,
  pn.created_at        AS partner_since,
  -- License tier info
  plt.name             AS license_tier_name,
  plt.max_members      AS tier_max_members,
  plt.max_challenges   AS tier_max_challenges,
  pb.status            AS billing_status,
  -- Counts
  COALESCE(dl.downline_count, 0)        AS downline_count,
  COALESCE(it.active_invite_tokens, 0)  AS active_invite_tokens,
  COALESCE(pc.active_challenges, 0)     AS active_challenges,
  -- Referral leads
  COALESCE(rl.referred_leads, 0)        AS referred_leads
FROM public.partner_network pn
LEFT JOIN public.partner_billing pb ON pb.partner_id = pn.id
LEFT JOIN public.partner_license_tiers plt ON plt.id = pb.license_tier_id
LEFT JOIN (
  SELECT parent_partner_id, COUNT(*) AS downline_count
  FROM public.partner_network
  WHERE parent_partner_id IS NOT NULL
  GROUP BY parent_partner_id
) dl ON dl.parent_partner_id = pn.id
LEFT JOIN (
  SELECT partner_id, COUNT(*) AS active_invite_tokens
  FROM public.invite_tokens
  WHERE is_active = true
  GROUP BY partner_id
) it ON it.partner_id = pn.id
LEFT JOIN (
  SELECT partner_id, COUNT(*) AS active_challenges
  FROM public.partner_challenges
  WHERE is_active = true
  GROUP BY partner_id
) pc ON pc.partner_id = pn.id
LEFT JOIN (
  SELECT partner_id, COUNT(*) AS referred_leads
  FROM public.leads
  WHERE partner_id IS NOT NULL
  GROUP BY partner_id
) rl ON rl.partner_id = pn.id;

-- ============================================================================
-- 3. v_members — member overview for admin
-- ============================================================================
CREATE OR REPLACE VIEW public.v_members AS
SELECT
  s.user_id,
  s.status              AS subscription_status,
  s.stripe_customer_id,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at          AS member_since,
  -- Quiz result
  qr.result_type,
  -- Activity stats
  COALESCE(pl.total_workouts, 0)      AS total_workouts,
  pl.last_workout_at,
  COALESCE(ci.total_check_ins, 0)     AS total_check_ins,
  ci.last_check_in,
  -- Challenge progress
  COALESCE(cp.active_challenges, 0)   AS active_challenges,
  COALESCE(cp.completed_challenges, 0) AS completed_challenges,
  -- Lead score
  ls.score                            AS lead_score
FROM public.subscriptions s
LEFT JOIN LATERAL (
  SELECT result_type
  FROM public.quiz_results
  WHERE user_id = s.user_id
  ORDER BY created_at DESC
  LIMIT 1
) qr ON true
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS total_workouts,
    MAX(created_at) AS last_workout_at
  FROM public.progress_logs
  GROUP BY user_id
) pl ON pl.user_id = s.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS total_check_ins,
    MAX(check_date) AS last_check_in
  FROM public.check_ins
  GROUP BY user_id
) ci ON ci.user_id = s.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE status = 'active')    AS active_challenges,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_challenges
  FROM public.user_challenge_progress
  GROUP BY user_id
) cp ON cp.user_id = s.user_id
LEFT JOIN public.lead_scores ls ON ls.lead_id = (
  SELECT id FROM public.leads WHERE email = (
    SELECT email FROM auth.users WHERE id = s.user_id
  )
);

COMMIT;
