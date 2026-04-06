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
    planets?: { name: string; sign: string; degree: number }[]
    lagna?: { sign: string }
  } | null

  if (!vedic?.planets) {
    return NextResponse.json({ error: 'No Vedic chart available' }, { status: 404 })
  }

  const moonPlanet = vedic.planets.find(p => p.name === 'Moon')
  const moonSign = moonPlanet?.sign ?? vedic.lagna?.sign ?? 'Aries'

  try {
    const resp = await fetch(`${FASTAPI_BASE_URL}/yogas/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({
        natal_moon_sign: moonSign,
        natal_planets: vedic.planets.map(p => ({
          name: p.name,
          sign: p.sign,
          degree: p.degree,
        })),
        years_ahead: 5,
      }),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
    }

    const data = await resp.json()
    const today = new Date().toISOString().slice(0, 10)

    // Build a compact list of upcoming events for the dashboard
    // Take from timeline: first 2-3 future events + any currently active
    const events: UpcomingEvent[] = []

    // Currently active events first
    const active = (data.currently_active ?? []) as TimelineEvent[]
    for (const evt of active.slice(0, 2)) {
      const daysLeft = daysBetween(today, evt.end_date ?? today)
      events.push({
        yoga: evt.yoga ?? 'Active Yoga',
        category: evt.category ?? 'opportunity',
        status: 'active',
        days_until: 0,
        days_remaining: Math.max(daysLeft, 0),
        start_date: evt.start_date ?? today,
        end_date: evt.end_date ?? '',
        description: evt.description ?? '',
        strength: evt.strength ?? 'moderate',
        what_to_do: evt.what_to_do ?? [],
        life_areas: evt.life_areas ?? [],
      })
    }

    // Future events from timeline
    const timeline = (data.timeline ?? []) as TimelineEvent[]
    for (const evt of timeline) {
      if (events.length >= 3) break
      const startDate = evt.start_date ?? ''
      if (startDate <= today) continue // skip past/active (already captured)

      const daysUntil = daysBetween(today, startDate)
      if (daysUntil <= 0) continue

      events.push({
        yoga: evt.yoga ?? 'Upcoming Event',
        category: evt.category ?? 'opportunity',
        status: 'upcoming',
        days_until: daysUntil,
        days_remaining: 0,
        start_date: startDate,
        end_date: evt.end_date ?? '',
        description: evt.description ?? '',
        strength: evt.strength ?? 'moderate',
        what_to_do: evt.what_to_do ?? [],
        life_areas: evt.life_areas ?? [],
      })
    }

    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
  }
}

interface TimelineEvent {
  yoga?: string
  category?: string
  start_date?: string
  end_date?: string
  description?: string
  strength?: string
  what_to_do?: string[]
  life_areas?: string[]
}

interface UpcomingEvent {
  yoga: string
  category: string
  status: 'active' | 'upcoming'
  days_until: number
  days_remaining: number
  start_date: string
  end_date: string
  description: string
  strength: string
  what_to_do: string[]
  life_areas: string[]
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from)
  const b = new Date(to)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}
