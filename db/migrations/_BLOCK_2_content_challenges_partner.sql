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
-- 006_partner_network.sql
-- Partner network (recursive tree), invite tokens, partner challenges,
-- license tiers with seed data, partner billing, helper functions,
-- and deferred FK constraints from 005
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. partner_network (recursive tree with self-referencing parent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_network (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  parent_partner_id UUID REFERENCES public.partner_network(id) ON DELETE SET NULL,
  company_name      TEXT,
  contact_name      TEXT,
  contact_email     TEXT NOT NULL,
  phone             TEXT,
  website           TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  tier              TEXT NOT NULL DEFAULT 'free',
  commission_rate   NUMERIC(5,4) DEFAULT 0.0,
  total_referrals   INTEGER DEFAULT 0,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_network_user_id_idx
  ON public.partner_network (user_id);
CREATE INDEX IF NOT EXISTS partner_network_parent_idx
  ON public.partner_network (parent_partner_id);
CREATE INDEX IF NOT EXISTS partner_network_status_idx
  ON public.partner_network (status);

DROP TRIGGER IF EXISTS partner_network_updated_at ON public.partner_network;
CREATE TRIGGER partner_network_updated_at
  BEFORE UPDATE ON public.partner_network
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partner_network ENABLE ROW LEVEL SECURITY;

-- authenticated can read own partner record
DROP POLICY IF EXISTS "partner_network_auth_select" ON public.partner_network;
CREATE POLICY "partner_network_auth_select" ON public.partner_network
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- authenticated can update own
DROP POLICY IF EXISTS "partner_network_auth_update" ON public.partner_network;
CREATE POLICY "partner_network_auth_update" ON public.partner_network
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admin full access
DROP POLICY IF EXISTS "partner_network_admin_all" ON public.partner_network;
CREATE POLICY "partner_network_admin_all" ON public.partner_network
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 2. get_full_downline() recursive function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_full_downline(root_partner_id UUID)
RETURNS TABLE (
  partner_id        UUID,
  user_id           UUID,
  parent_partner_id UUID,
  depth             INTEGER,
  contact_name      TEXT,
  contact_email     TEXT,
  status            TEXT,
  tier              TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE downline AS (
    SELECT
      pn.id AS partner_id,
      pn.user_id,
      pn.parent_partner_id,
      0 AS depth,
      pn.contact_name,
      pn.contact_email,
      pn.status,
      pn.tier
    FROM public.partner_network pn
    WHERE pn.id = root_partner_id

    UNION ALL

    SELECT
      pn.id AS partner_id,
      pn.user_id,
      pn.parent_partner_id,
      d.depth + 1,
      pn.contact_name,
      pn.contact_email,
      pn.status,
      pn.tier
    FROM public.partner_network pn
    INNER JOIN downline d ON pn.parent_partner_id = d.partner_id
  )
  SELECT * FROM downline;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. invite_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    UUID NOT NULL REFERENCES public.partner_network(id) ON DELETE CASCADE,
  token         TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  max_uses      INTEGER DEFAULT 1,
  times_used    INTEGER DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS invite_tokens_token_idx
  ON public.invite_tokens (token);
CREATE INDEX IF NOT EXISTS invite_tokens_partner_idx
  ON public.invite_tokens (partner_id);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- authenticated partner can manage own tokens
DROP POLICY IF EXISTS "invite_tokens_auth_select" ON public.invite_tokens;
CREATE POLICY "invite_tokens_auth_select" ON public.invite_tokens
  FOR SELECT TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM public.partner_network WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invite_tokens_auth_insert" ON public.invite_tokens;
CREATE POLICY "invite_tokens_auth_insert" ON public.invite_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partner_network WHERE user_id = auth.uid()
    )
  );

-- anon can read (validate token on signup)
DROP POLICY IF EXISTS "invite_tokens_anon_select" ON public.invite_tokens;
CREATE POLICY "invite_tokens_anon_select" ON public.invite_tokens
  FOR SELECT TO anon
  USING (is_active = true);

-- admin full access
DROP POLICY IF EXISTS "invite_tokens_admin_all" ON public.invite_tokens;
CREATE POLICY "invite_tokens_admin_all" ON public.invite_tokens
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 4. validate_invite_token()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token TEXT)
RETURNS TABLE (
  is_valid    BOOLEAN,
  partner_id  UUID,
  message     TEXT
) AS $$
DECLARE
  v_token RECORD;
