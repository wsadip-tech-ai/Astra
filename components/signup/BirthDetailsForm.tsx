// components/signup/BirthDetailsForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GlowButton from '@/components/ui/GlowButton'

export default function BirthDetailsForm() {
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [timeOfBirth, setTimeOfBirth] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chart/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_of_birth: dateOfBirth,
          time_of_birth: timeOfBirth || null,
          place_of_birth: placeOfBirth,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        setLoading(false)
        return
      }

      setLoading(false)
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-star text-sm mb-1" htmlFor="date-of-birth">
          Date of Birth <span className="text-rose">*</span>
        </label>
        <input
          id="date-of-birth"
          type="date"
          value={dateOfBirth}
          onChange={e => setDateOfBirth(e.target.value)}
          required
          className="w-full bg-cosmos border border-white/10 rounded-lg px-4 py-3 text-star focus:outline-none focus:border-violet/60"
        />
      </div>

      <div>
        <label className="block text-star text-sm mb-1" htmlFor="time-of-birth">
          Time of Birth <span className="text-muted text-xs">(optional — improves accuracy)</span>
        </label>
        <input
          id="time-of-birth"
          type="time"
          value={timeOfBirth}
          onChange={e => setTimeOfBirth(e.target.value)}
          className="w-full bg-cosmos border border-white/10 rounded-lg px-4 py-3 text-star focus:outline-none focus:border-violet/60"
        />
      </div>

      <div>
        <label className="block text-star text-sm mb-1" htmlFor="place-of-birth">
          City of Birth <span className="text-rose">*</span>
        </label>
        <input
          id="place-of-birth"
          type="text"
          value={placeOfBirth}
          onChange={e => setPlaceOfBirth(e.target.value)}
          required
          placeholder="e.g. Kathmandu, Mumbai, London"
          className="w-full bg-cosmos border border-white/10 rounded-lg px-4 py-3 text-star placeholder-muted focus:outline-none focus:border-violet/60"
        />
        <p className="text-muted text-xs mt-1.5">Enter the city where you were born. If your city isn't found, try the nearest major city.</p>
      </div>

      {error && <p className="text-rose text-sm">{error}</p>}

      <GlowButton variant="primary" disabled={loading} type="submit">
        {loading ? 'Finding your chart…' : 'Generate My Chart ✦'}
      </GlowButton>

      <button
        type="button"
        onClick={handleSkip}
        className="text-muted text-sm text-center hover:text-star transition-colors"
      >
        Skip for now — I'll add this later
      </button>
    </form>
  )
}
