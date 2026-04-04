import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import GlowButton from '@/components/ui/GlowButton'
import CosmicProfile from '@/components/dashboard/CosmicProfile'
import Link from 'next/link'
import { mapProfile } from '@/lib/profile'
import type { WesternChartData } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('id, place_of_birth, date_of_birth, western_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'
  const chartData = chart?.western_chart_json as WesternChartData | null
  const chartNeedsCalculation = chart && !chartData

  // Derive sun sign for horoscope link
  const sunSign = chartData?.planets?.find(p => p.name === 'Sun')?.sign?.toLowerCase()

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

          {/* Onboarding prompt if no chart at all */}
          {!chart && (
            <div className="bg-violet/10 border border-violet/30 rounded-2xl p-8 mb-8 text-center">
              <div className="text-4xl mb-3">🌟</div>
              <h2 className="font-display text-2xl text-star mb-2">Complete your cosmic profile</h2>
              <p className="text-muted text-sm mb-6">Add your birth details so Astra can read your personal chart.</p>
              <GlowButton href="/signup/onboarding" variant="primary">Add Birth Details →</GlowButton>
            </div>
          )}

          {/* Chart saved but not calculated (engine was down) */}
          {chartNeedsCalculation && (
            <div className="bg-violet/10 border border-violet/30 rounded-2xl p-6 mb-8 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="text-star font-semibold mb-1">Chart needs calculation</h3>
              <p className="text-muted text-sm mb-4">Your birth details are saved but the chart hasn't been calculated yet. Make sure the engine is running and update your details in Settings.</p>
              <GlowButton href="/settings" variant="secondary">Go to Settings →</GlowButton>
            </div>
          )}

          {/* Cosmic Profile — Big 3 summary (only if chart is calculated) */}
          {chartData && <CosmicProfile chart={chartData} />}

          {/* Your Daily Horoscope link */}
          {sunSign && (
            <div className="mb-8">
              <Link
                href={`/horoscope/${sunSign}`}
                className="block bg-gradient-to-r from-violet/10 to-rose/10 border border-violet/20 rounded-2xl p-5 hover:border-violet/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-1">Your Daily Horoscope</p>
                    <p className="text-star font-display text-lg capitalize">{sunSign}</p>
                  </div>
                  <span className="text-violet-light text-sm group-hover:translate-x-1 transition-transform">Read →</span>
                </div>
              </Link>
            </div>
          )}

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌙', title: 'My Birth Chart', desc: 'View your natal chart — Western and Vedic', href: '/chart', locked: !chartData },
              { icon: '🎙️', title: 'Talk to Astra', desc: 'Ask anything by voice or text', href: '/chat', locked: !chart },
              { icon: '💫', title: 'Compatibility', desc: 'Check your compatibility with a partner', href: '/compatibility', locked: !chart },
            ].map(card => card.locked ? (
              <div
                key={card.title}
                aria-disabled="true"
                title="Add your birth details first to unlock this feature"
                className="bg-cosmos border border-white/5 rounded-2xl p-6 opacity-50 cursor-not-allowed relative group"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-star font-semibold mb-1">{card.title}</h3>
                <p className="text-muted text-sm">{card.desc}</p>
                <div className="absolute inset-x-0 bottom-0 translate-y-full pt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-violet/90 text-white text-xs rounded-lg px-3 py-2 text-center mx-4">
                    Add your birth details to unlock this feature
                  </div>
                </div>
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
