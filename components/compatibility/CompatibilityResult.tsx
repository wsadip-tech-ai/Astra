'use client'

import Link from 'next/link'
import type { CrossAspect } from '@/types'

interface CompatibilityResultProps {
  score: number
  aspects: CrossAspect[]
  summary: string
  report: string | null
  partnerName: string
  isPremium: boolean
  onReset?: () => void
}

const ASPECT_COLORS: Record<string, string> = {
  conjunction: 'text-violet-light',
  trine: 'text-violet-light',
  sextile: 'text-violet-light',
  square: 'text-rose',
  opposition: 'text-rose',
}

function scoreColor(score: number): string {
  if (score >= 71) return 'text-violet-light'
  if (score >= 41) return 'text-yellow-400'
  return 'text-rose'
}

function scoreBorder(score: number): string {
  if (score >= 71) return 'border-violet/50'
  if (score >= 41) return 'border-yellow-400/50'
  return 'border-rose/50'
}

export default function CompatibilityResult({
  score, aspects, summary, report, partnerName, isPremium, onReset,
}: CompatibilityResultProps) {
  const visibleAspects = isPremium ? aspects : aspects.slice(0, 5)

  return (
    <div className="max-w-lg mx-auto">
      {/* Score circle */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${scoreBorder(score)}`}>
          <div>
            <span className={`text-4xl font-display font-bold ${scoreColor(score)}`}>{score}</span>
            <p className="text-muted text-xs">/100</p>
          </div>
        </div>
        <p className="text-star font-display text-xl mt-4">You & {partnerName}</p>
        <p className="text-muted text-sm mt-1">{summary}</p>
      </div>

      {/* Aspects list */}
      <div className="space-y-2 mb-6">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Cross-Aspects</p>
        {visibleAspects.map((a, i) => {
          const typeName = a.type.charAt(0).toUpperCase() + a.type.slice(1)
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-nebula border border-white/5 rounded-xl">
              <span className="text-star text-sm font-medium">{a.planet1}</span>
              <span className={`text-sm ${ASPECT_COLORS[a.type] ?? 'text-muted'}`}>{typeName}</span>
              <span className="text-star text-sm font-medium">{a.planet2}</span>
              <span className="text-muted text-xs ml-auto">{a.orb}°</span>
            </div>
          )
        })}
      </div>

      {/* Premium gate or report */}
      {!isPremium && aspects.length > 5 && (
        <div className="bg-violet/10 border border-violet/30 rounded-xl p-5 text-center mb-6">
          <p className="text-star text-sm font-medium mb-1">Unlock Full Report</p>
          <p className="text-muted text-xs mb-4">
            See all {aspects.length} cross-aspects and get Astra's detailed compatibility reading.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-gradient-to-r from-violet to-rose text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:shadow-lg hover:shadow-violet/30 transition-all"
          >
            Upgrade to Premium
          </Link>
        </div>
      )}

      {isPremium && report && (
        <div className="bg-nebula border border-violet/20 rounded-2xl p-6 mb-6">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Astra's Reading</p>
          <p className="text-star text-sm leading-relaxed">{report}</p>
        </div>
      )}

      {/* Try another */}
      {onReset && (
        <div className="text-center">
          <button
            onClick={onReset}
            className="text-violet-light text-sm hover:text-violet transition-colors"
          >
            ← Try another partner
          </button>
        </div>
      )}
    </div>
  )
}
