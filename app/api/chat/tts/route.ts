import { createClient } from '@/lib/supabase/server'
import { generateSpeech } from '@/lib/tts'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await request.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const audio = await generateSpeech(text)
  if (!audio) {
    return new Response(null, { status: 204 })
  }

  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audio.byteLength),
    },
  })
}
