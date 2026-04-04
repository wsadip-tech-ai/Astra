'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PartnerForm from '@/components/compatibility/PartnerForm'
import QuickModeForm from '@/components/compatibility/QuickModeForm'
import CompatibilityResult from '@/components/compatibility/CompatibilityResult'
import AshtakootaResult from '@/components/compatibility/AshtakootaResult'
import MangalDoshaSection from '@/components/compatibility/MangalDoshaSection'
import CompatibilityNarrative from '@/components/compatibility/CompatibilityNarrative'
import type { CrossAspect, VedicCompatibilityResult } from '@/types'

type Mode = 'full' | 'quick'

interface WesternResult {
  score: number
  aspects: CrossAspect[]
  summary: string
  report: string | null
  partner_chart_id: string
}

interface CompatibilityViewProps {
  isPremium: boolean
  userMoonSign?: string
  userNakshatra?: string
  userPada?: number
}

export default function CompatibilityView({
  isPremium,
  userMoonSign,
  userNakshatra,
  userPada,
}: CompatibilityViewProps) {
  const [mode, setMode] = useState<Mode>('full')
  const [westernResult, setWesternResult] = useState<WesternResult | null>(null)
  const [vedicResult, setVedicResult] = useState<VedicCompatibilityResult | null>(null)
  const [vedicNarrative, setVedicNarrative] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const quickModeAvailable = !!(userMoonSign && userNakshatra)

  async function handleFullSubmit(data: {
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

      const result = await response.json()

      if (result.score === null && !result.vedic) {
        setError('Chart calculations temporarily unavailable. Please try again later.')
        setLoading(false)
        return
      }

      // Western data
      if (result.score !== null) {
        setWesternResult({
          score: result.score,
          aspects: result.aspects,
          summary: result.summary,
          report: result.report,
          partner_chart_id: result.partner_chart_id,
        })
      }

      // Vedic data
      if (result.vedic) {
        setVedicResult(result.vedic)
      }
      if (result.vedic_narrative) {
        setVedicNarrative(result.vedic_narrative)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleQuickSubmit(data: {
    partner_name: string
    user_moon_sign: string
    user_nakshatra: string
    user_pada: number
    partner_moon_sign: string
    partner_nakshatra: string
    partner_pada: number
  }) {
    setLoading(true)
    setError('')
    setPartnerName(data.partner_name)

    try {
      const response = await fetch('/api/compatibility/vedic', {
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

      const result = await response.json()
      if (result.vedic) {
        setVedicResult(result.vedic)
      }
      if (result.narrative) {
        setVedicNarrative(result.narrative)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setWesternResult(null)
    setVedicResult(null)
    setVedicNarrative(null)
    setPartnerName('')
    setError('')
  }

  const hasResults = !!(vedicResult || westernResult)

  // --- Result display ---
  if (hasResults) {
    return (
      <div>
        {/* Vedic Ashtakoota result (primary) */}
        {vedicResult && (
          <>
            <AshtakootaResult
              score={vedicResult.score}
              maxScore={vedicResult.max_score}
              rating={vedicResult.rating}
              kootas={vedicResult.kootas}
              partnerName={partnerName}
            />
            <MangalDoshaSection
              doshas={vedicResult.doshas}
              mangalUser={vedicResult.mangal_dosha_user}
              mangalPartner={vedicResult.mangal_dosha_partner}
              partnerName={partnerName}
            />
          </>
        )}

        {/* AI narrative (premium or upgrade CTA) */}
        <CompatibilityNarrative
          narrative={vedicNarrative}
          isPremium={isPremium}
        />

        {/* Western synastry (only in full mode) */}
        {westernResult && mode === 'full' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="max-w-lg mx-auto mb-4">
              <div className="border-t border-white/5 my-6" />
              <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2 text-center">
                Western Synastry
              </p>
            </div>
            <CompatibilityResult
              score={westernResult.score}
              aspects={westernResult.aspects}
              summary={westernResult.summary}
              report={westernResult.report}
              partnerName={partnerName}
              isPremium={isPremium}
            />
          </motion.div>
        )}

        {/* Reset button */}
        <div className="text-center mt-8">
          <button
            onClick={handleReset}
            className="text-violet-light text-sm hover:text-violet transition-colors"
          >
            &larr; Try another partner
          </button>
        </div>
      </div>
    )
  }

  // --- Form display ---
  return (
    <div>
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">&#10022;</div>
        <h2 className="font-display text-2xl text-star mb-2">Check Your Compatibility</h2>
        <p className="text-muted text-sm">Discover your cosmic connection through Vedic and Western astrology.</p>
      </div>

      {/* Mode toggle */}
      <div className="max-w-md mx-auto mb-8">
        <div className="bg-nebula rounded-full p-1 flex">
          <button
            onClick={() => setMode('full')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'full'
                ? 'bg-violet/20 text-violet-light'
                : 'text-muted hover:text-star'
            }`}
          >
            Full Birth Details
          </button>
          <button
            onClick={() => quickModeAvailable && setMode('quick')}
            disabled={!quickModeAvailable}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'quick'
                ? 'bg-violet/20 text-violet-light'
                : 'text-muted hover:text-star'
            } ${!quickModeAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Quick Mode
          </button>
        </div>
        {!quickModeAvailable && (
          <p className="text-muted text-xs text-center mt-2">
            Generate your Vedic chart first to use Quick Mode
          </p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-md mx-auto mb-4 bg-rose/10 border border-rose/30 rounded-xl p-4 text-center">
          <p className="text-rose text-sm">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-violet/30 border-t-violet rounded-full animate-spin" />
            <span className="text-muted text-sm">Calculating cosmic compatibility...</span>
          </div>
        </div>
      )}

      {/* Forms */}
      <AnimatePresence mode="wait">
        {!loading && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'quick' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'quick' ? -20 : 20 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'full' ? (
              <PartnerForm onSubmit={handleFullSubmit} loading={loading} />
            ) : (
              userMoonSign && userNakshatra && (
                <QuickModeForm
                  onSubmit={handleQuickSubmit}
                  loading={loading}
                  userMoonSign={userMoonSign}
                  userNakshatra={userNakshatra}
                  userPada={userPada ?? 1}
                />
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
