// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events for subscription lifecycle
// Events: checkout.session.completed, customer.subscription.deleted

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
  })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verify webhook signature
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription' || !session.customer_email) break

        const email = session.customer_email
        const resultType = session.metadata?.result_type || null
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Find or create Supabase Auth user
        let userId: string

        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers.users.find((u) => u.email === email)

        if (existingUser) {
          userId = existingUser.id
          // Update role to member
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role: 'member', result_type: resultType },
          })
        } else {
          // Create user + send magic link
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { role: 'member', result_type: resultType },
          })
          if (createError || !newUser.user) {
            console.error('Failed to create user:', createError)
            break
          }
          userId = newUser.user.id

          // Send magic link for first login
          await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: `${Deno.env.get('APP_URL') || 'https://daddypower.vercel.app'}/dashboard` },
          })
        }

        // Find lead_id
        const { data: lead } = await supabaseAdmin
          .from('leads')
          .select('id')
          .eq('email', email)
          .single()

        // Insert subscription
        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          lead_id: lead?.id || null,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: subscription.items.data[0]?.price.id || null,
          status: 'active',
          result_type: resultType,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        // Track event
        await supabaseAdmin.from('events').insert({
          event_name: 'subscription_activated',
          user_id: userId,
          lead_id: lead?.id || null,
          properties: { subscription_id: subscriptionId, result_type: resultType },
        })

        // Update lead status
        if (lead?.id) {
          await supabaseAdmin
            .from('leads')
            .update({ status: 'converted' })
            .eq('id', lead.id)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        // Update subscription status
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

        // Get user_id to remove member role
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (sub?.user_id) {
          await supabaseAdmin.auth.admin.updateUserById(sub.user_id, {
            user_metadata: { role: null },
          })

          await supabaseAdmin.from('events').insert({
            event_name: 'subscription_cancelled',
            user_id: sub.user_id,
            properties: { subscription_id: subscriptionId },
          })
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id
        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.cancel_at_period_end ? 'cancelled'
          : 'active'

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
