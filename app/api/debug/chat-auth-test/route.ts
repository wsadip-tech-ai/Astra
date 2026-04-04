import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not logged in' })

  // Fetch profile with just id to see what works
  const { data: raw, error: rawErr } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    user: user.email,
    profile_columns: raw ? Object.keys(raw) : null,
    profile_data: raw,
    profile_error: rawErr?.message ?? null,
  })
}
