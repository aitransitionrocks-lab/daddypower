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
