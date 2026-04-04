'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VaastuZoneStatus } from '@/types/vaastu'

interface CompassGridProps {
  zones: VaastuZoneStatus[]
  onZoneClick?: (zone: VaastuZoneStatus) => void
  selectedZone?: string | null
}

const ZONE_POSITIONS: Record<string, { row: number; col: number }> = {
  N:   { row: 0, col: 2 },
  NNE: { row: 0, col: 3 },
  NE:  { row: 1, col: 4 },
  ENE: { row: 2, col: 4 },
  E:   { row: 2, col: 5 },
  ESE: { row: 3, col: 4 },
  SE:  { row: 4, col: 4 },
  SSE: { row: 5, col: 3 },
  S:   { row: 5, col: 2 },
  SSW: { row: 5, col: 1 },
  SW:  { row: 4, col: 0 },
  WSW: { row: 3, col: 0 },
  W:   { row: 2, col: -1 },
  WNW: { row: 2, col: 0 },
  NW:  { row: 1, col: 0 },
  NNW: { row: 0, col: 1 },
}

/* Clockwise order for stagger animation */
const CLOCKWISE_ORDER = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
]

const CARDINALS = new Set(['N', 'E', 'S', 'W'])

const STATUS_STYLES: Record<string, { bg: string; border: string; glow: string }> = {
  clear:    { bg: 'bg-white/5',        border: 'border-white/10',      glow: 'hover:border-white/25' },
  afflicted:{ bg: 'bg-rose/20',        border: 'border-rose/40',       glow: 'hover:border-rose/60' },
  warning:  { bg: 'bg-yellow-400/15',  border: 'border-yellow-400/30', glow: 'hover:border-yellow-400/50' },
  positive: { bg: 'bg-violet/20',      border: 'border-violet/40',     glow: 'hover:border-violet/60' },
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  clear:     { label: 'Clear',     color: 'bg-white/10 text-white/70' },
  afflicted: { label: 'Afflicted', color: 'bg-rose/25 text-rose-light' },
  warning:   { label: 'Warning',   color: 'bg-yellow-400/20 text-yellow-300' },
  positive:  { label: 'Positive',  color: 'bg-violet/25 text-violet-light' },
}

export default function CompassGrid({ zones, onZoneClick, selectedZone }: CompassGridProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null)
  const activeZone = selectedZone !== undefined ? selectedZone : internalSelected

  const zoneMap = new Map(zones.map((z) => [z.zone, z]))

  function handleClick(zone: VaastuZoneStatus) {
    if (selectedZone === undefined) {
      setInternalSelected((prev) => (prev === zone.zone ? null : zone.zone))
    }
    onZoneClick?.(zone)
  }

  const selectedData = activeZone ? zoneMap.get(activeZone) : null

  return (
    <div className="flex flex-col items-center gap-8">
      {/* ── Compass Grid ── */}
      <div className="relative">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
            width: 'fit-content',
          }}
        >
          {CLOCKWISE_ORDER.map((dir, i) => {
            const zone = zoneMap.get(dir)
            if (!zone) return null
            const pos = ZONE_POSITIONS[dir]
            const styles = STATUS_STYLES[zone.status] ?? STATUS_STYLES.clear
            const isCardinal = CARDINALS.has(dir)
            const isSelected = activeZone === dir
            const clockIdx = CLOCKWISE_ORDER.indexOf(dir)

            return (
              <motion.button
                key={dir}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: clockIdx * 0.06,
                  duration: 0.35,
                  ease: [0.23, 1, 0.32, 1],
                }}
                onClick={() => handleClick(zone)}
                className={[
                  'relative flex flex-col items-center justify-center rounded-lg border cursor-pointer',
                  'transition-all duration-200',
                  styles.bg,
                  styles.border,
                  styles.glow,
                  isCardinal ? 'w-[72px] h-[72px]' : 'w-[62px] h-[62px]',
                  isSelected ? 'ring-2 ring-violet shadow-[0_0_12px_rgba(124,58,237,0.4)]' : '',
                  'hover:scale-105',
                  zone.status === 'afflicted' ? 'animate-pulse-subtle' : '',
                ].join(' ')}
                style={{
                  gridRow: pos.row + 1,
                  gridColumn: pos.col + 2,
                }}
              >
                <span
                  className={[
                    'font-display leading-none',
                    isCardinal ? 'text-sm font-bold text-star' : 'text-xs font-semibold text-star/80',
                  ].join(' ')}
                >
                  {dir}
                </span>
                {zone.planet && (
                  <span className="text-[10px] text-muted mt-0.5 leading-none truncate max-w-full px-1">
                    {zone.planet}
                  </span>
                )}
              </motion.button>
            )
          })}

          {/* ── Brahmasthan Center ── */}
          <div
            className="flex items-center justify-center"
            style={{
              gridRow: '3 / 5',
              gridColumn: '3 / 5',
            }}
          >
            <div className="w-20 h-20 rounded-full border border-dashed border-white/15 flex items-center justify-center">
              <span className="text-[11px] text-muted font-body tracking-wide">
                Brahmasthan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <AnimatePresence mode="wait">
        {selectedData && (
          <motion.div
            key={selectedData.zone}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-md bg-nebula border border-white/5 rounded-xl p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-star">
                {selectedData.zone}
              </h3>
              <span
                className={[
                  'text-[11px] px-2 py-0.5 rounded-full font-body',
                  STATUS_BADGE[selectedData.status]?.color ?? '',
                ].join(' ')}
              >
                {STATUS_BADGE[selectedData.status]?.label ?? selectedData.status}
              </span>
            </div>

            {/* Planet & Element row */}
            {selectedData.planet && (
              <p className="text-xs text-muted">
                <span className="text-violet-light">Ruling planet:</span>{' '}
                {selectedData.planet}
              </p>
            )}

            {/* Devtas */}
            {selectedData.devtas.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] text-muted uppercase tracking-wider">
                  Devtas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedData.devtas.map((d) => (
                    <span
                      key={d.name}
                      className="text-[11px] bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-star/70"
                      title={d.domain}
                    >
                      {d.name}
                      <span className="text-muted ml-1">({d.domain})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Affliction / warning details */}
            {(selectedData.status === 'afflicted' || selectedData.status === 'warning') &&
              selectedData.hit_type && (
                <div className="mt-1 bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <p className="text-xs text-rose-light">
                    <span className="font-semibold">Hit type:</span>{' '}
                    {selectedData.hit_type}
                  </p>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
