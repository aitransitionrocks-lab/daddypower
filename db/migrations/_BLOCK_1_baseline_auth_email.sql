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
