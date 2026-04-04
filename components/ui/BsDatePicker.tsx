// components/ui/BsDatePicker.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BS_MONTHS,
  bsToAd,
  getBsMonthDays,
  formatAdDate,
  formatAdDateHuman,
  adToBs,
} from '@/lib/bikram-sambat'

interface BsDatePickerProps {
  /** Current AD date value in "YYYY-MM-DD" format */
  value: string
  /** Called with AD date in "YYYY-MM-DD" format */
  onChange: (adDate: string) => void
  /** Input styling variant — "cosmos" uses BirthDetailsForm style, "nebula" uses PartnerForm style */
  variant?: 'cosmos' | 'nebula'
}

const BS_MIN_YEAR = 2000
const BS_MAX_YEAR = 2090

const selectBase = {
  cosmos:
    'bg-cosmos border border-white/10 rounded-lg px-3 py-3 text-star text-sm focus:outline-none focus:border-violet/60 appearance-none cursor-pointer transition-colors duration-200',
  nebula:
    'bg-nebula border border-white/10 rounded-xl px-3 py-3 text-star text-sm focus:outline-none focus:border-violet/50 appearance-none cursor-pointer transition-colors duration-200',
}

const pillBase =
  'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none'
const pillActive = 'bg-violet/20 text-violet-light shadow-[inset_0_0_12px_rgba(124,58,237,0.15)]'
const pillInactive = 'text-muted hover:text-star/80'

export default function BsDatePicker({ value, onChange, variant = 'nebula' }: BsDatePickerProps) {
  const [mode, setMode] = useState<'ad' | 'bs'>('ad')
  const [bsYear, setBsYear] = useState(2047)
  const [bsMonth, setBsMonth] = useState(1)
  const [bsDay, setBsDay] = useState(1)

  const styles = selectBase[variant]

  // Sync BS state when AD value changes externally (e.g. initial load)
  useEffect(() => {
    if (!value || mode === 'bs') return
    const [y, m, d] = value.split('-').map(Number)
    if (!y || !m || !d) return
    const bs = adToBs(y, m, d)
    if (bs) {
      setBsYear(bs.year)
      setBsMonth(bs.month)
      setBsDay(bs.day)
    }
  }, [value, mode])

  const maxDays = useMemo(() => getBsMonthDays(bsYear, bsMonth), [bsYear, bsMonth])

  // Clamp day when month/year changes
  useEffect(() => {
    if (bsDay > maxDays && maxDays > 0) {
      setBsDay(maxDays)
    }
  }, [maxDays, bsDay])

  // Convert and propagate when BS date changes
  const propagateBs = useCallback(
    (y: number, m: number, d: number) => {
      const ad = bsToAd(y, m, d)
      if (ad) {
        onChange(formatAdDate(ad.year, ad.month, ad.day))
      }
    },
    [onChange]
  )

  function handleBsYearChange(y: number) {
    setBsYear(y)
    const clampedDay = Math.min(bsDay, getBsMonthDays(y, bsMonth) || bsDay)
    setBsDay(clampedDay)
    propagateBs(y, bsMonth, clampedDay)
  }

  function handleBsMonthChange(m: number) {
    setBsMonth(m)
    const clampedDay = Math.min(bsDay, getBsMonthDays(bsYear, m) || bsDay)
    setBsDay(clampedDay)
    propagateBs(bsYear, m, clampedDay)
  }

  function handleBsDayChange(d: number) {
    setBsDay(d)
    propagateBs(bsYear, bsMonth, d)
  }

  // Converted AD display
  const convertedAd = useMemo(() => {
    if (mode !== 'bs') return null
    const ad = bsToAd(bsYear, bsMonth, bsDay)
    if (!ad) return null
    return formatAdDateHuman(ad.year, ad.month, ad.day)
  }, [mode, bsYear, bsMonth, bsDay])

  // Year options: descending so recent years appear first
  const yearOptions = useMemo(() => {
    const years: number[] = []
    for (let y = BS_MAX_YEAR; y >= BS_MIN_YEAR; y--) years.push(y)
    return years
  }, [])

  // Day options
  const dayOptions = useMemo(() => {
    const days: number[] = []
    for (let d = 1; d <= maxDays; d++) days.push(d)
    return days
  }, [maxDays])

  return (
    <div className="space-y-2.5">
      {/* Toggle pills */}
      <div className="flex items-center gap-1 bg-nebula/60 border border-white/[0.06] rounded-full p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setMode('ad')}
          className={`${pillBase} ${mode === 'ad' ? pillActive : pillInactive}`}
          aria-pressed={mode === 'ad'}
        >
          AD (English)
        </button>
        <button
          type="button"
          onClick={() => setMode('bs')}
          className={`${pillBase} ${mode === 'bs' ? pillActive : pillInactive}`}
          aria-pressed={mode === 'bs'}
        >
          BS (&#x0928;&#x0947;&#x092A;&#x093E;&#x0932;&#x0940;)
        </button>
      </div>

      {mode === 'ad' ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${styles}`}
        />
      ) : (
        <div className="space-y-2">
          {/* Three dropdowns in a row */}
          <div className="grid grid-cols-[1.2fr_1fr_0.7fr] gap-2">
            {/* Year */}
            <div className="relative">
              <select
                value={bsYear}
                onChange={(e) => handleBsYearChange(Number(e.target.value))}
                className={`w-full ${styles} pr-8`}
                aria-label="BS Year"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="bg-cosmos text-star">
                    {y} BS
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-[10px]">
                &#9662;
              </span>
            </div>

            {/* Month */}
            <div className="relative">
              <select
                value={bsMonth}
                onChange={(e) => handleBsMonthChange(Number(e.target.value))}
                className={`w-full ${styles} pr-8`}
                aria-label="BS Month"
              >
                {BS_MONTHS.map((name, i) => (
                  <option key={name} value={i + 1} className="bg-cosmos text-star">
                    {name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-[10px]">
                &#9662;
              </span>
            </div>

            {/* Day */}
            <div className="relative">
              <select
                value={bsDay}
                onChange={(e) => handleBsDayChange(Number(e.target.value))}
                className={`w-full ${styles} pr-8`}
                aria-label="BS Day"
              >
                {dayOptions.map((d) => (
                  <option key={d} value={d} className="bg-cosmos text-star">
                    {d}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-[10px]">
                &#9662;
              </span>
            </div>
          </div>

          {/* Converted AD date preview */}
          {convertedAd && (
            <p className="text-muted text-xs pl-0.5 flex items-center gap-1.5">
              <span className="inline-block w-3 h-px bg-violet/40" />
              <span>= {convertedAd}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
