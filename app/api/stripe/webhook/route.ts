import { getStripeClient } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

export async function POST(request: Request) {
  const stripe = getStripeClient()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (!userId || !subscriptionId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
      current_period_end: number
      items: { data: { plan?: { interval?: string } }[] }
    }
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    const interval = subscription.items.data[0]?.plan?.interval
    const plan = interval === 'year' ? 'yearly' : 'monthly'

    await supabase
      .from('astra_profiles')
      .update({ subscription_tier: 'premium', stripe_customer_id: customerId })
      .eq('id', userId)

    await supabase
      .from('astra_subscriptions')
      .upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: 'active',
          current_period_end: periodEnd,
        },
        { onConflict: 'stripe_subscription_id' },
      )
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const subId = subscription.id

    const { data: sub } = await supabase
      .from('astra_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subId)
      .maybeSingle()

    if (sub) {
      await supabase
        .from('astra_subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subId)

      await supabase
        .from('astra_profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', sub.user_id)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const subId = subscription.id
    const status = subscription.status === 'past_due' ? 'past_due' : 'active'
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

    await supabase
      .from('astra_subscriptions')
      .update({ status, current_period_end: periodEnd })
      .eq('stripe_subscription_id', subId)
  }

  return NextResponse.json({ received: true })
}
