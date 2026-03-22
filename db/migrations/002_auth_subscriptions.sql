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
