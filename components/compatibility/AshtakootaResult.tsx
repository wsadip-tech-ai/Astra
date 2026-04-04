'use client'

import { motion } from 'framer-motion'
import type { KootaScore } from '@/types'

interface AshtakootaResultProps {
  score: number
  maxScore: number
  rating: string
  kootas: KootaScore[]
  partnerName: string
}

function scoreColor(score: number): string {
  if (score >= 25) return 'text-violet-light'
  if (score >= 18) return 'text-yellow-400'
  return 'text-rose'
}

function scoreBorder(score: number): string {
  if (score >= 25) return 'border-violet/50'
  if (score >= 18) return 'border-yellow-400/50'
  return 'border-rose/50'
}

function scoreGlow(score: number): string {
  if (score >= 25) return 'shadow-violet/20'
  if (score >= 18) return 'shadow-yellow-400/20'
  return 'shadow-rose/20'
}

function barColor(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0
  if (pct >= 0.75) return 'bg-violet-light'
  if (pct >= 0.5) return 'bg-yellow-400'
  return 'bg-rose'
}

export default function AshtakootaResult({
  score,
  maxScore,
  rating,
  kootas,
  partnerName,
}: AshtakootaResultProps) {
  return (
    <div className="max-w-lg mx-auto">
      {/* Score hero */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className={`inline-flex items-center justify-center w-36 h-36 rounded-full border-4 ${scoreBorder(score)} shadow-lg ${scoreGlow(score)}`}
        >
          <div>
            <span className={`text-5xl font-display font-bold ${scoreColor(score)}`}>
              {score}
            </span>
            <p className="text-muted text-xs mt-0.5">/ {maxScore}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-star font-display text-xl mt-5">You & {partnerName}</p>
          <p className={`text-sm mt-1 font-medium ${scoreColor(score)}`}>{rating}</p>
          <p className="text-muted text-xs mt-1">Vedic Ashtakoota Score</p>
        </motion.div>
      </div>

      {/* Koota breakdown grid */}
      <div className="mb-8">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-4">
          Eight Koota Breakdown
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {kootas.map((koota, i) => (
            <motion.div
              key={koota.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="bg-nebula border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-star font-medium text-sm">{koota.name}</span>
                <span className={`text-xs font-semibold ${barColor(koota.score, koota.max_score).replace('bg-', 'text-')}`}>
                  {koota.score}/{koota.max_score}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${koota.max_score > 0 ? (koota.score / koota.max_score) * 100 : 0}%` }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.5 }}
                  className={`h-full rounded-full ${barColor(koota.score, koota.max_score)}`}
                />
              </div>
              <p className="text-muted text-xs leading-relaxed">{koota.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
