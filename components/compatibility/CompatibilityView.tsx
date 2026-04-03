'use client'

import { useState } from 'react'
import PartnerForm from '@/components/compatibility/PartnerForm'
import CompatibilityResult from '@/components/compatibility/CompatibilityResult'
import type { CrossAspect } from '@/types'

interface Result {
  score: number
  aspects: CrossAspect[]
  summary: string
  report: string | null
  partner_chart_id: string
}

interface CompatibilityViewProps {
  isPremium: boolean
}

export default function CompatibilityView({ isPremium }: CompatibilityViewProps) {
  const [result, setResult] = useState<Result | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(data: {
    partner_name: string
    date_of_birth: string
    time_of_birth: string
    place_of_birth: string
  }) {
    setLoading(true)
    setError('')
    setPartnerName(data.partner_name)

    try {
      const response = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json()
        setError(err.error || 'Something went wrong')
        setLoading(false)
        return
      }

      const resultData = await response.json()
      if (resultData.score === null) {
        setError('Chart calculations temporarily unavailable. Please try again later.')
        setLoading(false)
        return
      }

      setResult(resultData)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <CompatibilityResult
        score={result.score}
        aspects={result.aspects}
        summary={result.summary}
        report={result.report}
        partnerName={partnerName}
        isPremium={isPremium}
        onReset={() => { setResult(null); setPartnerName(''); setError('') }}
      />
    )
  }

  return (
    <div>
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">💫</div>
        <h2 className="font-display text-2xl text-star mb-2">Check Your Compatibility</h2>
        <p className="text-muted text-sm">Enter your partner's birth details to discover your cosmic connection.</p>
      </div>
      {error && (
        <div className="max-w-md mx-auto mb-4 bg-rose/10 border border-rose/30 rounded-xl p-4 text-center">
          <p className="text-rose text-sm">{error}</p>
        </div>
      )}
      <PartnerForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
