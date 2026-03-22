// Supabase Edge Function: process-email-queue
// Scheduled via pg_cron (every hour) or called manually
// Sends pending emails that are due

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get due emails
    const { data: dueEmails, error } = await supabaseAdmin
      .from('email_queue')
      .select('id, lead_id, email_address, sequence_type, sequence_step, scheduled_for')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50)

    if (error || !dueEmails) {
      return new Response(JSON.stringify({ error: 'Failed to fetch queue' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const email of dueEmails) {
      // Check unsubscribe
      const { data: unsub } = await supabaseAdmin
        .from('unsubscribes')
        .select('id')
        .eq('email_address', email.email_address)
        .single()

      if (unsub) {
        await supabaseAdmin
          .from('email_queue')
          .update({ status: 'skipped' })
          .eq('id', email.id)
        skipped++
        continue
      }

      // Get lead for personalization
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('first_name, result_type, language')
        .eq('id', email.lead_id)
        .single()

      const lang = lead?.language || 'de'
      const firstName = lead?.first_name || ''

      // Generate email content based on step
      const { subject, html } = generateEmailContent(
        email.sequence_step,
        email.sequence_type,
        firstName,
        lead?.result_type || '',
        lang
      )

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'daddypower <hallo@daddypower.de>',
            to: [email.email_address],
            subject,
            html,
          }),
        })

        const data = await response.json()

        if (data.id) {
          await supabaseAdmin
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              resend_message_id: data.id,
            })
            .eq('id', email.id)

          await supabaseAdmin.from('events').insert({
            event_name: 'email_sent',
            lead_id: email.lead_id,
            properties: {
              sequence_type: email.sequence_type,
              step: email.sequence_step,
              message_id: data.id,
            },
          })

          sent++
        } else {
          await supabaseAdmin
            .from('email_queue')
            .update({ status: 'failed', error_message: JSON.stringify(data) })
            .eq('id', email.id)
          failed++
        }
      } catch (sendErr) {
        await supabaseAdmin
          .from('email_queue')
          .update({ status: 'failed', error_message: String(sendErr) })
          .eq('id', email.id)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ processed: dueEmails.length, sent, skipped, failed }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Process queue error:', err)
    return new Response(
      JSON.stringify({ error: 'Queue processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Generiert E-Mail-Inhalt basierend auf Step und Typ
function generateEmailContent(
  step: number,
  sequenceType: string,
  firstName: string,
  resultType: string,
  lang: string
): { subject: string; html: string } {
  const greeting = firstName
    ? `Hey ${firstName}`
    : 'Hey'

  const appUrl = Deno.env.get('APP_URL') || 'https://daddypower.vercel.app'
  const unsubLink = `${appUrl}/abmelden?email=`

  // Step-spezifische Subjects und Content
  const steps: Record<number, { subject_de: string; subject_en: string; body_de: string; body_en: string }> = {
    2: {
      subject_de: 'Dein größter Energiekiller – und was du tun kannst',
      subject_en: 'Your biggest energy killer – and what you can do',
      body_de: `<p>Die meisten Väter glauben, sie brauchen mehr Disziplin. Mehr Sport. Mehr Schlaf.</p>
        <p>Aber der größte Energiekiller ist nicht zu wenig Schlaf – es ist das Gefühl, dass du nie genug tust.</p>
        <p>In unserer Community arbeiten wir genau daran: <strong>Nicht mehr tun, sondern das Richtige tun.</strong></p>
        <p>Wir starten bald mit der ersten Challenge. Bist du dabei?</p>`,
      body_en: `<p>Most dads think they need more discipline. More exercise. More sleep.</p>
        <p>But the biggest energy killer isn't lack of sleep – it's the feeling that you're never doing enough.</p>
        <p>In our community, we work on exactly this: <strong>Not doing more, but doing the right things.</strong></p>
        <p>We're launching the first challenge soon. Are you in?</p>`,
    },
    3: {
      subject_de: 'Wie Marc es geschafft hat',
      subject_en: 'How Marc did it',
      body_de: `<p>Marc, 34, zwei Kinder, IT-Berater. Klingt bekannt?</p>
        <p>Vor 6 Monaten war er am Limit: Job, Kids, null Energie. Er hat alles probiert – Supplements, 5-Uhr-Aufstehen, Biohacking.</p>
        <p>Was wirklich funktioniert hat? <strong>20 Minuten pro Tag. Keine Perfektion. Nur Konstanz.</strong></p>
        <p>Sein Geheimnis: Er hat aufgehört, allein zu kämpfen. Er hat sich eine Community gesucht, die ihn versteht.</p>
        <p>Genau das bauen wir mit daddypower.</p>`,
      body_en: `<p>Marc, 34, two kids, IT consultant. Sound familiar?</p>
        <p>6 months ago he was at his limit: job, kids, zero energy. He tried everything – supplements, 5am wake-ups, biohacking.</p>
        <p>What actually worked? <strong>20 minutes per day. No perfection. Just consistency.</strong></p>
        <p>His secret: He stopped fighting alone. He found a community that understands him.</p>
        <p>That's exactly what we're building with daddypower.</p>`,
    },
    4: {
      subject_de: 'Dein Plan für mehr Kraft im Alltag',
      subject_en: 'Your plan for more energy in daily life',
      body_de: `<p>In den letzten Tagen hast du gesehen: Du bist nicht allein. Und es gibt einen Weg.</p>
        <p>Unser Programm bietet dir:</p>
        <ul>
          <li>Kurze, alltagstaugliche Workouts (10-20 Min.)</li>
          <li>Tägliche Check-ins für Energie und Stimmung</li>
          <li>Eine Community, die dich hält – nicht pusht</li>
          <li>Challenges, die in dein Leben passen</li>
        </ul>
        <p><strong>Kein Fitnessstudio nötig. Keine Stunden. Nur du und 20 Minuten.</strong></p>`,
      body_en: `<p>Over the past days you've seen: You're not alone. And there is a way.</p>
        <p>Our program offers you:</p>
        <ul>
          <li>Short, practical workouts (10-20 min.)</li>
          <li>Daily check-ins for energy and mood</li>
          <li>A community that supports – not pushes</li>
          <li>Challenges that fit your life</li>
        </ul>
        <p><strong>No gym needed. No hours. Just you and 20 minutes.</strong></p>`,
    },
    5: {
      subject_de: 'Letzte Chance: Bist du dabei?',
      subject_en: 'Last chance: Are you in?',
      body_de: `<p>Das war's mit unserer kleinen Einführungs-Serie.</p>
        <p>Eins ist klar: <strong>Wissen allein ändert nichts.</strong> Nur wenn du loslegst.</p>
        <p>Die ersten Plätze in unserer Challenge sind limitiert. Wenn du dabei sein willst – jetzt ist der Moment.</p>
        <p>Wir freuen uns auf dich.</p>`,
      body_en: `<p>That's it for our little intro series.</p>
        <p>One thing is clear: <strong>Knowledge alone changes nothing.</strong> Only action does.</p>
        <p>Spots in our first challenge are limited. If you want in – now is the moment.</p>
        <p>We're looking forward to having you.</p>`,
    },
  }

  const stepData = steps[step]
  if (!stepData) {
    return { subject: 'daddypower', html: '<p>Update from daddypower</p>' }
  }

  const subject = lang === 'de' ? stepData.subject_de : stepData.subject_en
  const body = lang === 'de' ? stepData.body_de : stepData.body_en

  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#1a1a2e">${greeting},</h2>
    ${body}
    <p style="margin-top:24px"><strong>Dein daddypower Team</strong></p>
    <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
    <p style="font-size:12px;color:#999">${lang === 'de' ? 'Du möchtest keine E-Mails mehr?' : "Don't want these emails?"} <a href="${unsubLink}">${lang === 'de' ? 'Abmelden' : 'Unsubscribe'}</a></p>
  </div>`

  return { subject, html }
}
