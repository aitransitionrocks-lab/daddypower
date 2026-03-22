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
