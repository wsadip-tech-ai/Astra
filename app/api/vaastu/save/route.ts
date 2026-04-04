import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { VaastuProperty, VaastuRoomDetails } from '@/types/vaastu'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { property, room_details } = body as { property: VaastuProperty; room_details?: VaastuRoomDetails }

  try {
    const { error } = await supabase
      .from('astra_vaastu_properties')
      .upsert(
        {
          user_id: user.id,
          length: property.length,
          breadth: property.breadth,
          entrance_direction: property.entrance_direction,
          floor_level: property.floor_level,
          room_details: room_details ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      // Table may not exist yet — fail silently
      console.warn('vaastu save warning:', error.message)
    }
  } catch (err) {
    // Catch any unexpected errors silently
    console.warn('vaastu save error:', err)
  }

  return NextResponse.json({ ok: true })
}
