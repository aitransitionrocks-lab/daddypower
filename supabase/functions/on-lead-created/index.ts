// Supabase Edge Function: on-lead-created
// Triggered after a new lead signs up via waitlist
// 1. Sends welcome email immediately via Resend
// 2. Schedules 4 follow-up emails in email_queue

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// E-Mail-Sequenz: Zeitabstände in Tagen
const SEQUENCE_SCHEDULE = [
  { step: 1, delayDays: 0, subject_de: 'Willkommen bei daddypower – Dein Ergebnis', subject_en: 'Welcome to daddypower – Your Result' },
  { step: 2, delayDays: 2, subject_de: 'Dein größter Energiekiller – und was du tun kannst', subject_en: 'Your biggest energy killer – and what you can do' },
  { step: 3, delayDays: 4, subject_de: 'Wie Marc es geschafft hat (und du es auch kannst)', subject_en: 'How Marc did it (and how you can too)' },
  { step: 4, delayDays: 6, subject_de: 'Dein Plan für mehr Kraft im Alltag', subject_en: 'Your plan for more energy in daily life' },
  { step: 5, delayDays: 9, subject_de: 'Letzte Chance: Bist du dabei?', subject_en: 'Last chance: Are you in?' },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { leadId } = await req.json()

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'leadId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, email, first_name, result_type, language')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if already unsubscribed
    const { data: unsub } = await supabaseAdmin
      .from('unsubscribes')
      .select('id')
      .eq('email_address', lead.email)
      .single()

    if (unsub) {
      return new Response(JSON.stringify({ skipped: true, reason: 'unsubscribed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sequenceType = `onboarding_${lead.result_type || 'general'}`
    const lang = lead.language || 'de'
    const now = new Date()

    // Schedule all 5 emails in email_queue
    const emailEntries = SEQUENCE_SCHEDULE.map((entry) => {
      const scheduledFor = new Date(now.getTime() + entry.delayDays * 24 * 60 * 60 * 1000)
      return {
        lead_id: lead.id,
        email_address: lead.email,
        sequence_type: sequenceType,
        sequence_step: entry.step,
        scheduled_for: scheduledFor.toISOString(),
        status: entry.step === 1 ? 'pending' : 'pending',
      }
    })

    await supabaseAdmin.from('email_queue').insert(emailEntries)

    // Send first email immediately via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      const subject = lang === 'de' ? SEQUENCE_SCHEDULE[0].subject_de : SEQUENCE_SCHEDULE[0].subject_en
      const firstName = lead.first_name || ''
      const greeting = firstName ? (lang === 'de' ? `Hey ${firstName}` : `Hey ${firstName}`) : (lang === 'de' ? 'Hey' : 'Hey')

      const resultTitles: Record<string, { de: string; en: string }> = {
        leerer_akku: { de: 'Der Leere Akku', en: 'The Empty Battery' },
        funktionierer: { de: 'Der Funktionierer', en: 'The Operator' },
        stiller_kaempfer: { de: 'Der stille Kämpfer', en: 'The Silent Fighter' },
        performer_auf_reserve: { de: 'Der Performer auf Reserve', en: 'The Performer on Reserve' },
      }

      const resultTitle = lead.result_type
        ? (resultTitles[lead.result_type]?.[lang as 'de' | 'en'] || lead.result_type)
        : ''

      const htmlBody = lang === 'de'
        ? `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h1 style="color:#1a1a2e">${greeting},</h1>
            <p>du hast den ersten Schritt gemacht – und das ist mehr, als die meisten tun.</p>
            ${resultTitle ? `<p><strong>Dein Energie-Typ:</strong> ${resultTitle}</p>` : ''}
            <p>In den nächsten Tagen bekommst du von uns:</p>
            <ul>
              <li>Konkrete Strategien für mehr Energie im Alltag</li>
              <li>Echte Geschichten von Vätern wie dir</li>
              <li>Zugang zu unserer ersten Challenge</li>
            </ul>
            <p>Bleib dran – es lohnt sich.</p>
            <p><strong>Dein daddypower Team</strong></p>
            <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
            <p style="font-size:12px;color:#999">Du möchtest keine E-Mails mehr? <a href="${Deno.env.get('APP_URL') || 'https://daddypower.vercel.app'}/abmelden?email=${encodeURIComponent(lead.email)}">Abmelden</a></p>
          </div>`
        : `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h1 style="color:#1a1a2e">${greeting},</h1>
            <p>you took the first step – and that's more than most do.</p>
            ${resultTitle ? `<p><strong>Your Energy Type:</strong> ${resultTitle}</p>` : ''}
            <p>Over the next few days, we'll send you:</p>
            <ul>
              <li>Concrete strategies for more energy in daily life</li>
              <li>Real stories from dads like you</li>
              <li>Access to our first challenge</li>
            </ul>
            <p>Stay tuned – it's worth it.</p>
            <p><strong>Your daddypower Team</strong></p>
            <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
            <p style="font-size:12px;color:#999">Don't want these emails? <a href="${Deno.env.get('APP_URL') || 'https://daddypower.vercel.app'}/abmelden?email=${encodeURIComponent(lead.email)}">Unsubscribe</a></p>
          </div>`

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'daddypower <hallo@daddypower.de>',
          to: [lead.email],
          subject,
          html: htmlBody,
        }),
      })

      const resendData = await resendResponse.json()

      // Update email_queue step 1 as sent
      if (resendData.id) {
        await supabaseAdmin
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_message_id: resendData.id,
          })
          .eq('lead_id', lead.id)
          .eq('sequence_step', 1)

        // Track event
        await supabaseAdmin.from('events').insert({
          event_name: 'email_sent',
          lead_id: lead.id,
          properties: { sequence_type: sequenceType, step: 1, message_id: resendData.id },
        })
      }
    }

    // Update lead status
    await supabaseAdmin
      .from('leads')
      .update({ status: 'email_sequence' })
      .eq('id', lead.id)

    return new Response(
      JSON.stringify({ success: true, scheduled: emailEntries.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('on-lead-created error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to process lead' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
