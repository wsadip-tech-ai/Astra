import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user's Vedic chart
  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  const vedic = chart?.vedic_chart_json as {
    planets?: { name: string; sign: string; degree: number; house?: number }[]
    lagna?: { sign: string }
    dasha?: { current_mahadasha?: { planet: string } }
  } | null

  if (!vedic?.planets) {
    return NextResponse.json({ error: 'No Vedic chart available' }, { status: 404 })
  }

  const moonPlanet = vedic.planets.find(p => p.name === 'Moon')
  const moonSign = moonPlanet?.sign ?? vedic.lagna?.sign ?? 'Aries'

  try {
    const resp = await fetch(`${FASTAPI_BASE_URL}/transits/interpret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({
        natal_planets: vedic.planets.map(p => ({
          name: p.name,
          sign: p.sign,
          degree: p.degree,
          house: p.house ?? 1,
        })),
        moon_sign: moonSign,
      }),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
    }

    const data = await resp.json()

    // Extract what the dashboard needs: day quality + top alert
    const dayQuality = data.day_quality ?? {
      score: 'moderate',
      label: 'Mixed Day',
      description: 'A blend of supportive and challenging energies.',
    }

    const topAlert = data.high_impact?.alerts?.[0] ?? null

    const focusAdvice = topAlert
      ? topAlert.is_favorable
        ? `Lean into ${topAlert.life_areas?.[0]?.toLowerCase() ?? 'your strengths'} today`
        : `Be mindful of ${topAlert.life_areas?.[0]?.toLowerCase() ?? 'challenges'} today`
      : 'Stay present and trust the cosmic flow'

    return NextResponse.json({
      day_quality: dayQuality,
      top_alert: topAlert
        ? {
            headline: topAlert.headline,
            planet: topAlert.planet,
            type: topAlert.type,
            life_areas: topAlert.life_areas,
            is_favorable: topAlert.is_favorable,
            timing: topAlert.timing,
          }
        : null,
      focus_advice: focusAdvice,
      favorable_count: data.favorable_count ?? 0,
      challenging_count: data.challenging_count ?? 0,
      overall_outlook: data.overall_outlook ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
  }
}
