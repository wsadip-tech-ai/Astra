'use client'

import { motion } from 'framer-motion'
import type { AayadiResult } from '@/types/vaastu'

interface AayadiCardProps {
  aayadi: AayadiResult
}

function harmonyColor(harmony: AayadiResult['overall_harmony']) {
  if (harmony === 'favorable') return { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' }
  if (harmony === 'neutral') return { text: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30' }
  return { text: 'text-rose', bg: 'bg-rose/20', border: 'border-rose/30' }
}

function harmonyLabel(harmony: AayadiResult['overall_harmony']) {
  if (harmony === 'favorable') return 'Favorable'
  if (harmony === 'neutral') return 'Neutral'
  return 'Unfavorable'
}

export default function AayadiCard({ aayadi }: AayadiCardProps) {
  const { aaya, vyaya, aaya_greater, yoni, footprint_effects, overall_harmony, description } = aayadi
  const harmony = harmonyColor(overall_harmony)
  const cardBorder = aaya_greater ? 'border-green-500/20' : 'border-rose/20'
  const total = aaya + vyaya
  const aayaPct = total > 0 ? Math.round((aaya / total) * 100) : 50
  const vyayaPct = 100 - aayaPct

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`bg-nebula border ${cardBorder} rounded-xl p-5`}
    >
      {/* Header */}
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-5">
        Dimensional Harmony
      </p>

      {/* Aaya vs Vyaya bars */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-star text-sm font-medium">Aaya (Income)</span>
          <span className={`text-sm font-bold ${aaya_greater ? 'text-green-400' : 'text-muted'}`}>{aaya}</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${aayaPct}%` }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={`h-full rounded-full ${aaya_greater ? 'bg-green-500' : 'bg-rose'}`}
          />
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-star text-sm font-medium">Vyaya (Expenditure)</span>
          <span className={`text-sm font-bold ${!aaya_greater ? 'text-rose' : 'text-muted'}`}>{vyaya}</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${vyayaPct}%` }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className={`h-full rounded-full ${!aaya_greater ? 'bg-rose' : 'bg-violet'}`}
          />
        </div>

        {/* Balance indicator */}
        <p className="text-muted text-xs mt-2">
          {aaya_greater
            ? `Income exceeds expenditure by ${aaya - vyaya} — prosperity energy`
            : `Expenditure exceeds income by ${vyaya - aaya} — remediation recommended`}
        </p>
      </div>

      {/* Yoni section */}
      <div className="bg-white/3 border border-white/5 rounded-lg p-3.5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-violet-light text-xs font-semibold uppercase tracking-wider">Yoni</span>
          <span className="text-star text-sm font-medium">{yoni.type}</span>
          <span className="text-muted text-xs ml-auto">Value: {yoni.value}</span>
        </div>
        <p className="text-muted text-xs leading-relaxed">{yoni.interpretation}</p>
      </div>

      {/* Footprint effects */}
      {footprint_effects.length > 0 && (
        <div className="mb-4">
          <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">Footprint Effects</p>
          <div className="flex flex-wrap gap-1.5">
            {footprint_effects.map((fp, i) => {
              const isAuspicious = fp.effect.toLowerCase().includes('auspi') ||
                fp.effect.toLowerCase().includes('good') ||
                fp.effect.toLowerCase().includes('positive') ||
                fp.effect.toLowerCase().includes('prosper')
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                    isAuspicious
                      ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                      : 'bg-rose/15 text-rose-light border border-rose/20'
                  }`}
                >
                  <span className="opacity-70">{fp.dimension}:</span>
                  <span>{fp.effect}</span>
                </motion.span>
              )
            })}
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-muted text-xs leading-relaxed mb-4">{description}</p>

      {/* Overall harmony badge */}
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs">Overall Harmony</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${harmony.bg} ${harmony.text} ${harmony.border}`}>
          {harmonyLabel(overall_harmony)}
        </span>
      </div>
    </motion.div>
  )
}
