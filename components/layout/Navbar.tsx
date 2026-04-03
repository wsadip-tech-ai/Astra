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
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthed(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsAuthed(false)
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
          <Link href="/horoscope/aries" className="text-muted hover:text-star text-sm transition-colors">
            Daily Horoscope
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
          <Link href="/horoscope/aries" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Daily Horoscope</Link>
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
