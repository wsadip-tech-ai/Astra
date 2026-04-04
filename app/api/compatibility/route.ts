import { createClient } from '@/lib/supabase/server'
import { geocodeCity, GeocodingError } from '@/lib/geocoding'
import { calculateWesternChart } from '@/lib/astrology-engine'
import { callCompatibilityEngine, generateCompatibilityReport, callVedicCompatibilityEngine, generateVedicCompatibilityNarrative } from '@/lib/compatibility'
import { NextResponse } from 'next/server'
import type { WesternChartData } from '@/types'
import { mapProfile } from '@/lib/profile'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { partner_name, date_of_birth, time_of_birth, place_of_birth } = body

  if (!partner_name || !date_of_birth || !place_of_birth) {
    return NextResponse.json({ error: 'partner_name, date_of_birth, and place_of_birth are required' }, { status: 400 })
  }

  // Fetch user's profile and chart
  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  const { data: userChart } = await supabase
    .from('astra_birth_charts')
    .select('western_chart_json')
    .eq('user_id', user.id)
    .not('western_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!userChart?.western_chart_json) {
    return NextResponse.json({ error: 'no_chart' }, { status: 400 })
  }

  const userChartData = userChart.western_chart_json as WesternChartData

  // Geocode partner's city
  let geoResult
  try {
    geoResult = await geocodeCity(place_of_birth)
  } catch (err) {
    if (err instanceof GeocodingError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 })
  }

  // Calculate partner's Western chart
  const partnerChartData = await calculateWesternChart({
    date_of_birth,
    time_of_birth: time_of_birth || null,
    latitude: geoResult.lat,
    longitude: geoResult.lng,
    timezone: geoResult.timezone,
  })

  // Save partner chart
  const { data: partnerChart } = await supabase
    .from('astra_birth_charts')
    .insert({
      user_id: user.id,
      label: `Partner - ${partner_name}`,
      date_of_birth,
      time_of_birth: time_of_birth || null,
      place_of_birth: geoResult.displayName,
      latitude: geoResult.lat,
      longitude: geoResult.lng,
      timezone: geoResult.timezone,
      western_chart_json: partnerChartData,
      vedic_chart_json: null,
    })
    .select('id')
    .single()

  if (!partnerChart) {
    return NextResponse.json({ error: 'Failed to save partner chart' }, { status: 500 })
  }

  // Calculate compatibility
  if (!partnerChartData) {
    return NextResponse.json({
      score: null,
      aspects: [],
      summary: null,
      report: null,
      partner_chart_id: partnerChart.id,
    })
  }

  const compatibility = await callCompatibilityEngine(userChartData.planets, partnerChartData.planets)

  // --- Vedic Ashtakoota compatibility ---
  const { data: userVedicChart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  let vedic = null
  let vedicNarrative: string | null = null

  if (userVedicChart?.vedic_chart_json) {
    const userVedic = userVedicChart.vedic_chart_json as Record<string, unknown>
    const userPlanets = (userVedic.planets || []) as { name: string; sign: string; house: number; nakshatra: string }[]
    const userNakshatras = (userVedic.nakshatras || []) as { planet: string; nakshatra: string; pada: number }[]

    const userMoon = userPlanets.find(p => p.name === 'Moon')
    const userMoonNak = userNakshatras.find(n => n.planet === 'Moon')
    const userMars = userPlanets.find(p => p.name === 'Mars')

    // Generate partner's Vedic chart
    const partnerVedicResp = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/chart/vedic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_SECRET || '',
      },
      body: JSON.stringify({
        date_of_birth,
        time_of_birth: time_of_birth || null,
        latitude: geoResult.lat,
        longitude: geoResult.lng,
        timezone: geoResult.timezone,
      }),
    })

    if (partnerVedicResp.ok) {
      const partnerVedic = await partnerVedicResp.json()
      const partnerMoon = partnerVedic.planets?.find((p: { name: string }) => p.name === 'Moon')
      const partnerMoonNak = partnerVedic.nakshatras?.find((n: { planet: string }) => n.planet === 'Moon')
      const partnerMars = partnerVedic.planets?.find((p: { name: string }) => p.name === 'Mars')

      if (userMoon && userMoonNak && partnerMoon && partnerMoonNak) {
        vedic = await callVedicCompatibilityEngine({
          user_moon_sign: userMoon.sign,
          user_nakshatra: userMoonNak.nakshatra,
          user_pada: userMoonNak.pada,
          partner_moon_sign: partnerMoon.sign,
          partner_nakshatra: partnerMoonNak.nakshatra,
          partner_pada: partnerMoonNak.pada,
          user_mars_house: userMars?.house ?? null,
          partner_mars_house: partnerMars?.house ?? null,
        })

        if (vedic && profile?.subscription_tier === 'premium') {
          vedicNarrative = await generateVedicCompatibilityNarrative({
            userName: profile.name || 'You',
            partnerName: partner_name,
            score: vedic.score,
            maxScore: vedic.max_score,
            rating: vedic.rating,
            kootas: vedic.kootas,
            doshas: vedic.doshas,
          })
        }
      }
    }
  }

  if (!compatibility) {
    return NextResponse.json({
      score: null,
      aspects: [],
      summary: null,
      report: null,
      partner_chart_id: partnerChart.id,
      vedic,
      vedic_narrative: vedicNarrative,
    })
  }

  // Generate Claude report for premium users
  let report: string | null = null
  if (profile?.subscription_tier === 'premium') {
    const topAspects = compatibility.aspects
      .slice(0, 5)
      .map(a => `${a.planet1}-${a.planet2} ${a.type} (${a.orb}°)`)
      .join(', ')

    report = await generateCompatibilityReport({
      userName: profile.name || 'You',
      partnerName: partner_name,
      score: compatibility.score,
      topAspects,
      userChartSummary: userChartData.summary,
      partnerChartSummary: partnerChartData.summary,
    })
  }

  return NextResponse.json({
    score: compatibility?.score ?? null,
    aspects: compatibility?.aspects ?? [],
    summary: compatibility?.summary ?? null,
    report,
    partner_chart_id: partnerChart.id,
    vedic,
    vedic_narrative: vedicNarrative,
  })
}
