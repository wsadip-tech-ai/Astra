'use client'

import { useState } from 'react'
import BsDatePicker from '@/components/ui/BsDatePicker'

interface PartnerFormProps {
  onSubmit: (data: {
    partner_name: string
    date_of_birth: string
    time_of_birth: string
    place_of_birth: string
  }) => void
  loading: boolean
}

export default function PartnerForm({ onSubmit, loading }: PartnerFormProps) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [tob, setTob] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !dob || !city.trim()) {
      setError('Name, date of birth, and city are required')
      return
    }
    onSubmit({
      partner_name: name.trim(),
      date_of_birth: dob,
      time_of_birth: tob,
      place_of_birth: city.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Partner's Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Sarah"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50"
        />
      </div>
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Date of Birth
        </label>
        <BsDatePicker
          value={dob}
          onChange={setDob}
          variant="nebula"
        />
      </div>
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Time of Birth <span className="text-muted font-normal normal-case">(optional)</span>
        </label>
        <input
          type="time"
          value={tob}
          onChange={e => setTob(e.target.value)}
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50"
        />
      </div>
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          City of Birth
        </label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Pokhara"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50"
        />
      </div>
      {error && <p className="text-rose text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet to-rose text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-violet/30 transition-all"
      >
        {loading ? 'Calculating...' : 'Check Compatibility ✦'}
      </button>
    </form>
  )
}
