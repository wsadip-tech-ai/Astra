import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: session } = await supabase
    .from('astra_chats')
    .select('id, messages')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ messages: [], session_id: null })
  }

  return NextResponse.json({
    messages: session.messages || [],
    session_id: session.id,
  })
}
