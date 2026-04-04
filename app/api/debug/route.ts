import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'not logged in' })

  const { data: charts } = await supabase
    .from('birth_charts')
    .select('id, date_of_birth, place_of_birth, western_chart_json, vedic_chart_json, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    charts: charts?.map(c => ({
      id: c.id,
      dob: c.date_of_birth,
      place: c.place_of_birth,
      has_western: !!c.western_chart_json,
      western_summary: (c.western_chart_json as any)?.summary ?? null,
      has_vedic: !!c.vedic_chart_json,
      created: c.created_at,
    })),
  })
}
