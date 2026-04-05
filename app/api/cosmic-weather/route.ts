import { createClient } from '@/lib/supabase/server'
import { generateCosmicWeatherReading } from '@/lib/cosmic-weather'
import { mapProfile } from '@/lib/profile'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Check cache first (table may not exist — handle gracefully)
  try {
    const { data: cached } = await supabase
      .from('astra_cosmic_weather')
      .select('reading')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (cached?.reading) {
      return NextResponse.json({ reading: cached.reading, cached: true })
    }
  } catch {
    // Table may not exist — proceed to generate
  }

  // Fetch user profile and Vedic chart
  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!chart?.vedic_chart_json) {
    return NextResponse.json({ reading: null })
  }

  const vedic = chart.vedic_chart_json as Record<string, unknown>
  const planets = (vedic.planets || []) as { name: string; sign: string; degree: number; house: number }[]
  const moonPlanet = planets.find(p => p.name === 'Moon')
  const dasha = vedic.dasha as { current_mahadasha: { planet: string }; current_antardasha: { planet: string } } | undefined

  if (!moonPlanet) {
    return NextResponse.json({ reading: null })
  }

  // Fetch personal transits
  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
  const secret = process.env.INTERNAL_SECRET || ''

  let transitSummary = 'Transit data unavailable'
  let personalAspects = 'No personal aspects calculated'
  let murthi = 'Unknown'

  try {
    const transitResp = await fetch(`${baseUrl}/transits/today`, {
      headers: { 'X-Internal-Secret': secret },
    })
    if (transitResp.ok) {
      const transits = await transitResp.json()
      transitSummary = transits.planets
        .map((p: { name: string; sign: string; retrograde: boolean }) =>
          `${p.name} in ${p.sign}${p.retrograde ? ' (Rx)' : ''}`)
        .join(', ')

      // Personal transits
      const personalResp = await fetch(`${baseUrl}/transits/personal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret },
        body: JSON.stringify({
          natal_planets: planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree, house: p.house })),
          moon_sign: moonPlanet.sign,
        }),
      })
      if (personalResp.ok) {
        const personal = await personalResp.json()
        murthi = personal.murthi_nirnaya || 'Unknown'
        if (personal.transit_aspects?.length > 0) {
          personalAspects = personal.transit_aspects
            .slice(0, 5)
            .map((a: { transit_planet: string; aspect_type: string; natal_planet: string }) =>
              `${a.transit_planet} ${a.aspect_type} natal ${a.natal_planet}`)
            .join(', ')
        }
        // Add transit house positions to the summary
        if (personal.transit_houses) {
          const houseAreas: Record<number, string> = {
            1: 'Self/Health', 2: 'Finance/Family', 3: 'Communication', 4: 'Home/Emotions',
            5: 'Creativity/Romance', 6: 'Health/Work', 7: 'Relationships/Marriage',
            8: 'Transformation', 9: 'Luck/Spirituality', 10: 'Career/Status',
            11: 'Gains/Friends', 12: 'Expenses/Spirituality',
          }
          const houseLines = Object.entries(personal.transit_houses as Record<string, number>)
            .map(([planet, house]) => `${planet} in ${house}th house (${houseAreas[house] || 'General'})`)
            .join(', ')
          transitSummary += `\n\nTransit houses from your Moon (${moonPlanet.sign}): ${houseLines}`
        }
      }
    }
  } catch {
    // Transit fetch failed
  }

  const reading = await generateCosmicWeatherReading({
    userName: profile?.name || 'Seeker',
    moonSign: moonPlanet.sign,
    currentDasha: dasha ? `${dasha.current_mahadasha.planet} Mahadasha, ${dasha.current_antardasha.planet} Antardasha` : 'Unknown',
    transitSummary,
    personalAspects,
    murthi,
  })

  // Cache the reading (table may not exist)
  if (reading) {
    try {
      await supabase.from('astra_cosmic_weather').upsert({
        user_id: user.id,
        date: today,
        reading,
      }, { onConflict: 'user_id,date' })
    } catch {
      // Cache failed — that's ok
    }
  }

  return NextResponse.json({ reading, cached: false })
}
