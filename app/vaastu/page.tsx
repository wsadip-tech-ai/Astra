import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import VaastuView from '@/components/vaastu/VaastuView'

export default async function VaastuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/vaastu')

  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <VaastuView hasVedicChart={!!chart?.vedic_chart_json} />
        </div>
      </main>
    </>
  )
}
