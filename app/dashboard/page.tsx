import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import GlowButton from '@/components/ui/GlowButton'
import CosmicProfile from '@/components/dashboard/CosmicProfile'
import CosmicWeather from '@/components/dashboard/CosmicWeather'
import Link from 'next/link'
import { MOCK_WESTERN_CHART, MOCK_COSMIC_WEATHER } from '@/constants/mock-chart'
import type { WesternChartData } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, place_of_birth, date_of_birth, western_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'
  const chartData: WesternChartData | null = chart
    ? ((chart.western_chart_json as WesternChartData) ?? MOCK_WESTERN_CHART)
    : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <div className="mb-10">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Welcome back</p>
            <h1 className="font-display text-4xl text-star">Hello, {firstName} ✦</h1>
            <p className="text-muted mt-2">
              {profile?.subscription_tier === 'premium' ? '⭐ Premium member' : 'Free plan · '}
              {profile?.subscription_tier !== 'premium' && (
                <Link href="/pricing" className="text-violet-light hover:text-violet transition-colors">Upgrade to Premium</Link>
              )}
            </p>
          </div>

          {/* Onboarding prompt if no chart */}
          {!chart && (
            <div className="bg-violet/10 border border-violet/30 rounded-2xl p-8 mb-8 text-center">
              <div className="text-4xl mb-3">🌟</div>
              <h2 className="font-display text-2xl text-star mb-2">Complete your cosmic profile</h2>
              <p className="text-muted text-sm mb-6">Add your birth details so Astra can read your personal chart.</p>
              <GlowButton href="/signup/onboarding" variant="primary">Add Birth Details →</GlowButton>
            </div>
          )}

          {/* Cosmic Profile — Big 3 summary (only if chart exists) */}
          {chartData && <CosmicProfile chart={chartData} />}

          {/* Today's Cosmic Weather — always shown */}
          <CosmicWeather entries={MOCK_COSMIC_WEATHER} />

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌙', title: 'My Birth Chart', desc: 'View your natal chart — Western and Vedic', href: '/chart', locked: !chart },
              { icon: '🎙️', title: 'Talk to Astra', desc: 'Ask anything by voice or text', href: '/chat', locked: !chart },
              { icon: '💫', title: 'Compatibility', desc: 'Check your compatibility with a partner', href: '/compatibility', locked: !chart },
            ].map(card => card.locked ? (
              <div
                key={card.title}
                aria-disabled="true"
                className="bg-cosmos border border-white/5 rounded-2xl p-6 opacity-50 cursor-not-allowed"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-star font-semibold mb-1">{card.title}</h3>
                <p className="text-muted text-sm">{card.desc}</p>
              </div>
            ) : (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-cosmos border border-white/10 rounded-2xl p-6 transition-all hover:border-violet/30 hover:bg-violet/5"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-star font-semibold mb-1">{card.title}</h3>
                <p className="text-muted text-sm">{card.desc}</p>
                <span className="text-violet-light text-xs mt-3 block group-hover:translate-x-1 transition-transform">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
