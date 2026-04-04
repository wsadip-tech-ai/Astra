'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GlowButton from '@/components/ui/GlowButton'
import Link from 'next/link'

interface SettingsFormProps {
  email: string
  name: string
  tier: string
  chart: {
    id: string
    date_of_birth: string
    time_of_birth: string | null
    place_of_birth: string
  } | null
}

export default function SettingsForm({ email, name: initialName, tier, chart }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Profile state
  const [name, setName] = useState(initialName)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Birth details state
  const [dateOfBirth, setDateOfBirth] = useState(chart?.date_of_birth || '')
  const [timeOfBirth, setTimeOfBirth] = useState(chart?.time_of_birth || '')
  const [placeOfBirth, setPlaceOfBirth] = useState(chart?.place_of_birth || '')
  const [chartSaving, setChartSaving] = useState(false)
  const [chartMsg, setChartMsg] = useState('')

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setProfileMsg('Not authenticated')
      setProfileSaving(false)
      return
    }

    const { error } = await supabase
      .from('astra_profiles')
      .update({ name })
      .eq('id', session.user.id)

    setProfileSaving(false)
    if (error) {
      setProfileMsg('Failed to update profile')
    } else {
      setProfileMsg('Profile updated')
      router.refresh()
    }
  }

  async function handleChartSave(e: React.FormEvent) {
    e.preventDefault()
    setChartSaving(true)
    setChartMsg('')

    if (!dateOfBirth || !placeOfBirth) {
      setChartMsg('Date and city of birth are required')
      setChartSaving(false)
      return
    }

    if (chart) {
      // Delete old chart and regenerate (to recalculate via FastAPI)
      await supabase.from('astra_birth_charts').delete().eq('id', chart.id)
    }

    // Call the generate endpoint which geocodes + calculates charts
    const res = await fetch('/api/chart/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: dateOfBirth,
        time_of_birth: timeOfBirth || null,
        place_of_birth: placeOfBirth,
      }),
    })

    setChartSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setChartMsg(data.error || 'Failed to update birth details')
    } else {
      setChartMsg('Birth details updated — chart recalculated')
      router.refresh()
    }
  }

  return (
    <div className="space-y-10">
      {/* Profile section */}
      <section>
        <h2 className="font-display text-xl text-star mb-4">Profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-muted text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50"
            />
          </div>
          <div>
            <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Plan</label>
            <div className="flex items-center gap-3">
              <span className="text-star text-sm capitalize">{tier}</span>
              {tier !== 'premium' && (
                <Link href="/pricing" className="text-violet-light text-xs hover:text-violet transition-colors">
                  Upgrade →
                </Link>
              )}
            </div>
          </div>
          {profileMsg && (
            <p className={`text-sm ${profileMsg.includes('Failed') ? 'text-rose' : 'text-green-400'}`}>{profileMsg}</p>
          )}
          <GlowButton variant="secondary" type="submit" disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </GlowButton>
        </form>
      </section>

      {/* Birth details section */}
      <section>
        <h2 className="font-display text-xl text-star mb-1">Birth Details</h2>
        <p className="text-muted text-xs mb-4">Changing these will recalculate your chart.</p>
        <form onSubmit={handleChartSave} className="space-y-4">
          <div>
            <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              required
              className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50"
            />
          </div>
          <div>
            <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
              Time of Birth <span className="text-muted font-normal normal-case">(optional)</span>
            </label>
            <input
              type="time"
              value={timeOfBirth}
              onChange={e => setTimeOfBirth(e.target.value)}
              className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50"
            />
          </div>
          <div>
            <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">City of Birth</label>
            <input
              type="text"
              value={placeOfBirth}
              onChange={e => setPlaceOfBirth(e.target.value)}
              required
              placeholder="e.g. Kathmandu"
              className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50"
            />
          </div>
          {chartMsg && (
            <p className={`text-sm ${chartMsg.includes('Failed') || chartMsg.includes('required') ? 'text-rose' : 'text-green-400'}`}>{chartMsg}</p>
          )}
          <GlowButton variant="primary" type="submit" disabled={chartSaving}>
            {chartSaving ? 'Recalculating...' : chart ? 'Update Birth Details' : 'Add Birth Details'}
          </GlowButton>
        </form>
      </section>
    </div>
  )
}
