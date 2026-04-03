import { createClient } from '@/lib/supabase/server'
import { geocodeCity, GeocodingError } from '@/lib/geocoding'
import { calculateWesternChart } from '@/lib/astrology-engine'
import { callCompatibilityEngine, generateCompatibilityReport } from '@/lib/compatibility'
import { NextResponse } from 'next/server'
import type { WesternChartData } from '@/types'

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: userChart } = await supabase
    .from('birth_charts')
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
    .from('birth_charts')
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

  if (!compatibility) {
    return NextResponse.json({
      score: null,
      aspects: [],
      summary: null,
      report: null,
      partner_chart_id: partnerChart.id,
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
    score: compatibility.score,
    aspects: compatibility.aspects,
    summary: compatibility.summary,
    report,
    partner_chart_id: partnerChart.id,
  })
}
