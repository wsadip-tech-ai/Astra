'use client'

import { motion } from 'framer-motion'
import type { VaastuRemedy } from '@/types/vaastu'

interface RemedyListProps {
  remedies: VaastuRemedy[]
  disclaimer: string
}

const REMEDY_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  non_demolition:   { bg: 'bg-violet/20',       text: 'text-violet-light', label: 'Non-Demolition' },
  yantra:           { bg: 'bg-blue-400/20',      text: 'text-blue-400',     label: 'Yantra' },
  dasha_activation: { bg: 'bg-green-500/20',     text: 'text-green-400',    label: 'Dasha Activation' },
  enhancement:      { bg: 'bg-violet-light/10',  text: 'text-violet-light', label: 'Enhancement' },
}

function getTypeStyle(type: string) {
  return REMEDY_TYPE_STYLES[type] ?? { bg: 'bg-white/10', text: 'text-star', label: type }
}

function groupByZone(remedies: VaastuRemedy[]): Record<string, VaastuRemedy[]> {
  return remedies.reduce<Record<string, VaastuRemedy[]>>((acc, remedy) => {
    const zone = remedy.zone || 'General'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(remedy)
    return acc
  }, {})
}

function formatZoneLabel(zone: string): string {
  // Convert "west" → "West Zone", "west_zone" → "West Zone", already "West Zone" stays
  if (!zone || zone.toLowerCase() === 'general') return 'General'
  const cleaned = zone.replace(/_/g, ' ').replace(/\bzone\b/gi, '').trim()
  const titled = cleaned.replace(/\b\w/g, c => c.toUpperCase())
  return titled.endsWith('Zone') ? titled : `${titled} Zone`
}

export default function RemedyList({ remedies, disclaimer }: RemedyListProps) {
  const grouped = groupByZone(remedies)
  const zones = Object.keys(grouped)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-nebula border border-white/5 rounded-xl p-5"
    >
      {/* Header */}
      <p className="font-display text-star text-lg mb-5">Recommended Remedies</p>

      {zones.length === 0 ? (
        <p className="text-muted text-sm italic">No remedies required at this time.</p>
      ) : (
        <div className="space-y-6 mb-6">
          {zones.map((zone, zoneIdx) => (
            <div key={zone}>
              {/* Zone header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-white/5" />
                <p className="text-violet-light text-xs font-semibold tracking-widest uppercase px-2">
                  {formatZoneLabel(zone)}
                </p>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Remedy cards with stagger */}
              <div className="space-y-2">
                {grouped[zone].map((remedy, cardIdx) => {
                  const typeStyle = getTypeStyle(remedy.type)
                  const globalIdx = zoneIdx * 10 + cardIdx
                  return (
                    <motion.div
                      key={cardIdx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * globalIdx, duration: 0.35 }}
                      className="bg-white/3 border border-white/5 rounded-xl p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-star text-sm leading-snug flex-1">{remedy.remedy}</p>
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                          {typeStyle.label}
                        </span>
                      </div>
                      {remedy.reason && (
                        <p className="text-muted text-xs leading-relaxed">{remedy.reason}</p>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 flex items-start gap-2.5"
        >
          <span className="text-yellow-400 text-sm mt-0.5 shrink-0">⚠</span>
          <p className="text-muted text-xs leading-relaxed">{disclaimer}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
