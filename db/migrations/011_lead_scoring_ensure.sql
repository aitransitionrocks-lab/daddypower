-- 011_lead_scoring_ensure.sql
-- Safety migration: ensure lead_scores table exists with IF NOT EXISTS
-- Also adds a segment column if missing.
-- ============================================================================

BEGIN;

-- Ensure lead_scores exists (should already from 007, but safety net)
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL DEFAULT 0,
  segment     TEXT DEFAULT 'cold'
              CHECK (segment IN ('cold', 'warm', 'hot')),
  factors     JSONB DEFAULT '{}'::jsonb,
  scored_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add segment column if it doesn't exist yet (007 didn't have it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_scores'
      AND column_name = 'segment'
  ) THEN
    ALTER TABLE public.lead_scores
      ADD COLUMN segment TEXT DEFAULT 'cold'
      CHECK (segment IN ('cold', 'warm', 'hot'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS lead_scores_lead_id_idx
  ON public.lead_scores (lead_id);

-- Add status column to leads if not present (for CRM tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN status TEXT DEFAULT 'waitlist'
      CHECK (status IN ('waitlist', 'email_sequence', 'converted', 'unsubscribed'));
  END IF;
END
$$;

COMMIT;
