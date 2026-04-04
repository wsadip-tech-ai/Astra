import { createClient } from '@/lib/supabase/server'
import { createClient as createAI, getModel, buildSystemPrompt } from '@/lib/claude'
import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  results.user = user ? user.email : 'NOT LOGGED IN'
  if (!user) return NextResponse.json(results)

  // Test session insert (no chart_id)
  try {
    const { data: session, error } = await supabase
      .from('astra_chats')
      .insert({ user_id: user.id, messages: [] })
      .select('id')
      .single()
    results.session_created = !!session
    results.session_error = error?.message ?? null
  } catch (e: unknown) {
    results.session_error = e instanceof Error ? e.message : String(e)
  }

  // Test full streaming chat flow
  try {
    const openai = createAI()
    const model = getModel()
    results.model = model

    const stream = await openai.chat.completions.create({
      model,
      max_tokens: 50,
      stream: true,
      messages: [
        { role: 'system', content: 'You are Astra. Reply in one sentence.' },
        { role: 'user', content: 'Hello' },
      ],
    })

    let text = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) text += delta
    }
    results.stream_response = text
    results.stream_ok = true
  } catch (e: unknown) {
    results.stream_ok = false
    results.stream_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