BEGIN
  SELECT * INTO v_token
  FROM public.invite_tokens it
  WHERE it.token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Token not found'::TEXT;
    RETURN;
  END IF;

  IF NOT v_token.is_active THEN
    RETURN QUERY SELECT false, v_token.partner_id, 'Token is inactive'::TEXT;
    RETURN;
  END IF;

  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < NOW() THEN
    RETURN QUERY SELECT false, v_token.partner_id, 'Token has expired'::TEXT;
    RETURN;
  END IF;

  IF v_token.max_uses IS NOT NULL AND v_token.times_used >= v_token.max_uses THEN
    RETURN QUERY SELECT false, v_token.partner_id, 'Token usage limit reached'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_token.partner_id, 'Token is valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 5. use_invite_token()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.use_invite_token(p_token TEXT)
RETURNS TABLE (
  success     BOOLEAN,
  partner_id  UUID,
  message     TEXT
) AS $$
DECLARE
  v_validation RECORD;
  v_partner_id UUID;
BEGIN
  -- Validate first
  SELECT * INTO v_validation
  FROM public.validate_invite_token(p_token);

  IF NOT v_validation.is_valid THEN
    RETURN QUERY SELECT false, v_validation.partner_id, v_validation.message;
    RETURN;
  END IF;

  -- Increment usage
  UPDATE public.invite_tokens it
  SET times_used = times_used + 1,
      is_active = CASE
        WHEN max_uses IS NOT NULL AND times_used + 1 >= max_uses THEN false
        ELSE is_active
      END
  WHERE it.token = p_token
  RETURNING it.partner_id INTO v_partner_id;

  RETURN QUERY SELECT true, v_partner_id, 'Token used successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. partner_challenges
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    UUID NOT NULL REFERENCES public.partner_network(id) ON DELETE CASCADE,
  challenge_id  UUID NOT NULL REFERENCES public.challenge_programs(id) ON DELETE CASCADE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  custom_title  TEXT,
  custom_desc   TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_challenges_partner_challenge_idx
  ON public.partner_challenges (partner_id, challenge_id);

DROP TRIGGER IF EXISTS partner_challenges_updated_at ON public.partner_challenges;
CREATE TRIGGER partner_challenges_updated_at
  BEFORE UPDATE ON public.partner_challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partner_challenges ENABLE ROW LEVEL SECURITY;

-- authenticated partner can manage own
DROP POLICY IF EXISTS "partner_challenges_auth_select" ON public.partner_challenges;
CREATE POLICY "partner_challenges_auth_select" ON public.partner_challenges
  FOR SELECT TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM public.partner_network WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "partner_challenges_auth_insert" ON public.partner_challenges;
CREATE POLICY "partner_challenges_auth_insert" ON public.partner_challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partner_network WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "partner_challenges_auth_update" ON public.partner_challenges;
CREATE POLICY "partner_challenges_auth_update" ON public.partner_challenges
  FOR UPDATE TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM public.partner_network WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partner_network WHERE user_id = auth.uid()
    )
  );

-- admin full access
DROP POLICY IF EXISTS "partner_challenges_admin_all" ON public.partner_challenges;
CREATE POLICY "partner_challenges_admin_all" ON public.partner_challenges
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 7. partner_license_tiers WITH seed data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_license_tiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  max_members     INTEGER,
  max_challenges  INTEGER,
  price_monthly   NUMERIC(10,2) DEFAULT 0,
  price_yearly    NUMERIC(10,2) DEFAULT 0,
  features        JSONB DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_license_tiers_slug_idx
  ON public.partner_license_tiers (slug);

DROP TRIGGER IF EXISTS partner_license_tiers_updated_at ON public.partner_license_tiers;
CREATE TRIGGER partner_license_tiers_updated_at
  BEFORE UPDATE ON public.partner_license_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partner_license_tiers ENABLE ROW LEVEL SECURITY;

-- anyone can read tiers
DROP POLICY IF EXISTS "partner_license_tiers_anon_select" ON public.partner_license_tiers;
CREATE POLICY "partner_license_tiers_anon_select" ON public.partner_license_tiers
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "partner_license_tiers_auth_select" ON public.partner_license_tiers;
CREATE POLICY "partner_license_tiers_auth_select" ON public.partner_license_tiers
  FOR SELECT TO authenticated
  USING (is_active = true);

