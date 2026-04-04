'use client'

import { motion } from 'framer-motion'
import type { VaastuDiagnosticResult } from '@/types/vaastu'

interface SpatialFindingsProps {
  findings: VaastuDiagnosticResult['spatial_findings']
  plantRecommendations: VaastuDiagnosticResult['plant_recommendations']
}

type FindingStatus = 'favorable' | 'warning' | 'unfavorable' | 'acceptable' | string

function StatusIcon({ status }: { status: FindingStatus }) {
  if (status === 'favorable') {
    return (
      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold">
        ✓
      </span>
    )
  }
  if (status === 'warning') {
    return (
      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-bold">
        ▲
      </span>
    )
  }
  if (status === 'unfavorable') {
    return (
      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-rose/15 border border-rose/30 text-rose text-xs font-bold">
        ✕
      </span>
    )
  }
  // acceptable or any other
  return (
    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-400/15 border border-blue-400/30 text-blue-400 text-xs font-bold">
      ●
    </span>
  )
}

function statusLabelColor(status: FindingStatus): string {
  if (status === 'favorable')  return 'text-green-400'
  if (status === 'warning')    return 'text-yellow-400'
  if (status === 'unfavorable') return 'text-rose'
  return 'text-blue-400'
}

export default function SpatialFindings({ findings, plantRecommendations }: SpatialFindingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-nebula border border-white/5 rounded-xl p-5"
    >
      {/* Header */}
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-5">
        Space Analysis
      </p>

      {/* Findings list */}
      {findings.length === 0 ? (
        <p className="text-muted text-sm italic">No spatial findings available.</p>
      ) : (
        <div className="space-y-3 mb-6">
          {findings.map((finding, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.07 * i }}
              className="flex items-start gap-3 py-3 px-3.5 bg-white/3 border border-white/5 rounded-xl"
            >
              <StatusIcon status={finding.status} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1 flex-wrap">
                  <span className="text-star text-sm font-medium leading-snug">{finding.rule}</span>
                  {finding.zone && (
                    <span className="text-xs text-muted px-1.5 py-0.5 bg-white/5 rounded ml-auto shrink-0">
                      {finding.zone}
                    </span>
                  )}
                </div>
                <p className="text-muted text-xs leading-relaxed mb-1">{finding.description}</p>
                {finding.detail && (
                  <p className="text-muted text-xs leading-relaxed mb-1 opacity-75">{finding.detail}</p>
                )}
                {finding.remedy && (
                  <p className={`text-xs italic leading-relaxed ${statusLabelColor(finding.status)} opacity-80`}>
                    Remedy: {finding.remedy}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Plant Recommendations */}
      {plantRecommendations && plantRecommendations.length > 0 && (
        <>
          <div className="border-t border-white/5 mb-4" />
          <p className="text-violet-light text-xs font-semibold uppercase tracking-wider mb-3">
            Recommended Plants
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plantRecommendations.map((plant, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="flex items-start gap-2.5 p-3 bg-green-500/5 border border-green-500/15 rounded-xl"
              >
                <span className="text-base leading-none mt-0.5">🌿</span>
                <div>
                  <p className="text-star text-sm font-medium leading-snug">{plant.plant}</p>
                  <p className="text-muted text-xs mt-0.5">
                    <span className="text-violet-light">{plant.zone}</span> — {plant.purpose}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
