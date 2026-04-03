import { createClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession, getPriceId } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json()
  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'plan must be "monthly" or "yearly"' }, { status: 400 })
  }

  const priceId = getPriceId(plan)
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const customerId = await createOrGetCustomer(
    user.id,
    user.email || '',
    profile?.name || null,
    profile?.stripe_customer_id || null,
  )

  if (!profile?.stripe_customer_id) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const url = await createCheckoutSession(customerId, priceId, user.id)
  if (!url) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  return NextResponse.json({ url })
}
