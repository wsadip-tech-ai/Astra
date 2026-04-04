// NOTE: Requires the `astra_chat_messages` table in Supabase.
// If the table doesn't exist, GET returns an empty array and chat still works.
// Schema: id (uuid pk), user_id (uuid fk → auth.users), role (text), content (text), created_at (timestamptz default now())

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: messages } = await supabase
    .from('astra_chat_messages')
    .select('role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return NextResponse.json({ messages: messages || [] })
}
