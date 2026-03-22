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
