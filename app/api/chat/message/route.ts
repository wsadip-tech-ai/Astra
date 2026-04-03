import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt, buildConversationHistory, createClient as createClaude, getModel, summarizeOlderMessages } from '@/lib/claude'
import { NextResponse } from 'next/server'
import type { ChatMessage } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message } = await request.json()
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  // Fetch profile and check limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier, daily_message_count, daily_reset_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Reset daily count if new day
  const today = new Date().toISOString().split('T')[0]
  let messageCount = profile.daily_message_count
  if (profile.daily_reset_at < today) {
    messageCount = 0
    await supabase
      .from('profiles')
      .update({ daily_message_count: 0, daily_reset_at: today })
      .eq('id', user.id)
  }

  // Check free tier limit
  if (profile.subscription_tier !== 'premium' && messageCount >= 3) {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
  }

  // Fetch birth chart
  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, date_of_birth, time_of_birth, place_of_birth, western_chart_json, vedic_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) {
    return NextResponse.json({ error: 'no_chart' }, { status: 400 })
  }

  // Fetch or create chat session
  let { data: session } = await supabase
    .from('chat_sessions')
    .select('id, messages')
    .eq('user_id', user.id)
    .eq('chart_id', chart.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) {
    const { data: newSession } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, chart_id: chart.id, messages: [] })
      .select('id, messages')
      .single()
    session = newSession
  }

  if (!session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const existingMessages: ChatMessage[] = (session.messages as ChatMessage[]) || []

  // Build prompt
  const westernSummary = (chart.western_chart_json as { summary?: string })?.summary ?? 'not calculated'
  const vedicSummary = (chart.vedic_chart_json as { summary?: string })?.summary ?? null

  // Summarize older messages if conversation is long
  const claude = createClaude()
  let conversationSummary: string | undefined
  if (existingMessages.length > 10) {
    try {
      conversationSummary = await summarizeOlderMessages(existingMessages, claude)
    } catch {
      // Summarization failed — proceed without it
    }
  }

  const systemPrompt = buildSystemPrompt({
    name: profile.name || 'Seeker',
    dateOfBirth: chart.date_of_birth,
    timeOfBirth: chart.time_of_birth,
    placeOfBirth: chart.place_of_birth,
    westernSummary,
    vedicSummary,
    conversationSummary,
  })

  const conversationHistory = buildConversationHistory(existingMessages)
  conversationHistory.push({ role: 'user', content: message })

  // Stream response via SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = claude.messages.stream({
          model: getModel(),
          max_tokens: 1024,
          system: systemPrompt,
          messages: conversationHistory,
        })

        let fullText = ''

        claudeStream.on('text', (text) => {
          fullText += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        })

        await claudeStream.finalMessage()

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, full_text: fullText })}\n\n`)
        )

        // Save messages and increment count (don't block the stream)
        const now = new Date().toISOString()
        const updatedMessages = [
          ...existingMessages,
          { role: 'user' as const, content: message, timestamp: now },
          { role: 'assistant' as const, content: fullText, timestamp: now },
        ]

        await Promise.all([
          supabase
            .from('chat_sessions')
            .update({ messages: updatedMessages, updated_at: now })
            .eq('id', session!.id),
          supabase
            .from('profiles')
            .update({ daily_message_count: messageCount + 1 })
            .eq('id', user.id),
        ])
      } catch (err) {
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
