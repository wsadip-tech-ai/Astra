import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TransitView from '@/components/transit/TransitView'
import type { TransitViewProps } from '@/components/transit/TransitView'
import GlowButton from '@/components/ui/GlowButton'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

export default async function TransitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/transit')

  // Fetch today's transits from engine (server-side)
  let transits: TransitViewProps['transits'] | null = null
  try {
    const resp = await fetch(`${FASTAPI_BASE_URL}/transits/today`, {
      headers: { 'X-Internal-Secret': INTERNAL_SECRET },
      next: { revalidate: 3600 },
    })
    if (resp.ok) {
      transits = await resp.json()
    }
  } catch (err) {
    console.error('[transit/page] Failed to fetch transits:', err)
  }

  // Fetch personal transits if user has Vedic chart
  let personal: TransitViewProps['personal'] = null
  if (transits) {
    try {
      const { data: chart } = await supabase
        .from('astra_birth_charts')
        .select('vedic_chart_json')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      const vedic = chart?.vedic_chart_json as {
        planets?: { name: string; sign: string; degree: number }[]
        lagna?: { sign: string }
      } | null

      if (vedic?.planets) {
        const moonPlanet = vedic.planets.find(p => p.name === 'Moon')
        const moonSign = moonPlanet?.sign ?? vedic.lagna?.sign ?? 'Aries'

        const personalResp = await fetch(`${FASTAPI_BASE_URL}/transits/personal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': INTERNAL_SECRET,
          },
          body: JSON.stringify({
            natal_planets: vedic.planets.map(p => ({
              name: p.name,
              sign: p.sign,
              degree: p.degree,
            })),
            moon_sign: moonSign,
          }),
        })

        if (personalResp.ok) {
          personal = await personalResp.json()
        }
      }
    } catch (err) {
      console.error('[transit/page] Failed to fetch personal transits:', err)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          {transits ? (
            <TransitView transits={transits} personal={personal} />
          ) : (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔭</div>
              <h1 className="font-display text-3xl text-star mb-3">
                Transit Data Unavailable
              </h1>
              <p className="text-muted text-sm mb-6 max-w-md mx-auto">
                The astrology engine is not responding right now. Please try again in a few moments.
              </p>
              <GlowButton href="/dashboard" variant="secondary">
                Back to Dashboard
              </GlowButton>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
