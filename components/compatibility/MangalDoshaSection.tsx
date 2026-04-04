'use client'

import { motion } from 'framer-motion'
import type { DoshaInfo } from '@/types'

interface MangalDoshaSectionProps {
  doshas: DoshaInfo[]
  mangalUser: boolean
  mangalPartner: boolean
  partnerName: string
}

export default function MangalDoshaSection({
  doshas,
  mangalUser,
  mangalPartner,
  partnerName,
}: MangalDoshaSectionProps) {
  const hasMangal = mangalUser || mangalPartner
  const isMutualCancel = mangalUser && mangalPartner

  if (!hasMangal && doshas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-lg mx-auto mb-8"
      >
        <div className="bg-nebula border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="text-star text-sm">No Mangal Dosha detected for either partner</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="max-w-lg mx-auto mb-8"
    >
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">
        Mangal Dosha Assessment
      </p>

      <div className="bg-nebula border border-white/5 rounded-xl p-5 space-y-4">
        {/* Status indicators */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${mangalUser ? 'bg-rose' : 'bg-emerald-400'}`} />
            <span className="text-star text-sm">You</span>
            <span className={`text-xs ${mangalUser ? 'text-rose' : 'text-emerald-400'}`}>
              {mangalUser ? 'Present' : 'Absent'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${mangalPartner ? 'bg-rose' : 'bg-emerald-400'}`} />
            <span className="text-star text-sm">{partnerName}</span>
            <span className={`text-xs ${mangalPartner ? 'text-rose' : 'text-emerald-400'}`}>
              {mangalPartner ? 'Present' : 'Absent'}
            </span>
          </div>
        </div>

        {/* Mutual cancellation badge */}
        {isMutualCancel && (
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-400 text-xs font-medium">Mutual cancellation applies</span>
          </div>
        )}

        {/* Dosha details */}
        {doshas.map((dosha, i) => (
          <div key={i} className="border-t border-white/5 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-star text-sm font-medium">{dosha.type}</span>
              {dosha.canceled && (
                <span className="text-emerald-400 text-xs">Canceled</span>
              )}
            </div>
            <p className="text-muted text-xs">
              <span className="text-violet-light">Severity:</span> {dosha.severity}
            </p>
            {dosha.remedy && (
              <div className="bg-void/50 rounded-lg p-3">
                <p className="text-muted text-xs">
                  <span className="text-violet-light">Remedy:</span> {dosha.remedy}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