-- admin full access
DROP POLICY IF EXISTS "partner_license_tiers_admin_all" ON public.partner_license_tiers;
CREATE POLICY "partner_license_tiers_admin_all" ON public.partner_license_tiers
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- Seed data (idempotent using ON CONFLICT)
INSERT INTO public.partner_license_tiers (name, slug, max_members, max_challenges, price_monthly, price_yearly, sort_order)
VALUES
  ('Free',    'free',    10,   1,    0.00,     0.00,   0),
  ('Starter', 'starter', 50,   3,   29.00,   290.00,   1),
  ('Growth',  'growth',  200,  10,  79.00,   790.00,   2),
  ('Pro',     'pro',     1000, 50,  199.00,  1990.00,  3),
  ('Scale',   'scale',   NULL, NULL, 499.00, 4990.00,  4)
ON CONFLICT (slug) DO UPDATE SET
  name           = EXCLUDED.name,
  max_members    = EXCLUDED.max_members,
  max_challenges = EXCLUDED.max_challenges,
  price_monthly  = EXCLUDED.price_monthly,
  price_yearly   = EXCLUDED.price_yearly,
  sort_order     = EXCLUDED.sort_order;

-- ============================================================================
-- 8. partner_billing
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_billing (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id             UUID NOT NULL REFERENCES public.partner_network(id) ON DELETE CASCADE,
  license_tier_id        UUID REFERENCES public.partner_license_tiers(id),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  status                 TEXT NOT NULL DEFAULT 'inactive'
                         CHECK (status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  metadata               JSONB DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_billing_partner_idx
  ON public.partner_billing (partner_id);
CREATE INDEX IF NOT EXISTS partner_billing_stripe_idx
  ON public.partner_billing (stripe_customer_id);

DROP TRIGGER IF EXISTS partner_billing_updated_at ON public.partner_billing;
CREATE TRIGGER partner_billing_updated_at
  BEFORE UPDATE ON public.partner_billing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partner_billing ENABLE ROW LEVEL SECURITY;

-- authenticated partner can read own billing
DROP POLICY IF EXISTS "partner_billing_auth_select" ON public.partner_billing;
CREATE POLICY "partner_billing_auth_select" ON public.partner_billing
  FOR SELECT TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM public.partner_network WHERE user_id = auth.uid()
    )
  );

-- admin full access
DROP POLICY IF EXISTS "partner_billing_admin_all" ON public.partner_billing;
CREATE POLICY "partner_billing_admin_all" ON public.partner_billing
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- service_role (Stripe webhooks)
DROP POLICY IF EXISTS "partner_billing_service_all" ON public.partner_billing;
CREATE POLICY "partner_billing_service_all" ON public.partner_billing
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. get_partner_license_tier() helper
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_partner_license_tier(p_partner_id UUID)
RETURNS TABLE (
  tier_name       TEXT,
  tier_slug       TEXT,
  max_members     INTEGER,
  max_challenges  INTEGER,
  is_billing_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    plt.name,
    plt.slug,
    plt.max_members,
    plt.max_challenges,
    (pb.status = 'active' OR pb.status = 'trialing') AS is_billing_active
  FROM public.partner_billing pb
  LEFT JOIN public.partner_license_tiers plt ON plt.id = pb.license_tier_id
  WHERE pb.partner_id = p_partner_id;

  -- If no billing record, return free tier
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      plt.name,
      plt.slug,
      plt.max_members,
      plt.max_challenges,
      false AS is_billing_active
    FROM public.partner_license_tiers plt
    WHERE plt.slug = 'free';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 10. Add deferred FK constraints to tables from 005
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'challenge_programs_partner_id_fkey'
      AND table_name = 'challenge_programs'
  ) THEN
    ALTER TABLE public.challenge_programs
      ADD CONSTRAINT challenge_programs_partner_id_fkey
      FOREIGN KEY (partner_id) REFERENCES public.partner_network(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_challenge_progress_source_partner_id_fkey'
      AND table_name = 'user_challenge_progress'
  ) THEN
    ALTER TABLE public.user_challenge_progress
      ADD CONSTRAINT user_challenge_progress_source_partner_id_fkey
      FOREIGN KEY (source_partner_id) REFERENCES public.partner_network(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
