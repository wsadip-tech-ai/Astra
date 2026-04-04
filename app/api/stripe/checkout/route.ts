import { createClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession, getPriceId } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { mapProfile } from '@/lib/profile'

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

  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  const customerId = await createOrGetCustomer(
    user.id,
    user.email || '',
    profile?.name || null,
    profile?.stripe_customer_id || null,
  )

  if (!profile?.stripe_customer_id) {
    await supabase
      .from('astra_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const url = await createCheckoutSession(customerId, priceId, user.id)
  if (!url) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  return NextResponse.json({ url })
}
