import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt, buildConversationHistory, createClient as createAI, getModel } from '@/lib/claude'
import { mapProfile } from '@/lib/profile'
import { NextResponse } from 'next/server'

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
  const vedicSummary = (chart.vedic_chart_json as { summary?: string })?.summary ?? null

  const systemPrompt = buildSystemPrompt({
    name: profile.name || 'Seeker',
    dateOfBirth: chart.date_of_birth,
    timeOfBirth: chart.time_of_birth,
    placeOfBirth: chart.place_of_birth,
    westernSummary,
    vedicSummary,
  })

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
