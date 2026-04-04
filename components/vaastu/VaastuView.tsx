'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import GlowButton from '@/components/ui/GlowButton'
import PropertyForm from './PropertyForm'
import CompassGrid from './CompassGrid'
import AayadiCard from './AayadiCard'
import HitReport from './HitReport'
import SpatialFindings from './SpatialFindings'
import RemedyList from './RemedyList'
import type { VaastuDiagnosticResult, VaastuZoneStatus } from '@/types/vaastu'

interface VaastuViewProps {
  hasVedicChart: boolean
}

export default function VaastuView({ hasVedicChart }: VaastuViewProps) {
  const [result, setResult] = useState<VaastuDiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  /* ── No Vedic chart CTA ── */
  if (!hasVedicChart) {
    return (
      <div className="rounded-2xl bg-violet/10 border border-violet/30 p-8 text-center space-y-4">
        <div className="text-3xl">&#x2736;</div>
        <h2 className="font-display text-xl text-star">Vedic Chart Required</h2>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Generate your Vedic birth chart first to unlock Astro-Vaastu analysis.
          Your planetary positions are used to map energy zones in your living space.
        </p>
        <GlowButton href="/chart" variant="primary">
          Generate Your Chart
        </GlowButton>
      </div>
    )
  }

  /* ── Submit handler ── */
  async function handleSubmit(data: {
    property: { length: number; breadth: number; entrance_direction: string; floor_level: string }
    room_details?: Record<string, unknown>
    user_name_initial?: string
  }) {
    setLoading(true)
    setError('')
    setResult(null)
    setSelectedZone(null)

    try {
      const res = await fetch('/api/vaastu/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Analysis failed (${res.status})`)
      }

      const diagnostic: VaastuDiagnosticResult = await res.json()
      setResult(diagnostic)

      // Fire-and-forget save
      fetch('/api/vaastu/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: data.property }),
      }).catch(() => {})

      // Scroll to results after render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Reset ── */
  function handleReset() {
    setResult(null)
    setError('')
    setSelectedZone(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Zone click handler ── */
  function handleZoneClick(zone: VaastuZoneStatus) {
    setSelectedZone(prev => (prev === zone.zone ? null : zone.zone))
  }

  /* ── Check if spatial findings have meaningful content beyond entrance ── */
  const hasMeaningfulSpatial =
    result && result.spatial_findings.length > 1

  /* ── Render ── */
  return (
    <div className="space-y-10">
      {/* Intro */}
      <div className="text-center space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl text-star tracking-wide">
          Astro-Vaastu Analysis
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Map your birth chart onto your living space to identify energy zones
          and get personalized remedies.
        </p>
      </div>

      {/* Form */}
      {!result && (
        <PropertyForm onSubmit={handleSubmit} loading={loading} />
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl bg-rose/10 border border-rose/30 px-5 py-4 text-rose text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-10"
          >
            {/* Compass Grid — hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <CompassGrid
                zones={result.zone_map}
                onZoneClick={handleZoneClick}
                selectedZone={selectedZone}
              />
            </motion.div>

            {/* Aayadi */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <AayadiCard aayadi={result.aayadi} />
            </motion.div>

            {/* HITs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <HitReport hits={result.hits} />
            </motion.div>

            {/* Spatial Findings */}
            {hasMeaningfulSpatial && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <SpatialFindings
                  findings={result.spatial_findings}
                  plantRecommendations={result.plant_recommendations}
                />
              </motion.div>
            )}

            {/* Remedies */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <RemedyList
                remedies={result.remedies}
                disclaimer={result.disclaimer}
              />
            </motion.div>

            {/* Reset */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="text-center pt-4"
            >
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-violet/40 text-violet-light text-sm font-semibold hover:bg-violet/10 hover:border-violet/60 transition-all"
              >
                Analyze Another Property
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
