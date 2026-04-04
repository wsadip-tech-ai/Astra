'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VaastuHitsResponse, VaastuHitResult } from '@/types/vaastu'

interface HitReportProps {
  hits: VaastuHitsResponse
}

const HIT_TYPE_STYLES: Record<VaastuHitResult['type'], { bg: string; text: string; label: string }> = {
  killer:       { bg: 'bg-rose/20',          text: 'text-rose',          label: 'Killer' },
  dangerous:    { bg: 'bg-orange-400/20',     text: 'text-orange-400',    label: 'Dangerous' },
  obstacle:     { bg: 'bg-yellow-400/20',     text: 'text-yellow-400',    label: 'Obstacle' },
  best_support: { bg: 'bg-violet/20',         text: 'text-violet-light',  label: 'Best Support' },
  friend:       { bg: 'bg-green-500/20',      text: 'text-green-400',     label: 'Friend' },
  positive:     { bg: 'bg-blue-400/20',       text: 'text-blue-400',      label: 'Positive' },
}

function HitCard({ hit, index }: { hit: VaastuHitResult; index: number }) {
  const style = HIT_TYPE_STYLES[hit.type]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      className="bg-white/3 border border-white/5 rounded-xl p-3.5"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* Attacker → Victim */}
        <span className="text-star text-sm font-semibold">{hit.attacker}</span>
        <span className="text-muted text-xs">→</span>
        <span className="text-star text-sm font-semibold">{hit.victim}</span>

        {/* Type badge */}
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Angle badge */}
        <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-star font-mono">
          {hit.angle.toFixed(1)}°
        </span>
        {/* Direction */}
        <span className="text-muted text-xs">{hit.direction}</span>
      </div>
    </motion.div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-muted text-sm italic py-2">No {label} planetary influences detected.</p>
  )
}

export default function HitReport({ hits }: HitReportProps) {
  const [showSecondary, setShowSecondary] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-nebula border border-white/5 rounded-xl p-5 space-y-6"
    >
      {/* Header */}
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase">
        Planetary Influences
      </p>

      {/* Primary HITs */}
      <div>
        <p className="text-star text-sm font-medium mb-3 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose" />
          Primary Afflictions
          {hits.primary_hits.length > 0 && (
            <span className="text-xs text-muted ml-auto">{hits.primary_hits.length} found</span>
          )}
        </p>
        {hits.primary_hits.length === 0 ? (
          <EmptyState label="primary" />
        ) : (
          <div className="space-y-2">
            {hits.primary_hits.map((hit, i) => (
              <HitCard key={i} hit={hit} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Positive HITs */}
      <div>
        <p className="text-star text-sm font-medium mb-3 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
          Positive Influences
          {hits.positive_hits.length > 0 && (
            <span className="text-xs text-muted ml-auto">{hits.positive_hits.length} found</span>
          )}
        </p>
        {hits.positive_hits.length === 0 ? (
          <EmptyState label="positive" />
        ) : (
          <div className="space-y-2">
            {hits.positive_hits.map((hit, i) => (
              <HitCard key={i} hit={hit} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Secondary HITs — collapsible */}
      {hits.secondary_hits.length > 0 && (
        <>
          <div className="border-t border-white/5" />
          <div>
            <button
              onClick={() => setShowSecondary(v => !v)}
              className="flex items-center gap-2 text-muted text-xs hover:text-violet-light transition-colors w-full"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted" />
              <span className="font-medium">Secondary Influences</span>
              <span className="ml-auto">({hits.secondary_hits.length})</span>
              <span className="ml-1">{showSecondary ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {showSecondary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-3">
                    {hits.secondary_hits.map((hit, i) => (
                      <HitCard key={i} hit={hit} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Dasha lord note */}
      <p className="text-muted text-xs italic border-t border-white/5 pt-3">
        Analysis based on current Dasha lord: <span className="text-violet-light font-medium">{hits.dasha_lord}</span>
      </p>
    </motion.div>
  )
}
