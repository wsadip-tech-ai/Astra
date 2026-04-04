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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <CompatibilityView isPremium={isPremium} />
        </div>
      </main>
    </>
  )
}
