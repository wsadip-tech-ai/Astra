import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { VedicChartData } from '@/types'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

function getModel(): string {
  return process.env.CHAT_MODEL || 'gpt-4o-mini'
}

function buildYearlyPrompt(
  year: number,
  name: string,
  vedic: VedicChartData,
  transits: { planets: { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }[] } | null,
): string {
  const dasha = vedic.dasha
  const yogas = vedic.yogas ?? []
  const houses = vedic.houses ?? []
  const interpretations = vedic.interpretations
  const activeYogas = yogas.filter(y => y.present)

  const upcomingList = dasha
    ? (dasha.upcoming_antardashas ?? [])
        .map(a => `${a.planet} (${a.start} to ${a.end})`)
        .join(', ') || 'None listed'
    : 'Dasha data not available'

  const transitLines = transits?.planets
    .map(p => {
      const retro = p.retrograde ? ' (Rx)' : ''
      return `- ${p.name}: ${p.sign} ${p.degree.toFixed(1)}deg, ${p.nakshatra}${retro}`
    })
    .join('\n') ?? 'Transit data unavailable'

  const yogaLines = activeYogas.length > 0
    ? activeYogas.map(y => `- ${y.name} (${y.strength}): ${y.interpretation}`).join('\n')
    : 'No strong yogas active'

  const houseSummary = houses.length > 0
    ? houses.map(h => `${h.number}H: ${h.sign} (lord ${h.lord} in ${h.lord_house}H)`).join(', ')
    : 'House data not available'

  const dashaSection = dasha
    ? `Their current Dasha:
Mahadasha: ${dasha.current_mahadasha.planet} (${dasha.current_mahadasha.start} to ${dasha.current_mahadasha.end})
Antardasha: ${dasha.current_antardasha.planet} (${dasha.current_antardasha.start} to ${dasha.current_antardasha.end})
Upcoming Antardashas: ${upcomingList}`
    : `Dasha data not available — focus on transit analysis and general chart themes.`

  return `You are Astra, a Vedic astrologer. Write a ~500 word year-ahead forecast for ${year} for ${name}.

${dashaSection}

Active Yogas:
${yogaLines}

House Layout: ${houseSummary}

Interpretations:
${interpretations ? `- Lagna Lord: ${interpretations.lagna_lord}
- Moon Nakshatra: ${interpretations.moon_nakshatra}
${interpretations.planet_highlights?.map(p => `- ${p.planet}: ${p.text}`).join('\n') ?? ''}` : 'Chart interpretation data not available — use transit positions to guide the reading.'}

Current Transits:
${transitLines}

CRITICAL RULES:
- ONLY reference planetary positions, houses, and yogas listed above. Do NOT invent any positions.
- When mentioning a transit planet, reference which house it occupies based on the House Layout above.
- When discussing timing, use the EXACT Antardasha transition dates listed.
- Use probabilistic language: "the stars indicate higher probability" not "this will happen."
- Every section must reference specific data from above — no generic astrology.

Structure the reading covering ALL 6 areas:
1. Overall theme for the year (based on Dasha lord and its house position)
2. Career & finances (based on 10th/2nd house lords from House Layout + relevant transits)
3. Relationships & family (based on 7th/4th house lords + active yogas affecting these)
4. Health & wellbeing (based on 6th/8th house lords + Mars/Saturn transit positions)
5. Spiritual growth (based on 9th/12th house lords + Jupiter's transit position)
6. Key months to watch (use EXACT Antardasha transition dates — state the month and what shifts)

End with a "Year Mantra" — one motivational line tied to the Dasha lord's energy.`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentYear = new Date().getFullYear()

  // Check cache first — handle missing table gracefully
  try {
    const { data: cached } = await supabase
      .from('astra_yearly_forecasts')
      .select('reading, created_at')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .limit(1)
      .maybeSingle()

    if (cached?.reading) {
      // Fetch chart data for dasha + yogas to return alongside cached reading
      const { data: chart } = await supabase
        .from('astra_birth_charts')
        .select('vedic_chart_json')
        .eq('user_id', user.id)
        .not('vedic_chart_json', 'is', null)
        .limit(1)
        .maybeSingle()

      const vedic = chart?.vedic_chart_json as VedicChartData | null

      return NextResponse.json({
        reading: cached.reading,
        dasha: vedic?.dasha ?? null,
        yogas: vedic?.yogas?.filter(y => y.present) ?? [],
        year: currentYear,
        cached: true,
      })
    }
  } catch {
    // Table may not exist — continue to generate
    console.warn('[yearly/route] Cache table not available, generating fresh')
  }

  // Fetch user's Vedic chart
  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json, label')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  const vedic = chart?.vedic_chart_json as VedicChartData | null

  if (!vedic) {
    return NextResponse.json(
      { error: 'No Vedic chart found. Generate your birth chart first.' },
      { status: 404 },
    )
  }

  // Fetch user name
  const { data: profile } = await supabase
    .from('astra_profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const userName = (profile as { name?: string | null } | null)?.name || chart?.label || 'Seeker'

  // Fetch current transits
  let transits: { planets: { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }[] } | null = null
  try {
    const resp = await fetch(`${FASTAPI_BASE_URL}/transits/today`, {
      headers: { 'X-Internal-Secret': INTERNAL_SECRET },
    })
    if (resp.ok) {
      transits = await resp.json()
    }
  } catch (err) {
    console.error('[yearly/route] Failed to fetch transits:', err)
  }

  // Generate AI narrative
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const prompt = buildYearlyPrompt(currentYear, userName, vedic, transits)

  let reading: string
  try {
    const completion = await openai.chat.completions.create({
      model: getModel(),
      max_tokens: 1200,
      temperature: 0.8,
      messages: [
        { role: 'user', content: prompt },
      ],
    })
    reading = completion.choices[0]?.message?.content ?? ''
  } catch (err) {
    console.error('[yearly/route] OpenAI error:', err)
    return NextResponse.json(
      { error: 'Failed to generate yearly forecast' },
      { status: 500 },
    )
  }

  if (!reading) {
    return NextResponse.json(
      { error: 'Empty response from AI' },
      { status: 500 },
    )
  }

  // Cache the result — handle missing table gracefully
  try {
    await supabase
      .from('astra_yearly_forecasts')
      .upsert(
        { user_id: user.id, year: currentYear, reading },
        { onConflict: 'user_id,year' },
      )
  } catch {
    console.warn('[yearly/route] Could not cache forecast (table may not exist)')
  }

  const activeYogas = vedic.yogas?.filter(y => y.present) ?? []

  return NextResponse.json({
    reading,
    dasha: vedic.dasha,
    yogas: activeYogas,
    year: currentYear,
    cached: false,
  })
}
