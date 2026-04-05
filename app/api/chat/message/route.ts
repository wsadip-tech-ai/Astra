import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt, buildConversationHistory, createClient as createAI, getModel } from '@/lib/claude'
import { mapProfile } from '@/lib/profile'
import { NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { message, history = [] } = body
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  // Fetch profile
  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!rawProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const profile = mapProfile(rawProfile as Record<string, unknown>)

  // Free tier limit check (skip if columns don't exist in DB)
  const messageCount = profile.daily_message_count
  if (profile.subscription_tier !== 'premium' && messageCount >= 3) {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
  }

  // Fetch birth chart
  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('id, date_of_birth, time_of_birth, place_of_birth, western_chart_json, vedic_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) {
    return NextResponse.json({ error: 'no_chart' }, { status: 400 })
  }

  // Build prompt
  const westernSummary = (chart.western_chart_json as { summary?: string })?.summary ?? 'not calculated'

  type VedicChartJson = {
    summary: string
    lagna: { sign: string; degree: number }
    houses: { number: number; sign: string; lord: string; lord_house: number }[]
    yogas: { name: string; present: boolean; strength: string; interpretation: string }[]
    dasha: {
      current_mahadasha: { planet: string; start: string; end: string }
      current_antardasha: { planet: string; start: string; end: string }
    }
    interpretations: {
      lagna_lord: string
      moon_nakshatra: string
      planet_highlights: { planet: string; text: string }[]
    }
  }

  const rawVedic = chart.vedic_chart_json as Partial<VedicChartJson> | null
  const vedicChart: VedicChartJson | null =
    rawVedic &&
    rawVedic.summary !== undefined &&
    rawVedic.lagna !== undefined &&
    rawVedic.houses !== undefined &&
    rawVedic.yogas !== undefined &&
    rawVedic.dasha !== undefined &&
    rawVedic.interpretations !== undefined
      ? (rawVedic as VedicChartJson)
      : null

  // Fetch today's transits from FastAPI (graceful failure)
  type TransitPlanet = { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }
  type TransitsPayload = { planets: TransitPlanet[] }
  let transits: TransitsPayload | null = null
  try {
    const transitRes = await fetch(`${FASTAPI_BASE_URL}/transits/today`, {
      headers: { 'X-Internal-Secret': INTERNAL_SECRET },
      signal: AbortSignal.timeout(5000),
    })
    if (transitRes.ok) {
      transits = (await transitRes.json()) as TransitsPayload
    }
  } catch {
    // Transit fetch failed — continue without transits
  }

  // Fetch personal transit interpretations (life area analysis, timing)
  let personalTransitContext = ''
  if (transits && vedicChart) {
    try {
      const planets = (chart.vedic_chart_json as { planets?: { name: string; sign: string; degree: number; house?: number }[] })?.planets ?? []
      const moonPlanet = planets.find(p => p.name === 'Moon')
      if (moonPlanet) {
        const interpRes = await fetch(`${FASTAPI_BASE_URL}/transits/interpret`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': INTERNAL_SECRET },
          body: JSON.stringify({
            natal_planets: planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree, house: p.house ?? 1 })),
            moon_sign: moonPlanet.sign,
          }),
          signal: AbortSignal.timeout(5000),
        })
        if (interpRes.ok) {
          const interp = await interpRes.json()
          const hi = interp.high_impact
          if (hi?.alerts?.length > 0) {
            personalTransitContext = `\n\n## Personal Transit Analysis (TODAY)\n`
            personalTransitContext += `Overall: ${interp.overall_outlook}\n`
            personalTransitContext += `\n### Top Alerts (most impactful on the user RIGHT NOW):\n`
            for (const alert of hi.alerts) {
              const timing = alert.timing
              personalTransitContext += `- ${alert.headline} [${alert.type.toUpperCase()}]\n`
              personalTransitContext += `  Life areas: ${alert.life_areas.join(', ')}\n`
              personalTransitContext += `  ${alert.detail}\n`
              if (timing?.active_from) {
                personalTransitContext += `  Active: ${timing.active_from} to ${timing.active_until} (${timing.days_remaining} days remaining, ${timing.duration})\n`
              }
              personalTransitContext += `  Remedy: ${alert.remedy?.practice || 'Practice awareness'}\n`
            }
            if (hi.life_scores) {
              personalTransitContext += `\n### Life Area Outlook:\n`
              for (const [area, score] of Object.entries(hi.life_scores)) {
                const s = score as { outlook: string; verdict: string }
                personalTransitContext += `- ${area}: ${s.outlook.toUpperCase()} — ${s.verdict}\n`
              }
            }
            if (hi.timeline?.length > 0) {
              personalTransitContext += `\n### Upcoming Dasha Shifts:\n`
              for (const t of hi.timeline) {
                personalTransitContext += `- ${t.planet} Antardasha: ${t.start} to ${t.end} (${t.nature}) — ${t.description}\n`
              }
            }
          }
          // Also include transit house positions
          if (interp.transit_houses) {
            personalTransitContext += `\n### Transit Houses from Moon:\n`
            for (const [planet, house] of Object.entries(interp.transit_houses)) {
              personalTransitContext += `- ${planet}: ${house}th house from Moon\n`
            }
          }
        }
      }
    } catch {
      // Interpretation fetch failed — continue with basic transits
    }
  }

  // Fetch Vaastu property if saved
  let vaastuProfile = null
  try {
    const { data: vaastuProp } = await supabase
      .from('astra_vaastu_properties')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (vaastuProp) {
      vaastuProfile = {
        length: vaastuProp.length,
        breadth: vaastuProp.breadth,
        entrance_direction: vaastuProp.entrance_direction,
        aayadi_harmony: 'See /vaastu for full analysis',
        afflicted_zones: [] as string[],
        dasha_lord: vedicChart?.dasha?.current_mahadasha?.planet || 'Unknown',
        active_hit: null,
      }
    }
  } catch {
    // Table may not exist — skip silently
  }

  let systemPrompt = buildSystemPrompt({
    name: profile.name || 'Seeker',
    dateOfBirth: chart.date_of_birth,
    timeOfBirth: chart.time_of_birth,
    placeOfBirth: chart.place_of_birth,
    westernSummary,
    vedicChart,
    transits,
    vaastuProfile,
  })

  // Append personal transit interpretations (life areas, alerts, timing, house positions)
  if (personalTransitContext) {
    systemPrompt += personalTransitContext
  }

  // Use history from client (no DB session for now)
  const conversationHistory = (history as { role: string; content: string }[])
    .slice(-10)
    .map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  conversationHistory.push({ role: 'user', content: message })

  // Stream response via SSE using OpenAI
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openai = createAI()
        const openaiStream = await openai.chat.completions.create({
          model: getModel(),
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
          ],
        })

        let fullText = ''

        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) {
            fullText += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Save messages to DB after streaming completes.
        // NOTE: Requires the `astra_chat_messages` table in Supabase.
        // If the table doesn't exist, this fails silently and chat still works.
        try {
          await supabase.from('astra_chat_messages').insert([
            { user_id: user.id, role: 'user', content: message },
            { user_id: user.id, role: 'assistant', content: fullText },
          ])
        } catch {
          // DB save failed — don't break the response
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, full_text: fullText })}\n\n`)
        )

        // Try to increment daily message count (may fail if column doesn't exist)
        try {
          await supabase
            .from('astra_profiles')
            .update({ daily_message_count: messageCount + 1 })
            .eq('id', user.id)
        } catch {
          // Column may not exist — skip silently
        }

      } catch (err) {
        console.error('[chat/message] Stream error:', err)
        const errorMsg = 'Astra is meditating, please try again shortly'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
