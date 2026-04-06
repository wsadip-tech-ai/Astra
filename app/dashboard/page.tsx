import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import GlowButton from '@/components/ui/GlowButton'
import CosmicProfile from '@/components/dashboard/CosmicProfile'
import DayAtGlance from '@/components/dashboard/DayAtGlance'
import UpcomingEvents from '@/components/dashboard/UpcomingEvents'
import QuickPrompts from '@/components/dashboard/QuickPrompts'
import PersonalitySnapshot from '@/components/dashboard/PersonalitySnapshot'
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
    .select('id, place_of_birth, date_of_birth, western_chart_json, vedic_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'
  const chartData = chart?.western_chart_json as WesternChartData | null
  const chartNeedsCalculation = chart && !chartData
  const hasVedicChart = !!(chart?.vedic_chart_json)

  // Derive sun sign for horoscope link
  const sunSign = chartData?.planets?.find(p => p.name === 'Sun')?.sign?.toLowerCase()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">

          {/* ── 1. Greeting ───────────────────────────────────────────── */}
          <div className="mb-8">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Welcome back</p>
            <h1 className="font-display text-4xl text-star">Hello, {firstName} &#10022;</h1>
            <p className="text-muted mt-2">
              {profile?.subscription_tier === 'premium' ? '\u2B50 Premium member' : 'Free plan \u00B7 '}
              {profile?.subscription_tier !== 'premium' && (
                <Link href="/pricing" className="text-violet-light hover:text-violet transition-colors">Upgrade to Premium</Link>
              )}
            </p>
          </div>

          {/* ── Onboarding prompt if no chart at all ──────────────────── */}
          {!chart && (
            <div className="bg-violet/10 border border-violet/30 rounded-2xl p-8 mb-8 text-center">
              <div className="text-4xl mb-3">{'\uD83C\uDF1F'}</div>
              <h2 className="font-display text-2xl text-star mb-2">Complete your cosmic profile</h2>
              <p className="text-muted text-sm mb-6">Add your birth details so Astra can read your personal chart.</p>
              <GlowButton href="/signup/onboarding" variant="primary">Add Birth Details &rarr;</GlowButton>
            </div>
          )}

          {/* ── Chart saved but not calculated ────────────────────────── */}
          {chartNeedsCalculation && (
            <div className="bg-violet/10 border border-violet/30 rounded-2xl p-6 mb-8 text-center">
              <div className="text-3xl mb-2">{'\uD83D\uDD04'}</div>
              <h3 className="text-star font-semibold mb-1">Chart needs calculation</h3>
              <p className="text-muted text-sm mb-4">Your birth details are saved but the chart hasn&apos;t been calculated yet. Make sure the engine is running and update your details in Settings.</p>
              <GlowButton href="/settings" variant="secondary">Go to Settings &rarr;</GlowButton>
            </div>
          )}

          {/* ── 2. Day at a Glance — personalized day quality + alert ── */}
          {hasVedicChart && <DayAtGlance />}

          {/* ── 3. Coming Up — yoga countdown cards ───────────────────── */}
          {hasVedicChart && <UpcomingEvents />}

          {/* ── 4. Ask Astra — quick prompt chips ─────────────────────── */}
          {chart && <QuickPrompts />}

          {/* ── 5. Cosmic Profile — Big 3 (compact row) ───────────────── */}
          {chartData && <CosmicProfile chart={chartData} />}

          {/* ── 6. Daily Horoscope link ────────────────────────────────── */}
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
                  <span className="text-violet-light text-sm group-hover:translate-x-1 transition-transform">Read &rarr;</span>
                </div>
              </Link>
            </div>
          )}

          {/* ── 7. Personality Snapshot ────────────────────────────────── */}
          {chartData && <PersonalitySnapshot />}

          {/* ── 8. Feature navigation — compact row ───────────────────── */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: '\uD83C\uDF19', title: 'My Kundali', desc: 'View your natal chart', href: '/chart', locked: !chartData },
              { icon: '\uD83C\uDF99\uFE0F', title: 'Talk to Astra', desc: 'Voice or text chat', href: '/chat', locked: !chart },
              { icon: '\uD83D\uDCAB', title: 'Compatibility', desc: 'Partner matching', href: '/compatibility', locked: !chart },
              { icon: '\uD83D\uDD2D', title: 'Transits', desc: 'Planetary movements', href: '/transit', locked: !chart },
            ].map(card => card.locked ? (
              <div
                key={card.title}
                aria-disabled="true"
                title="Add your birth details first to unlock this feature"
                className="bg-cosmos border border-white/5 rounded-2xl p-4 opacity-50 cursor-not-allowed relative group"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="text-star font-semibold text-sm mb-0.5">{card.title}</h3>
                <p className="text-muted text-xs">{card.desc}</p>
                <div className="absolute inset-x-0 bottom-0 translate-y-full pt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-violet/90 text-white text-xs rounded-lg px-3 py-2 text-center mx-4">
                    Add your birth details to unlock
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-cosmos border border-white/10 rounded-2xl p-4 transition-all hover:border-violet/30 hover:bg-violet/5"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="text-star font-semibold text-sm mb-0.5">{card.title}</h3>
                <p className="text-muted text-xs">{card.desc}</p>
                <span className="text-violet-light text-[11px] mt-2 block group-hover:translate-x-1 transition-transform">
                  Open &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
