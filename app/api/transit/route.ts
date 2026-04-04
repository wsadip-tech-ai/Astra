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

  // Fetch today's transits from engine
  let transits = null
  try {
    const resp = await fetch(`${FASTAPI_BASE_URL}/transits/today`, {
      headers: { 'X-Internal-Secret': INTERNAL_SECRET },
    })
    if (resp.ok) {
      transits = await resp.json()
    }
  } catch (err) {
    console.error('[transit/route] Failed to fetch transits:', err)
  }

  if (!transits) {
    return NextResponse.json(
      { error: 'Transit data temporarily unavailable' },
      { status: 503 },
    )
  }

  // Fetch user's Vedic chart for personal transits
  let personal = null
  try {
    const { data: chart } = await supabase
      .from('astra_birth_charts')
      .select('vedic_chart_json')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const vedic = chart?.vedic_chart_json as {
      planets?: { name: string; sign: string; degree: number }[]
      lagna?: { sign: string }
    } | null

    if (vedic?.planets) {
      const moonPlanet = vedic.planets.find(p => p.name === 'Moon')
      const moonSign = moonPlanet?.sign ?? vedic.lagna?.sign ?? 'Aries'

      const personalResp = await fetch(`${FASTAPI_BASE_URL}/transits/personal`, {
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
          })),
          moon_sign: moonSign,
        }),
      })

      if (personalResp.ok) {
        personal = await personalResp.json()
      }
    }
  } catch (err) {
    console.error('[transit/route] Failed to fetch personal transits:', err)
  }

  return NextResponse.json({ transits, personal })
}
