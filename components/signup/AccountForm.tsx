'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GlowButton from '@/components/ui/GlowButton'

export default function AccountForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Sign in immediately so the user has a session on the onboarding page
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Account created — please check your email to confirm, then sign in.')
        setLoading(false)
        return
      }

      router.push('/signup/onboarding')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/signup/onboarding` },
      })
    } catch {
      setError('Could not connect to Google. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-star text-sm mb-1" htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-cosmos border border-white/10 rounded-lg px-4 py-3 text-star placeholder-muted focus:outline-none focus:border-violet/60"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-star text-sm mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-cosmos border border-white/10 rounded-lg px-4 py-3 text-star placeholder-muted focus:outline-none focus:border-violet/60"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-star text-sm mb-1" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-cosmos border border-white/10 rounded-lg px-4 py-3 text-star placeholder-muted focus:outline-none focus:border-violet/60"
          placeholder="Min. 8 characters"
        />
      </div>
      {error && <p className="text-rose text-sm">{error}</p>}
      <GlowButton variant="primary" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account →'}
      </GlowButton>
      <div className="relative flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-muted text-xs">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <GlowButton variant="secondary" onClick={handleGoogle} type="button">
        Continue with Google
      </GlowButton>
      <p className="text-muted text-sm text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-violet-light hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
