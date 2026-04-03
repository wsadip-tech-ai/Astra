'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GlowButton from '@/components/ui/GlowButton'
import StarField from '@/components/ui/StarField'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient flex items-center justify-center relative overflow-hidden px-6">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl text-star">✦ Astra</Link>
          <h1 className="font-display text-3xl text-star mt-4 mb-2">Welcome back</h1>
          <p className="text-muted text-sm">The stars have been waiting for you.</p>
        </div>

        <div className="bg-cosmos border border-white/10 rounded-2xl p-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-star text-sm font-medium transition-all mb-6"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-muted text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder-muted focus:outline-none focus:border-violet/50 transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder-muted focus:outline-none focus:border-violet/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <GlowButton variant="primary" className="w-full mt-2" disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Sign in →'}
            </GlowButton>
          </form>
        </div>

        <p className="text-center text-muted text-sm mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-violet-light hover:text-violet transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
