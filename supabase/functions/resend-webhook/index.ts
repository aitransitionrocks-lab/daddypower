// Supabase Edge Function: resend-webhook
// Handles Resend webhook events: email.opened, email.clicked

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    const eventType = payload.type

    if (!eventType) {
      return new Response('Missing event type', { status: 400 })
    }

    const messageId = payload.data?.email_id

    // Find the email_queue entry by resend_message_id
    let leadId: string | null = null
    if (messageId) {
      const { data: emailEntry } = await supabaseAdmin
        .from('email_queue')
        .select('lead_id')
        .eq('resend_message_id', messageId)
        .single()

      leadId = emailEntry?.lead_id || null
    }

    switch (eventType) {
      case 'email.opened':
        await supabaseAdmin.from('events').insert({
          event_name: 'email_opened',
          lead_id: leadId,
          properties: { message_id: messageId },
        })
        break

      case 'email.clicked':
        await supabaseAdmin.from('events').insert({
          event_name: 'email_clicked',
          lead_id: leadId,
          properties: {
            message_id: messageId,
            url: payload.data?.click?.link || null,
          },
        })
        break

      case 'email.bounced':
        // Mark lead as churned if email bounces
        if (leadId) {
          await supabaseAdmin
            .from('leads')
            .update({ status: 'churned' })
            .eq('id', leadId)
        }
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Resend webhook error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
