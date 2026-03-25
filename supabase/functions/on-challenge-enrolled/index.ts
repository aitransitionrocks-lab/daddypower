// Supabase Edge Function: on-challenge-enrolled
// Sends confirmation email when user enrolls in a challenge

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

    const { userId, challengeId, source } = await req.json()

    if (!userId || !challengeId) {
      return new Response(JSON.stringify({ error: 'userId and challengeId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user email
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get challenge details
    const { data: challenge } = await supabaseAdmin
      .from('challenge_programs')
      .select('title_de, title_en, duration_days, partner_id')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const firstName = user.user_metadata?.first_name || ''
    const lang = user.user_metadata?.language || 'de'
    const title = lang === 'de' ? challenge.title_de : (challenge.title_en || challenge.title_de)
    const appUrl = Deno.env.get('APP_URL') || 'https://daddypower.vercel.app'

    // Send enrollment confirmation email
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      const subject = lang === 'de'
        ? `Du hast "${title}" gestartet!`
        : `You started "${title}"!`

      const html = lang === 'de'
        ? `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto">
            <h1 style="color:#1B1B19">${firstName ? `Hey ${firstName}` : 'Hey'},</h1>
            <p>Stark! Du hast die Challenge <strong>"${title}"</strong> gestartet.</p>
            <p><strong>${challenge.duration_days} Tage</strong> liegen vor dir. Jeden Tag ein kleiner Schritt – das reicht.</p>
            <p>Dein Tag 1 wartet:</p>
            <a href="${appUrl}/challenges/${challengeId}" style="display:inline-block;background:#BA7517;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Challenge öffnen →</a>
            <p style="margin-top:24px"><strong>Dein daddypower Team</strong></p>
          </div>`
        : `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto">
            <h1 style="color:#1B1B19">${firstName ? `Hey ${firstName}` : 'Hey'},</h1>
            <p>Strong! You started the challenge <strong>"${title}"</strong>.</p>
            <p><strong>${challenge.duration_days} days</strong> ahead. One small step each day – that's enough.</p>
            <p>Your Day 1 is waiting:</p>
            <a href="${appUrl}/challenges/${challengeId}" style="display:inline-block;background:#BA7517;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Open Challenge →</a>
            <p style="margin-top:24px"><strong>Your daddypower Team</strong></p>
          </div>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'daddypower <hallo@daddypower.de>',
          to: [user.email],
          subject,
          html,
        }),
      })
    }

    // If partner challenge: notify partner (aggregated, no member details)
    if (challenge.partner_id && source === 'partner') {
      const { data: partnerData } = await supabaseAdmin
        .from('partner_network')
        .select('user_id')
        .eq('id', challenge.partner_id)
        .single()

      if (partnerData) {
        const { data: { user: partnerUser } } = await supabaseAdmin.auth.admin.getUserById(partnerData.user_id)

        if (partnerUser?.email && resendApiKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: Deno.env.get('RESEND_FROM_EMAIL') || 'daddypower <hallo@daddypower.de>',
              to: [partnerUser.email],
              subject: `Jemand hat deine Challenge "${title}" gestartet!`,
              html: `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#1B1B19">Gute Nachricht!</h2>
                <p>Ein Partner aus deinem Netzwerk hat deine Challenge <strong>"${title}"</strong> gestartet.</p>
                <p>Schau dir den Fortschritt in deinem Partner-Dashboard an:</p>
                <a href="${appUrl}/partner/challenges/${challengeId}/stats" style="display:inline-block;background:#BA7517;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Stats ansehen →</a>
              </div>`,
            }),
          })
        }
      }
    }

    // Track event
    await supabaseAdmin.from('events').insert({
      event_name: 'challenge_enrolled',
      user_id: userId,
      properties: { challenge_id: challengeId, source: source || 'global' },
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Challenge enrollment error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to process enrollment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
