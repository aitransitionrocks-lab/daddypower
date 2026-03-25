// Supabase Edge Function: partner-billing-check
// Runs monthly via pg_cron — checks active downline and assigns license tier

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Optional: check specific partner (from admin manual trigger)
    let targetPartnerId: string | null = null
    try {
      const body = await req.json()
      targetPartnerId = body.partnerId || null
    } catch { /* no body = check all */ }

    // Get all active partners (or specific one)
    let query = supabaseAdmin
      .from('partner_network')
      .select('id, user_id, status')
      .eq('status', 'active')

    if (targetPartnerId) {
      query = query.eq('id', targetPartnerId)
    }

    const { data: partners } = await query

    if (!partners || partners.length === 0) {
      return new Response(JSON.stringify({ checked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let checked = 0
    let upgraded = 0
    let downgraded = 0

    for (const partner of partners) {
      // Count active downline
      const { data: downline } = await supabaseAdmin
        .rpc('get_full_downline', {
          root_partner_id: partner.id,
          include_status: 'active',
        })

      const activeCount = downline?.length || 0

      // Get correct tier
      const { data: tier } = await supabaseAdmin
        .rpc('get_partner_license_tier', { active_count: activeCount })

      // Get current billing
      const { data: currentBilling } = await supabaseAdmin
        .from('partner_billing')
        .select('id, current_tier_id, active_downline_count, billing_status')
        .eq('partner_id', partner.id)
        .single()

      const tierId = tier?.id || null
      const tierChanged = currentBilling?.current_tier_id !== tierId

      // Upsert billing
      await supabaseAdmin
        .from('partner_billing')
        .upsert({
          partner_id: partner.id,
          current_tier_id: tierId,
          active_downline_count: activeCount,
          last_checked_at: new Date().toISOString(),
          billing_status: (tier?.price_monthly || 0) > 0 ? 'billed' : 'free',
        }, { onConflict: 'partner_id' })

      if (tierChanged) {
        await supabaseAdmin.from('events').insert({
          event_name: 'partner_tier_changed',
          user_id: partner.user_id,
          properties: {
            old_tier: currentBilling?.current_tier_id,
            new_tier: tierId,
            active_count: activeCount,
          },
        })

        if (activeCount > (currentBilling?.active_downline_count || 0)) {
          upgraded++
        } else {
          downgraded++
        }
      }

      checked++
    }

    return new Response(
      JSON.stringify({ checked, upgraded, downgraded }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Billing check error:', err)
    return new Response(
      JSON.stringify({ error: 'Billing check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
