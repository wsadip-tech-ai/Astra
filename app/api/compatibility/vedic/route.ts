import { createClient } from '@/lib/supabase/server'
import { callVedicCompatibilityEngine, generateVedicCompatibilityNarrative } from '@/lib/compatibility'
import { NextResponse } from 'next/server'
import { mapProfile } from '@/lib/profile'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    partner_name,
    user_moon_sign, user_nakshatra, user_pada,
    partner_moon_sign, partner_nakshatra, partner_pada,
  } = body

  if (!partner_name || !user_moon_sign || !user_nakshatra || !partner_moon_sign || !partner_nakshatra) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const vedic = await callVedicCompatibilityEngine({
    user_moon_sign,
    user_nakshatra,
    user_pada: user_pada || 1,
    partner_moon_sign,
    partner_nakshatra,
    partner_pada: partner_pada || 1,
  })

  if (!vedic) {
    return NextResponse.json({ error: 'Vedic compatibility calculation failed' }, { status: 500 })
  }

  // Generate narrative for premium users
  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null
  let narrative: string | null = null

  if (profile?.subscription_tier === 'premium') {
    narrative = await generateVedicCompatibilityNarrative({
      userName: profile.name || 'You',
      partnerName: partner_name,
      score: vedic.score,
      maxScore: vedic.max_score,
      rating: vedic.rating,
      kootas: vedic.kootas,
      doshas: vedic.doshas,
    })
  }

  return NextResponse.json({
    vedic,
    narrative,
    partner_name,
  })
}
