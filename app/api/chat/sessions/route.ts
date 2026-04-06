import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: list user's chat sessions (newest first, max 20)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch sessions with message count via a subquery
  const { data: sessions, error } = await supabase
    .from('astra_chat_sessions')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  // Get message counts per session
  const sessionIds = (sessions || []).map(s => s.id)
  let messageCounts: Record<string, number> = {}

  if (sessionIds.length > 0) {
    const { data: counts } = await supabase
      .from('astra_chat_messages')
      .select('session_id')
      .in('session_id', sessionIds)

    if (counts) {
      for (const row of counts) {
        if (row.session_id) {
          messageCounts[row.session_id] = (messageCounts[row.session_id] || 0) + 1
        }
      }
    }
  }

  const enriched = (sessions || []).map(s => ({
    ...s,
    message_count: messageCounts[s.id] || 0,
  }))

  return NextResponse.json({ sessions: enriched })
}

// POST: create a new session
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const title = (body.title as string)?.slice(0, 100) || 'New conversation'

  const { data: session, error } = await supabase
    .from('astra_chat_sessions')
    .insert({ user_id: user.id, title })
    .select('id, title, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json(session, { status: 201 })
}
