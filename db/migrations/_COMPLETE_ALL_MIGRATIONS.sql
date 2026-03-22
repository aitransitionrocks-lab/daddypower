-- 001_initial_baseline.sql
-- Idempotent baseline: drops legacy tables, creates leads, events, quiz_results, content_assets
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. updated_at trigger function (used by many tables)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. Deprecate / drop legacy tables
-- ============================================================================
ALTER TABLE IF EXISTS public.result_videos RENAME TO _deprecated_result_videos;

DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.leads  CASCADE;

-- ============================================================================
-- 2. leads
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  name        TEXT,
  result_type TEXT CHECK (result_type IN (
                'leerer_akku',
                'funktionierer',
                'stiller_kaempfer',
                'performer_auf_reserve'
              )),
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term    TEXT,
  ip_hash     TEXT,
  user_agent  TEXT,
  language    TEXT DEFAULT 'de',
  partner_id  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- anon can insert (quiz / landing page)
DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;
CREATE POLICY "leads_anon_insert" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- admin full access
DROP POLICY IF EXISTS "leads_admin_all" ON public.leads;
CREATE POLICY "leads_admin_all" ON public.leads
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 3. events (analytics / tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  user_id     UUID,
  event_name  TEXT NOT NULL,
  properties  JSONB DEFAULT '{}'::jsonb,
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term    TEXT,
  ip_hash     TEXT,
  user_agent  TEXT,
  language    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_lead_id_idx   ON public.events (lead_id);
CREATE INDEX IF NOT EXISTS events_user_id_idx   ON public.events (user_id);
CREATE INDEX IF NOT EXISTS events_name_idx      ON public.events (event_name);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON public.events (created_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- anon can insert events (tracking pixel, quiz)
DROP POLICY IF EXISTS "events_anon_insert" ON public.events;
CREATE POLICY "events_anon_insert" ON public.events
  FOR INSERT TO anon
  WITH CHECK (true);

-- authenticated can insert own events
DROP POLICY IF EXISTS "events_auth_insert" ON public.events;
CREATE POLICY "events_auth_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- admin full access
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
CREATE POLICY "events_admin_all" ON public.events
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 4. quiz_results
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id     UUID,
  answers     JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_type TEXT CHECK (result_type IN (
                'leerer_akku',
                'funktionierer',
                'stiller_kaempfer',
                'performer_auf_reserve'
              )),
  score       INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quiz_results_lead_id_idx ON public.quiz_results (lead_id);
CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx ON public.quiz_results (user_id);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- anon can insert (quiz submission)
DROP POLICY IF EXISTS "quiz_results_anon_insert" ON public.quiz_results;
CREATE POLICY "quiz_results_anon_insert" ON public.quiz_results
  FOR INSERT TO anon
  WITH CHECK (true);

-- authenticated can read own
DROP POLICY IF EXISTS "quiz_results_auth_select" ON public.quiz_results;
CREATE POLICY "quiz_results_auth_select" ON public.quiz_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- admin full access
DROP POLICY IF EXISTS "quiz_results_admin_all" ON public.quiz_results;
CREATE POLICY "quiz_results_admin_all" ON public.quiz_results
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- ============================================================================
-- 5. content_assets (replaces result_videos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_type  TEXT NOT NULL CHECK (result_type IN (
                 'leerer_akku',
                 'funktionierer',
                 'stiller_kaempfer',
                 'performer_auf_reserve'
               )),
  asset_type   TEXT NOT NULL DEFAULT 'video',
  language     TEXT NOT NULL DEFAULT 'de',
  url          TEXT NOT NULL,
  title        TEXT,
  description  TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_assets_type_lang_idx
  ON public.content_assets (result_type, asset_type, language);

DROP TRIGGER IF EXISTS content_assets_updated_at ON public.content_assets;
CREATE TRIGGER content_assets_updated_at
  BEFORE UPDATE ON public.content_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;

-- anon can read active assets
DROP POLICY IF EXISTS "content_assets_anon_select" ON public.content_assets;
CREATE POLICY "content_assets_anon_select" ON public.content_assets
  FOR SELECT TO anon
  USING (is_active = true);

-- authenticated can read active assets
DROP POLICY IF EXISTS "content_assets_auth_select" ON public.content_assets;
CREATE POLICY "content_assets_auth_select" ON public.content_assets
  FOR SELECT TO authenticated
  USING (is_active = true);

-- admin full access
DROP POLICY IF EXISTS "content_assets_admin_all" ON public.content_assets;
CREATE POLICY "content_assets_admin_all" ON public.content_assets
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

COMMIT;
-- 002_auth_subscriptions.sql
-- Subscriptions table (Stripe integration) and is_active_member() helper
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id       TEXT,
  status                TEXT NOT NULL DEFAULT 'inactive'
                        CHECK (status IN (
                          'active', 'inactive', 'trialing', 'past_due',
                          'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
                        )),
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT false,
  canceled_at           TIMESTAMPTZ,
  trial_start           TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,
  metadata              JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx
  ON public.subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx
  ON public.subscriptions (stripe_subscription_id);

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- authenticated can read own subscription
DROP POLICY IF EXISTS "subscriptions_auth_select" ON public.subscriptions;
CREATE POLICY "subscriptions_auth_select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- admin full access
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- service_role can manage (Stripe webhooks)
DROP POLICY IF EXISTS "subscriptions_service_all" ON public.subscriptions;
CREATE POLICY "subscriptions_service_all" ON public.subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. is_active_member() helper
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_active_member(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = check_user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMIT;
-- 003_email_system.sql
-- Email queue with scheduling and unsubscribes with token
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. email_queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  user_id       UUID,
  to_email      TEXT NOT NULL,
  to_name       TEXT,
  subject       TEXT NOT NULL,
  template_id   TEXT,
  template_data JSONB DEFAULT '{}'::jsonb,
  html_body     TEXT,
  text_body     TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  scheduled_at  TIMESTAMPTZ DEFAULT NOW(),
  sent_at       TIMESTAMPTZ,
  error_message TEXT,
  retry_count   INTEGER DEFAULT 0,
  max_retries   INTEGER DEFAULT 3,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_queue_status_scheduled_idx
  ON public.email_queue (status, scheduled_at);
CREATE INDEX IF NOT EXISTS email_queue_lead_id_idx
  ON public.email_queue (lead_id);
CREATE INDEX IF NOT EXISTS email_queue_user_id_idx
  ON public.email_queue (user_id);
CREATE INDEX IF NOT EXISTS email_queue_to_email_idx
  ON public.email_queue (to_email);

DROP TRIGGER IF EXISTS email_queue_updated_at ON public.email_queue;
CREATE TRIGGER email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- admin full access
DROP POLICY IF EXISTS "email_queue_admin_all" ON public.email_queue;
CREATE POLICY "email_queue_admin_all" ON public.email_queue
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

-- service_role can manage (edge functions / cron)
DROP POLICY IF EXISTS "email_queue_service_all" ON public.email_queue;
CREATE POLICY "email_queue_service_all" ON public.email_queue
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. unsubscribes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.unsubscribes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  lead_id     UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  token       TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  reason      TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unsubscribes_email_idx
  ON public.unsubscribes (email);
CREATE UNIQUE INDEX IF NOT EXISTS unsubscribes_token_idx
  ON public.unsubscribes (token);

ALTER TABLE public.unsubscribes ENABLE ROW LEVEL SECURITY;

-- anon can insert (unsubscribe link)
DROP POLICY IF EXISTS "unsubscribes_anon_insert" ON public.unsubscribes;
CREATE POLICY "unsubscribes_anon_insert" ON public.unsubscribes
  FOR INSERT TO anon
  WITH CHECK (true);

-- anon can read by token (verify unsubscribe)
DROP POLICY IF EXISTS "unsubscribes_anon_select" ON public.unsubscribes;
CREATE POLICY "unsubscribes_anon_select" ON public.unsubscribes
  FOR SELECT TO anon
  USING (true);

-- admin full access
DROP POLICY IF EXISTS "unsubscribes_admin_all" ON public.unsubscribes;
CREATE POLICY "unsubscribes_admin_all" ON public.unsubscribes
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('super_admin', 'operator')
  );

COMMIT;
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
