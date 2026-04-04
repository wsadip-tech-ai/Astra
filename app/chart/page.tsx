import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChartTabs from '@/components/chart/ChartTabs'
import GlowButton from '@/components/ui/GlowButton'
import type { WesternChartData } from '@/types'
import { mapProfile } from '@/lib/profile'

function generateSummaryText(chart: WesternChartData): string {
  const sun = chart.planets.find(p => p.name === 'Sun')
  const moon = chart.planets.find(p => p.name === 'Moon')
  const asc = chart.houses.find(h => h.number === 1)

  const parts: string[] = []
  if (sun) parts.push(`Your ${sun.sign} Sun gives you ${sun.sign === 'Aries' ? 'bold initiative' : sun.sign === 'Taurus' ? 'grounded determination' : sun.sign === 'Gemini' ? 'curious adaptability' : sun.sign === 'Cancer' ? 'nurturing depth' : sun.sign === 'Leo' ? 'radiant confidence' : sun.sign === 'Virgo' ? 'analytical precision' : sun.sign === 'Libra' ? 'harmonious diplomacy' : sun.sign === 'Scorpio' ? 'intense focus' : sun.sign === 'Sagittarius' ? 'adventurous optimism' : sun.sign === 'Capricorn' ? 'ambitious discipline' : sun.sign === 'Aquarius' ? 'visionary independence' : 'intuitive compassion'}.`)
  if (moon) parts.push(`With your Moon in ${moon.sign}, you process emotions with ${moon.sign === 'Aries' ? 'fiery immediacy' : moon.sign === 'Taurus' ? 'steady patience' : moon.sign === 'Gemini' ? 'intellectual curiosity' : moon.sign === 'Cancer' ? 'deep sensitivity' : moon.sign === 'Leo' ? 'dramatic warmth' : moon.sign === 'Virgo' ? 'careful analysis' : moon.sign === 'Libra' ? 'graceful balance' : moon.sign === 'Scorpio' ? 'powerful intensity' : moon.sign === 'Sagittarius' ? 'restless freedom' : moon.sign === 'Capricorn' ? 'reserved strength' : moon.sign === 'Aquarius' ? 'detached clarity' : 'boundless empathy'}.`)
  if (asc) parts.push(`${asc.sign} rising means others see you as ${asc.sign === 'Aries' ? 'bold and direct' : asc.sign === 'Taurus' ? 'calm and reliable' : asc.sign === 'Gemini' ? 'witty and engaging' : asc.sign === 'Cancer' ? 'warm and approachable' : asc.sign === 'Leo' ? 'charismatic and proud' : asc.sign === 'Virgo' ? 'thoughtful and composed' : asc.sign === 'Libra' ? 'charming and diplomatic' : asc.sign === 'Scorpio' ? 'magnetic and mysterious' : asc.sign === 'Sagittarius' ? 'friendly and adventurous' : asc.sign === 'Capricorn' ? 'serious and capable' : asc.sign === 'Aquarius' ? 'unique and progressive' : 'gentle and dreamy'}.`)

  return parts.join(' ')
}

export default async function ChartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/chart')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, date_of_birth, time_of_birth, place_of_birth, western_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  const chartData = chart.western_chart_json as WesternChartData | null
  const tier = profile?.subscription_tier ?? 'free'

  if (!chartData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-void pt-24 px-6">
          <div className="max-w-lg mx-auto py-24 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h1 className="font-display text-3xl text-star mb-3">Chart Not Yet Calculated</h1>
            <p className="text-muted text-sm mb-6">Your birth details are saved but the chart engine hasn't calculated your positions yet. Update your birth details to trigger calculation.</p>
            <GlowButton href="/settings" variant="primary">Go to Settings →</GlowButton>
          </div>
        </main>
      </>
    )
  }

  const summaryText = generateSummaryText(chartData)

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
            summaryText={summaryText}
            tier={tier as 'free' | 'premium'}
          />
        </div>
      </main>
    </>
  )
}
