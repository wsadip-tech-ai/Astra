import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/settings')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, date_of_birth, time_of_birth, place_of_birth')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-lg mx-auto py-12">
          <h1 className="font-display text-3xl text-star mb-2">Settings</h1>
          <p className="text-muted text-sm mb-8">Update your profile and birth details.</p>
          <SettingsForm
            email={user.email || ''}
            name={profile?.name || ''}
            tier={profile?.subscription_tier || 'free'}
            chart={chart ? {
              id: chart.id,
              date_of_birth: chart.date_of_birth,
              time_of_birth: chart.time_of_birth,
              place_of_birth: chart.place_of_birth,
            } : null}
          />
        </div>
      </main>
    </>
  )
}
