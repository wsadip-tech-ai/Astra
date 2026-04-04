import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { VedicChartData } from '@/types'
import type { VaastuProperty, VaastuRoomDetails, VaastuDiagnosticResult } from '@/types/vaastu'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { property, room_details } = body as { property: VaastuProperty; room_details?: VaastuRoomDetails }

  if (!property?.length || !property?.breadth || !property?.entrance_direction) {
    return NextResponse.json(
      { error: 'property.length, property.breadth, and property.entrance_direction are required' },
      { status: 400 }
    )
  }

  // Fetch user's Vedic chart
  const { data: chartRow } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!chartRow?.vedic_chart_json) {
    return NextResponse.json({ error: 'no_chart' }, { status: 400 })
  }

  const vedic = chartRow.vedic_chart_json as VedicChartData

  // Extract planets and nakshatras
  const planets = vedic.planets ?? []
  const nakshatras = vedic.nakshatras ?? []

  // Moon's nakshatra
  const moonNakEntry = nakshatras.find(n => n.planet === 'Moon')
  const moon_nakshatra = moonNakEntry?.nakshatra ?? null

  // Current dasha lord
  const dasha_lord = vedic.dasha?.current_mahadasha?.planet ?? null

  // Call engine
  const engineResp = await fetch(`${FASTAPI_BASE_URL}/vaastu/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': INTERNAL_SECRET,
    },
    body: JSON.stringify({
      property,
      room_details: room_details ?? null,
      planets,
      nakshatras,
      moon_nakshatra,
      dasha_lord,
    }),
  })

  if (!engineResp.ok) {
    const detail = await engineResp.text().catch(() => 'Engine error')
    return NextResponse.json({ error: detail }, { status: engineResp.status })
  }

  const result: VaastuDiagnosticResult = await engineResp.json()

  return NextResponse.json(result)
}
