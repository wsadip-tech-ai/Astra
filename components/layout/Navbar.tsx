// components/layout/Navbar.tsx
'use client'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import GlowButton from '@/components/ui/GlowButton'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [sunSign, setSunSign] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session?.user)
      if (session?.user) {
        fetchSunSign(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user)
      if (session?.user) {
        fetchSunSign(session.user.id)
      } else {
        setSunSign(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function fetchSunSign(userId: string) {
    const { data: chart, error } = await supabase
      .from('astra_birth_charts')
      .select('western_chart_json')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[Navbar] Failed to fetch chart:', error.message)
      return
    }

    if (chart?.western_chart_json) {
      const chartData = chart.western_chart_json as { planets?: { name: string; sign: string }[] }
      const sun = chartData.planets?.find(p => p.name === 'Sun')
      if (sun) {
        console.log('[Navbar] Sun sign:', sun.sign)
        setSunSign(sun.sign.toLowerCase())
      }
    }
  }

  const horoscopeHref = sunSign ? `/horoscope/${sunSign}` : '/horoscope/aries'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsAuthed(false)
    setSunSign(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-star tracking-wide">
          ✦ Astra
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href={horoscopeHref} className="text-muted hover:text-star text-sm transition-colors">
            {sunSign ? `${sunSign.charAt(0).toUpperCase() + sunSign.slice(1)} Horoscope` : 'Daily Horoscope'}
          </Link>
          {isAuthed && (
            <Link href="/chat" className="text-muted hover:text-star text-sm transition-colors">
              Chat with Astra
            </Link>
          )}
          <Link href="/pricing" className="text-muted hover:text-star text-sm transition-colors">
            Pricing
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthed ? (
            <>
              <Link href="/dashboard" className="text-muted hover:text-star text-sm transition-colors">
                Dashboard
              </Link>
              <Link href="/settings" className="text-muted hover:text-star text-sm transition-colors">
                Settings
              </Link>
              <button onClick={handleSignOut} className="text-muted hover:text-star text-sm transition-colors cursor-pointer">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-star text-sm transition-colors">
                Sign in
              </Link>
              <GlowButton href="/signup" variant="primary">
                Get Started ✨
              </GlowButton>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-cosmos border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          <Link href={horoscopeHref} className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>
            {sunSign ? `${sunSign.charAt(0).toUpperCase() + sunSign.slice(1)} Horoscope` : 'Daily Horoscope'}
          </Link>
          {isAuthed && (
            <Link href="/chat" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Chat with Astra</Link>
          )}
          <Link href="/pricing" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Pricing</Link>
          {isAuthed ? (
            <>
              <Link href="/dashboard" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/settings" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Settings</Link>
              <button onClick={handleSignOut} className="text-muted hover:text-star text-sm text-left cursor-pointer">Sign out</button>
            </>
          ) : (
            <Link href="/signup" className="text-violet-light text-sm font-semibold" onClick={() => setMenuOpen(false)}>Get Started →</Link>
          )}
        </div>
      )}
    </nav>
  )
}
