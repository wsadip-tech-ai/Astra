// app/api/chart/generate/route.ts
import { createClient } from '@/lib/supabase/server'
import { geocodeCity, GeocodingError } from '@/lib/geocoding'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { date_of_birth, time_of_birth, place_of_birth, label = 'My Chart' } = body

  if (!date_of_birth || !place_of_birth) {
    return NextResponse.json({ error: 'date_of_birth and place_of_birth are required' }, { status: 400 })
  }

  let geoResult
  try {
    geoResult = await geocodeCity(place_of_birth)
  } catch (err) {
    if (err instanceof GeocodingError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 })
  }

  const { data: chart, error } = await supabase
    .from('birth_charts')
    .insert({
      user_id: user.id,
      label,
      date_of_birth,
      time_of_birth: time_of_birth || null,
      place_of_birth: geoResult.displayName,
      latitude: geoResult.lat,
      longitude: geoResult.lng,
      timezone: geoResult.timezone,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save chart' }, { status: 500 })
  }

  return NextResponse.json({ chart_id: chart.id, timezone: geoResult.timezone })
}
