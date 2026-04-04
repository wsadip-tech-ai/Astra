import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { mapProfile } from '@/lib/profile'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
  }

  const url = await createPortalSession(profile.stripe_customer_id)
  if (!url) {
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }

  return NextResponse.json({ url })
}
