import { createClient } from '@/lib/supabase/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!chart?.vedic_chart_json) {
    return Response.json({ error: 'No Vedic chart' }, { status: 404 })
  }

  try {
    const resp = await fetch(`${FASTAPI_BASE_URL}/chart/personality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET,
      },
      body: JSON.stringify(chart.vedic_chart_json),
    })

    if (!resp.ok) {
      return Response.json({ error: 'Analysis failed' }, { status: 502 })
    }

    return Response.json(await resp.json())
  } catch {
    return Response.json({ error: 'Engine unavailable' }, { status: 502 })
  }
}
