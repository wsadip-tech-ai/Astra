import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CompatibilityView from '@/components/compatibility/CompatibilityView'
import { mapProfile } from '@/lib/profile'

export default async function CompatibilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/compatibility')

  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  const isPremium = profile?.subscription_tier === 'premium'

  // Fetch Vedic chart data for quick mode
  const { data: vedicChart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  const vedicData = vedicChart?.vedic_chart_json as Record<string, unknown> | null
  const moonNak = vedicData
    ? ((vedicData.nakshatras || []) as { planet: string; nakshatra: string; pada: number }[])
        .find(n => n.planet === 'Moon')
    : null
  const moonPlanet = vedicData
    ? ((vedicData.planets || []) as { name: string; sign: string }[])
        .find(p => p.name === 'Moon')
    : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <CompatibilityView
            isPremium={isPremium}
            userMoonSign={moonPlanet?.sign}
            userNakshatra={moonNak?.nakshatra}
            userPada={moonNak?.pada}
          />
        </div>
      </main>
    </>
  )
}
