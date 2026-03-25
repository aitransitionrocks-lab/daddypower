-- 012_partner_challenge_rls.sql
-- RLS policies for partner-created challenges
-- ============================================================================

BEGIN;

-- Partner can create non-global challenges
CREATE POLICY IF NOT EXISTS "challenges_partner_create" ON challenge_programs
  FOR INSERT TO authenticated
  WITH CHECK (
    is_global = false AND
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('partner', 'super_admin', 'operator')
  );

-- Partner can edit own challenges
CREATE POLICY IF NOT EXISTS "challenges_partner_edit_own" ON challenge_programs
  FOR UPDATE TO authenticated
  USING (
    partner_id = (SELECT id FROM partner_network WHERE user_id = auth.uid())
  );

COMMIT;
