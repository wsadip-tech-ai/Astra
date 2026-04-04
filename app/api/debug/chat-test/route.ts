import { createClient } from '@/lib/supabase/server'
import { createClient as createAI, getModel } from '@/lib/claude'
import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  results.user = user?.email ?? 'NOT LOGGED IN'
  if (!user) return NextResponse.json(results)

  // Test session insert with new table
  const { data: session, error: sessErr } = await supabase
    .from('user_chats')
    .insert({ user_id: user.id, msgs: [] })
    .select('id')
    .single()
  results.session_insert = session ? 'OK - id: ' + session.id : sessErr?.message

  // Test streaming
  try {
    const openai = createAI()
    const stream = await openai.chat.completions.create({
      model: getModel(),
      max_tokens: 30,
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
    results.stream = text
  } catch (e: unknown) {
    results.stream_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
