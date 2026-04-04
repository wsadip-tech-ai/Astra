'use client'

import { useState } from 'react'
import { SANSKRIT_SIGNS, SIGN_ENGLISH, SIGN_NAKSHATRAS } from '@/constants/nakshatras'

interface QuickModeFormProps {
  onSubmit: (data: {
    partner_name: string
    user_moon_sign: string
    user_nakshatra: string
    user_pada: number
    partner_moon_sign: string
    partner_nakshatra: string
    partner_pada: number
  }) => void
  loading: boolean
  userMoonSign: string
  userNakshatra: string
  userPada: number
}

export default function QuickModeForm({
  onSubmit,
  loading,
  userMoonSign,
  userNakshatra,
  userPada,
}: QuickModeFormProps) {
  const [partnerName, setPartnerName] = useState('')
  const [partnerSign, setPartnerSign] = useState('')
  const [partnerNakshatra, setPartnerNakshatra] = useState('')
  const [partnerPada, setPartnerPada] = useState(1)
  const [error, setError] = useState('')

  const availableNakshatras = partnerSign ? SIGN_NAKSHATRAS[partnerSign] || [] : []

  function handleSignChange(sign: string) {
    setPartnerSign(sign)
    setPartnerNakshatra('')
    setPartnerPada(1)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!partnerName.trim()) {
      setError('Partner name is required')
      return
    }
    if (!partnerSign) {
      setError('Please select a Moon sign')
      return
    }
    if (!partnerNakshatra) {
      setError('Please select a Nakshatra')
      return
    }

    onSubmit({
      partner_name: partnerName.trim(),
      user_moon_sign: userMoonSign,
      user_nakshatra: userNakshatra,
      user_pada: userPada,
      partner_moon_sign: partnerSign,
      partner_nakshatra: partnerNakshatra,
      partner_pada: partnerPada,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      {/* Your Moon info display */}
      <div className="bg-nebula border border-white/5 rounded-xl p-4 mb-2">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Your Moon Placement
        </p>
        <p className="text-star text-sm">
          {userMoonSign} ({SIGN_ENGLISH[userMoonSign]}) &middot; {userNakshatra} &middot; Pada {userPada}
        </p>
      </div>

      {/* Partner name */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Partner&apos;s Name
        </label>
        <input
          type="text"
          value={partnerName}
          onChange={e => setPartnerName(e.target.value)}
          placeholder="e.g. Sarah"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50"
        />
      </div>

      {/* Partner Moon sign */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Partner&apos;s Moon Sign
        </label>
        <select
          value={partnerSign}
          onChange={e => handleSignChange(e.target.value)}
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50 appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
          }}
        >
          <option value="" className="bg-nebula text-muted">Select Moon sign...</option>
          {SANSKRIT_SIGNS.map(sign => (
            <option key={sign} value={sign} className="bg-nebula text-star">
              {sign} ({SIGN_ENGLISH[sign]})
            </option>
          ))}
        </select>
      </div>

      {/* Partner Nakshatra */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Partner&apos;s Nakshatra
        </label>
        <select
          value={partnerNakshatra}
          onChange={e => setPartnerNakshatra(e.target.value)}
          disabled={!partnerSign}
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50 disabled:opacity-40 disabled:cursor-not-allowed appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
          }}
        >
          <option value="" className="bg-nebula text-muted">
            {partnerSign ? 'Select Nakshatra...' : 'Select a Moon sign first'}
          </option>
          {availableNakshatras.map(nak => (
            <option key={nak} value={nak} className="bg-nebula text-star">
              {nak}
            </option>
          ))}
        </select>
      </div>

      {/* Partner Pada */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Partner&apos;s Pada
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPartnerPada(p)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                partnerPada === p
                  ? 'bg-violet/20 text-violet-light border border-violet/40'
                  : 'bg-nebula text-muted border border-white/10 hover:border-white/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-rose text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet to-rose text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-violet/30 transition-all"
      >
        {loading ? 'Calculating...' : 'Check Vedic Compatibility'}
      </button>
    </form>
  )
}
