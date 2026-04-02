import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChartTabs from '@/components/chart/ChartTabs'
import { MOCK_WESTERN_CHART, MOCK_SUMMARY_TEXT } from '@/constants/mock-chart'
import type { WesternChartData } from '@/types'

export default async function ChartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/chart')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, date_of_birth, time_of_birth, place_of_birth, western_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  const chartData: WesternChartData = (chart.western_chart_json as WesternChartData) ?? MOCK_WESTERN_CHART
  const tier = profile?.subscription_tier ?? 'free'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center mb-10">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Your Birth Chart</p>
            <h1 className="font-display text-4xl text-star">{chartData.summary}</h1>
            <p className="text-muted text-sm mt-2">
              {chart.date_of_birth}
              {chart.time_of_birth ? ` · ${chart.time_of_birth}` : ''}
              {' · '}{chart.place_of_birth}
            </p>
          </div>

          <ChartTabs
            chart={chartData}
            summaryText={MOCK_SUMMARY_TEXT}
            tier={tier as 'free' | 'premium'}
          />
        </div>
      </main>
    </>
  )
}
