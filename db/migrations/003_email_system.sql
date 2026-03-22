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
