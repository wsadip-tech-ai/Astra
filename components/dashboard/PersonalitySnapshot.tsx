'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

/* ── Types ──────────────────────────────────────────────────────────── */

interface PersonalityData {
  personality: {
    core_nature: string
    emotional_nature: string
    outer_expression: string
    strengths: string[]
    challenges: string[]
  }
  career: {
    direction: string
    strengths?: string
    wealth_potential?: string
  }
  family?: {
    spouse?: string
  }
  health?: {
    constitution?: string
  }
  spiritual?: {
    path?: string
    past_life_karma?: string
    dharma?: string
  }
  life_themes: string[]
}

/* ── House meanings for humanisation ────────────────────────────────── */

const HOUSE_MEANINGS: Record<string, string> = {
  '1st': 'identity and self-expression',
  '2nd': 'finances and family values',
  '3rd': 'communication and courage',
  '4th': 'home and emotional security',
  '5th': 'creativity and intelligence',
  '6th': 'health and daily routines',
  '7th': 'relationships and partnerships',
  '8th': 'transformation and hidden depths',
  '9th': 'wisdom and spiritual growth',
  '10th': 'career and public reputation',
  '11th': 'financial gains and social network',
  '12th': 'spiritual liberation and inner life',
}

const PLANET_QUALITIES: Record<string, string> = {
  Sun: 'vitality and authority',
  Moon: 'emotions and intuition',
  Mars: 'drive and ambition',
  Mercury: 'intellect and communication',
  Jupiter: 'wisdom and expansion',
  Venus: 'love and harmony',
  Saturn: 'discipline and persistence',
  Rahu: 'intense desire and unconventional energy',
  Ketu: 'spiritual detachment and past-life wisdom',
}

/** Convert "Mars in 10th house" to "Strong drive and ambition in career" */
function humanizeStrength(raw: string): string {
  // Yogas are already meaningful — keep them
  if (/yoga/i.test(raw)) return raw

  // Extract planet name and house number from various formats:
  // "Sun strong in house 9 (trikona)"
  // "Sun in 9th house"
  // "Jupiter in dusthana house 8"
  // "Mars exalted in 10th house"
  let planet = ''
  let houseNum = 0

  // Pattern 1: "Planet strong/exalted in house N"
  const match1 = raw.match(/^(\w+)\s+(?:strong|exalted|placed)?\s*in\s+(?:dusthana\s+)?house\s+(\d+)/i)
  // Pattern 2: "Planet in Nth house"
  const match2 = raw.match(/^(\w+)\s+(?:strong\s+)?in\s+(\d+)(?:st|nd|rd|th)\s+house/i)

  if (match1) {
    planet = match1[1]
    houseNum = Number(match1[2])
  } else if (match2) {
    planet = match2[1]
    houseNum = Number(match2[2])
  }

  if (planet && houseNum >= 1 && houseNum <= 12) {
    const houseKey = `${houseNum}${ordinalSuffix(houseNum)}`
    const planetMeaning = PLANET_QUALITIES[planet]
    const houseMeaning = HOUSE_MEANINGS[houseKey]

    const isExalted = /exalted/i.test(raw)
    const isDusthana = /dusthana/i.test(raw)

    if (isDusthana && houseMeaning) {
      return `${planetMeaning || planet} challenged in ${houseMeaning}`
    }
    if (isExalted && houseMeaning) {
      return `Exceptional ${planetMeaning || `${planet} power`} in ${houseMeaning}`
    }
    if (planetMeaning && houseMeaning) {
      return `Strong ${planetMeaning} in ${houseMeaning}`
    }
    if (houseMeaning) {
      return `${planet} energy focused on ${houseMeaning}`
    }
  }

  return raw
}

function ordinalSuffix(n: number): string {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

/* ── Yoga descriptions ──────────────────────────────────────────────── */

const YOGA_DESCRIPTIONS: Record<string, string> = {
  Budhaditya: 'Gifted intellect and powerful communication',
  'Gajakesari': 'Wisdom, fame, and lasting success',
  'Dhana': 'Strong wealth potential and financial prosperity',
  'Raja': 'Authority, power, and high social standing',
  'Hamsa': 'Spiritual wisdom and noble character',
  'Malavya': 'Artistic talent, luxury, and romantic magnetism',
  'Ruchaka': 'Courage, physical strength, and leadership',
  'Bhadra': 'Sharp intellect and business acumen',
  'Sasa': 'Discipline, authority, and practical wisdom',
  'Viparita': 'Sudden gains through overcoming adversity',
  'Chandra-Mangal': 'Financial courage and emotional drive',
  'Adhi': 'Protection, support, and influential allies',
}

function getYogaDescription(yogaName: string): string {
  for (const [key, desc] of Object.entries(YOGA_DESCRIPTIONS)) {
    if (yogaName.toLowerCase().includes(key.toLowerCase())) return desc
  }
  return 'A beneficial planetary combination in your chart'
}

/* ── Extract insights from API text ─────────────────────────────────── */

interface InsightResult {
  icon: 'flame' | 'scale' | 'book'
  label: string
  text: string
}

// Map core traits to punchy one-liners
const TRAIT_PUNCHLINES: Record<string, string> = {
  'dynamic': 'Born to lead — fearless, dynamic, and unstoppable',
  'courageous': 'Born to lead — courage flows through everything you do',
  'practical': 'Built for results — grounded, steady, and reliable as stone',
  'intellectual': 'A brilliant mind — sharp, curious, and always two steps ahead',
  'emotional': 'Deep feeler — your intuition is your greatest gift',
  'diplomatic': 'The peacemaker — you bring balance wherever you go',
  'intense': 'Magnetic and intense — you transform everything you touch',
  'philosophical': 'A seeker of truth — wisdom is your north star',
  'ambitious': 'Climbing to the top — discipline and ambition are your tools',
  'innovative': 'A visionary mind — you see possibilities others miss',
  'compassionate': 'Heart of gold — your compassion heals those around you',
  'action-oriented': 'Born to lead — you make things happen, fast',
  'stability-seeking': 'Your rock-solid nature makes others feel safe',
  'socially aware': 'People person — you read the room like no one else',
}

// Map Moon sign qualities to emotional punchlines
const EMOTIONAL_PUNCHLINES: Record<string, string> = {
  'charm': 'Charm is your superpower — people are drawn to your warmth',
  'diplomacy': 'You seek harmony in all things — peace follows where you go',
  'emotional impulsiveness': 'You feel first, think later — and that passion is your fire',
  'emotional stability': 'An emotional anchor — calm, steady, and deeply content',
  'nurturing': 'Your heart nurtures everyone it touches — love is your language',
  'analytical': 'Your feelings run through logic — you understand emotions, not just feel them',
  'optimistic': 'An eternal optimist — your positivity is contagious',
  'reserve': 'Still waters run deep — your emotions mature like fine wine',
  'detached': 'You observe life from above — clarity comes from emotional freedom',
  'sensitivity': 'You feel the world deeply — your empathy is extraordinary',
}

// Map career fields to punchy career statements
const CAREER_PUNCHLINES: Record<string, string> = {
  'business': 'Business and finance are your kingdoms',
  'finance': 'Money moves toward you — financial mastery is in your stars',
  'leadership': 'You were made to lead — authority comes naturally',
  'communication': 'Words are your weapon — communication opens every door',
  'teaching': 'A born teacher — sharing knowledge multiplies your power',
  'healing': 'Healing hands — your purpose is to restore and nurture',
  'arts': 'Creative genius — art and beauty flow through you',
  'technology': 'Tech-minded innovator — the future is your playground',
  'law': 'Justice is your calling — fairness and truth drive you',
  'administration': 'Master organiser — systems and structures bend to your will',
  'agriculture': 'Connected to the earth — growth is your natural talent',
  'real estate': 'Property and land bring you wealth — build your empire',
}

function buildPunchyInsights(data: {
  personality: { core_nature: string; emotional_nature: string; outer_expression: string; strengths: string[] }
  career?: { direction: string }
}): InsightResult[] {
  const insights: InsightResult[] = []

  // 1. Core identity — find the best matching punchline
  const core = data.personality.core_nature.toLowerCase()
  if (core) {
    let bestPunch = ''
    for (const [trait, punch] of Object.entries(TRAIT_PUNCHLINES)) {
      if (core.includes(trait)) { bestPunch = punch; break }
    }
    if (!bestPunch) {
      // Fallback: extract trait words and build a generic punchy line
      const traitMatch = data.personality.core_nature.match(/fundamentally\s+([^.]+)/i)
      if (traitMatch) {
        const traits = traitMatch[1].replace(/and /g, '').split(',').map(t => t.trim()).filter(t => t.length > 2).slice(0, 2)
        bestPunch = `${traits[0].charAt(0).toUpperCase() + traits[0].slice(1)} and ${traits[1] || 'powerful'} — that's your essence`
      }
    }
    if (bestPunch) insights.push({ icon: 'flame', label: 'Your Core', text: bestPunch })
  }

  // 2. Emotional nature — find matching emotional punchline
  const emotional = data.personality.emotional_nature.toLowerCase()
  if (emotional) {
    let bestPunch = ''
    for (const [quality, punch] of Object.entries(EMOTIONAL_PUNCHLINES)) {
      if (emotional.includes(quality)) { bestPunch = punch; break }
    }
    if (!bestPunch) {
      const moonMatch = data.personality.emotional_nature.match(/Moon in (\w+) (?:confers|gives|creates|brings)\s+([^.]+)/i)
      if (moonMatch) {
        const firstQuality = moonMatch[2].split(',')[0].trim()
        bestPunch = `${firstQuality.charAt(0).toUpperCase() + firstQuality.slice(1)} — that's your emotional signature`
      }
    }
    if (bestPunch) insights.push({ icon: 'scale', label: 'Your Heart', text: bestPunch })
  }

  // 3. Career — find matching career punchline and add the network/gains info
  const career = data.career?.direction || ''
  if (career) {
    let bestPunch = ''
    const careerLower = career.toLowerCase()
    for (const [field, punch] of Object.entries(CAREER_PUNCHLINES)) {
      if (careerLower.includes(field)) { bestPunch = punch; break }
    }
    // Add gains/network info if available
    const lordMatch = career.match(/Lord of 10th in \d+th\s*[—–-]\s*([^;.]+)/i)
    if (lordMatch) {
      const extra = lordMatch[1].trim()
      if (bestPunch) {
        bestPunch += ` — ${extra}`
      } else {
        bestPunch = `${extra.charAt(0).toUpperCase() + extra.slice(1)}`
      }
    }
    if (!bestPunch) {
      const careerMatch = career.match(/inclining the native toward\s+([^.]+)/i)
      if (careerMatch) {
        const fields = careerMatch[1].split(',').slice(0, 2).map(f => f.trim()).join(' and ')
        bestPunch = `${fields.charAt(0).toUpperCase() + fields.slice(1)} — this is where you shine`
      }
    }
    if (bestPunch) insights.push({ icon: 'book', label: 'Your Path', text: bestPunch })
  }

  // Fallback: if we got fewer than 2 insights, add outer expression
  if (insights.length < 2 && data.personality.outer_expression) {
    const outer = data.personality.outer_expression.split(':').pop()?.split('.')[0]?.trim()
    if (outer && outer.length > 20) {
      insights.push({ icon: 'book', label: 'Your Expression', text: outer })
    }
  }

  return insights.slice(0, 3)
}

/* ── Inline SVG icons (no dependency needed) ────────────────────────── */

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  )
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

/* ── Stagger animation helpers ──────────────────────────────────────── */

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

/* ── Explore-more links ─────────────────────────────────────────────── */

const EXPLORE_LINKS = [
  {
    label: "What's my career path?",
    href: '/chart',
    Icon: BriefcaseIcon,
  },
  {
    label: 'My relationships',
    href: '/chat?prompt=Tell%20me%20about%20my%20relationships%20based%20on%20my%20chart',
    Icon: HeartIcon,
  },
  {
    label: 'Health insights',
    href: '/chat?prompt=What%20does%20my%20chart%20say%20about%20my%20health',
    Icon: ActivityIcon,
  },
  {
    label: 'Spiritual journey',
    href: '/chart',
    Icon: CompassIcon,
  },
]

/* ── Component ──────────────────────────────────────────────────────── */

export default function PersonalitySnapshot() {
  const [data, setData] = useState<PersonalityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/personality')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  // Graceful absence
  if (!loading && !data) return null

  // Skeleton
  if (loading) {
    return (
      <div className="mb-8">
        <div className="bg-cosmos border border-white/10 rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-48 bg-white/5 rounded mb-6" />
          <div className="space-y-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 bg-white/5 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full bg-white/5 rounded" />
                  <div className="h-3 w-2/3 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 flex-1 bg-white/5 rounded-xl" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-28 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Derive display data ─────────────────────────────────── */

  const { personality, career, life_themes } = data!

  // Section 1: Top 3 punchy insights — human-readable, no jargon
  const insights = buildPunchyInsights(data!)

  // Section 2: Extract yogas from strengths
  const yogas = personality.strengths.filter((s) => /yoga/i.test(s))
  const nonYogaStrengths = personality.strengths.filter(
    (s) => !/yoga/i.test(s),
  )

  // Section 3: Humanised strengths and challenges
  const humanStrengths = nonYogaStrengths.slice(0, 4).map((s) => ({
    raw: s,
    human: humanizeStrength(s),
  }))
  const humanChallenges = personality.challenges.slice(0, 3).map((c) => ({
    raw: c,
    human: humanizeStrength(c),
  }))

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mb-8"
    >
      <div className="relative overflow-hidden rounded-2xl border border-violet/20 bg-gradient-to-br from-cosmos via-cosmos to-nebula/40">
        {/* Decorative gradient orbs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <motion.div
            variants={fadeUp}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-violet-light" />
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-light">
                Your Cosmic Blueprint
              </p>
            </div>
            <Link
              href="/chart"
              className="group flex cursor-pointer items-center gap-1 text-xs text-violet-light transition-colors duration-200 hover:text-violet"
            >
              Full Profile
              <ChevronRightIcon className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* ── Section 1: "What the Stars Say" — visually striking ── */}
          {insights.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted">
                What the Stars Say About You
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {insights.map((insight, i) => {
                  const styles = [
                    { gradient: 'from-orange-500/15 via-rose/10 to-transparent', border: 'border-orange-500/25', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400', glow: 'shadow-orange-500/10' },
                    { gradient: 'from-violet/15 via-indigo-500/10 to-transparent', border: 'border-violet/25', iconBg: 'bg-violet/20', iconColor: 'text-violet-light', glow: 'shadow-violet/10' },
                    { gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent', border: 'border-emerald-500/25', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
                  ]
                  const s = styles[i] ?? styles[0]
                  const iconMap = { flame: FlameIcon, scale: ScaleIcon, book: BookIcon }
                  const Icon = iconMap[insight.icon] ?? FlameIcon

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={`group relative overflow-hidden rounded-xl border ${s.border} bg-gradient-to-br ${s.gradient} p-4 shadow-lg ${s.glow} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-default`}
                    >
                      {/* Decorative glow orb */}
                      <div className={`pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-40 ${s.iconBg}`} />

                      {/* Icon */}
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} shadow-inner`}>
                        <Icon className={`h-5 w-5 ${s.iconColor}`} />
                      </div>

                      {/* Label */}
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${s.iconColor} mb-1.5`}>
                        {insight.label}
                      </p>

                      {/* Punchy text */}
                      <p className="font-display text-[15px] leading-snug text-star">
                        {insight.text}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Section 2: Active Yogas ──────────────────────── */}
          {yogas.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Active Yogas
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {yogas.map((yoga) => {
                  // Extract yoga name: "Budhaditya Yoga active" → "Budhaditya Yoga"
                  const yogaName =
                    yoga
                      .match(/(\w+\s*Yoga)/i)?.[1]
                      ?.trim() ?? yoga
                  const desc = getYogaDescription(yogaName)
                  return (
                    <div
                      key={yoga}
                      className="group relative overflow-hidden rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] p-4 transition-colors duration-200 hover:bg-yellow-500/[0.1]"
                    >
                      {/* Subtle golden glow */}
                      <div
                        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)',
                        }}
                      />
                      <div className="relative flex items-start gap-3">
                        <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-200">
                            {yogaName}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-yellow-200/60">
                            {desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Section 3: Strengths & Watch Areas — 2-column visual layout ── */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Strengths column */}
              {humanStrengths.length > 0 && (
                <div className="rounded-xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                      <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                      Your Strengths
                    </p>
                  </div>
                  <div className="space-y-2">
                    {humanStrengths.map(({ raw, human }, i) => (
                      <motion.div
                        key={raw}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
                        className="flex items-start gap-2.5 group"
                        title={raw}
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                        <p className="text-[13px] leading-snug text-star/85 group-hover:text-star transition-colors">
                          {human}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Watch Areas column */}
              {humanChallenges.length > 0 && (
                <div className="rounded-xl border border-amber-500/10 bg-gradient-to-b from-amber-500/[0.06] to-transparent p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
                      <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                      Areas to Watch
                    </p>
                  </div>
                  <div className="space-y-2">
                    {humanChallenges.map(({ raw, human }, i) => (
                      <motion.div
                        key={raw}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                        className="flex items-start gap-2.5 group"
                        title={raw}
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                        <p className="text-[13px] leading-snug text-star/85 group-hover:text-star transition-colors">
                          {human}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Life Themes — visual cards with icons ────────── */}
          {life_themes.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Dominant Life Themes
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {life_themes.slice(0, 4).map((theme, i) => {
                  // Parse theme to extract readable title and detail
                  // Themes look like: "Strong focus on partnerships and marriage (3 planets in house 7)"
                  // or "Budhaditya Yoga: description..."
                  // or "Current Mercury mahadasha period emphasizes..."
                  const isYoga = /yoga/i.test(theme)
                  const isDasha = /mahadasha|dasha/i.test(theme)
                  const focusMatch = theme.match(/Strong focus on\s+([^(]+)/i)
                  const yogaMatch = theme.match(/^(\w+\s+Yoga)[:\s]+(.+)/i)
                  const dashaMatch = theme.match(/Current\s+(\w+)\s+mahadasha.*?emphasizes?\s+(.+)/i)

                  // House-specific life interpretations — what it means for YOU
                  const HOUSE_LIFE_MEANINGS: Record<string, { title: string; meaning: string; icon: 'star' | 'sparkle' | 'orbit' | 'compass' }> = {
                    '1': { title: 'Self & Identity', meaning: 'Your personality is magnetic — people notice you the moment you walk in', icon: 'star' },
                    '2': { title: 'Wealth & Family', meaning: 'Money flows toward you naturally — family is your foundation of strength', icon: 'compass' },
                    '3': { title: 'Communication', meaning: 'Your words carry power — writing, speaking, or creating opens doors for you', icon: 'compass' },
                    '4': { title: 'Home & Emotions', meaning: 'Home is your sanctuary — deep emotional bonds and property gains define this area', icon: 'star' },
                    '5': { title: 'Creativity & Romance', meaning: 'Creative brilliance runs through you — romance and children bring joy', icon: 'sparkle' },
                    '6': { title: 'Health & Service', meaning: 'You overcome obstacles with persistence — health and daily discipline are your tools', icon: 'orbit' },
                    '7': { title: 'Love & Partnerships', meaning: 'Relationships are central to your journey — partners shape your growth profoundly', icon: 'star' },
                    '8': { title: 'Transformation', meaning: 'You transform through crises — hidden resources and deep research empower you', icon: 'orbit' },
                    '9': { title: 'Wisdom & Fortune', meaning: 'Luck favours you — travel, philosophy, and higher learning expand your world', icon: 'compass' },
                    '10': { title: 'Career & Legacy', meaning: 'You are destined for public recognition — career achievements define your legacy', icon: 'star' },
                    '11': { title: 'Gains & Network', meaning: 'Your network is your net worth — friends and communities amplify your success', icon: 'compass' },
                    '12': { title: 'Spirituality & Liberation', meaning: 'Your inner world is vast — spiritual practices and foreign lands call to you', icon: 'sparkle' },
                  }

                  let title = ''
                  let detail = ''
                  let iconType: 'star' | 'sparkle' | 'orbit' | 'compass' = 'star'

                  if (focusMatch) {
                    const rawTitle = focusMatch[1].trim()
                    const countMatch = theme.match(/\((\d+) planets? in house (\d+)\)/)
                    if (countMatch) {
                      const houseNum = countMatch[2]
                      const houseMeaning = HOUSE_LIFE_MEANINGS[houseNum]
                      if (houseMeaning) {
                        title = houseMeaning.title
                        detail = houseMeaning.meaning
                        iconType = houseMeaning.icon
                      } else {
                        title = rawTitle
                        detail = `${countMatch[1]} planets concentrated here — a powerful life focus`
                        iconType = 'star'
                      }
                    } else {
                      title = rawTitle
                      detail = 'A significant area of focus in your chart'
                      iconType = i === 0 ? 'star' : 'compass'
                    }
                  } else if (yogaMatch) {
                    title = yogaMatch[1]
                    // Extract the meaningful part after the dash
                    const yogaDesc = yogaMatch[2].replace(/^.*?—\s*/, '').split('.')[0]?.trim()
                    detail = yogaDesc || yogaMatch[2].split('.')[0]?.trim() || ''
                    iconType = 'sparkle'
                  } else if (dashaMatch) {
                    const planet = dashaMatch[1]
                    const DASHA_MEANINGS: Record<string, string> = {
                      Sun: 'A period of confidence and authority — step into leadership',
                      Moon: 'Emotional depth and intuition guide your decisions now',
                      Mars: 'Action and courage define this period — take bold steps',
                      Mercury: 'Your intellect is sharp — learning, communication, and deals flourish',
                      Jupiter: 'Expansion and wisdom — the universe opens doors for growth',
                      Venus: 'Love, beauty, and comfort surround you — enjoy the finer things',
                      Saturn: 'Discipline builds lasting foundations — patience pays off big',
                      Rahu: 'Unconventional opportunities appear — embrace the unexpected',
                      Ketu: 'Spiritual awakening — let go of what no longer serves you',
                    }
                    title = `${planet} Dasha Period — Active Now`
                    detail = DASHA_MEANINGS[planet] || `Current focus: ${dashaMatch[2].split('(')[0]?.trim()}`
                    iconType = 'orbit'
                  } else {
                    title = theme.length > 50 ? theme.slice(0, 47) + '...' : theme
                    detail = 'An important pattern in your birth chart'
                    iconType = i % 2 === 0 ? 'star' : 'compass'
                  }

                  const themeStyles = [
                    { bg: 'from-violet/10 to-transparent', border: 'border-violet/15', dot: 'bg-violet', dotGlow: 'shadow-[0_0_8px_rgba(124,58,237,0.6)]' },
                    { bg: 'from-rose/8 to-transparent', border: 'border-rose/15', dot: 'bg-rose', dotGlow: 'shadow-[0_0_8px_rgba(236,72,153,0.5)]' },
                    { bg: 'from-blue-500/8 to-transparent', border: 'border-blue-500/15', dot: 'bg-blue-400', dotGlow: 'shadow-[0_0_8px_rgba(96,165,250,0.5)]' },
                    { bg: 'from-amber-500/8 to-transparent', border: 'border-amber-500/15', dot: 'bg-amber-400', dotGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]' },
                  ]
                  const s = themeStyles[i] ?? themeStyles[0]

                  const iconSvgs = {
                    star: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
                    sparkle: <SparklesIcon className="h-4 w-4" />,
                    orbit: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
                    compass: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>,
                  }

                  return (
                    <motion.div
                      key={theme}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                      className={`relative overflow-hidden rounded-xl border ${s.border} bg-gradient-to-br ${s.bg} p-3.5 transition-all duration-200 hover:scale-[1.01]`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${s.dot} ${s.dotGlow}`} />
                        <div className="min-w-0">
                          <p className="font-display text-[13px] leading-snug text-star">
                            {title}
                          </p>
                          {detail && (
                            <p className="mt-0.5 text-[11px] leading-snug text-muted">
                              {detail}
                            </p>
                          )}
                        </div>
                        <div className="ml-auto shrink-0 text-white/15">
                          {iconSvgs[iconType]}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Section 4: Explore More ──────────────────────── */}
          <motion.div variants={fadeUp}>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Explore More
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPLORE_LINKS.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex cursor-pointer items-center gap-2 rounded-xl border border-violet/10 bg-violet/[0.04] px-3 py-2.5 transition-all duration-200 hover:border-violet/25 hover:bg-violet/[0.08]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-violet-light/70 transition-colors duration-200 group-hover:text-violet-light" />
                  <span className="text-[11px] font-medium leading-tight text-star/70 transition-colors duration-200 group-hover:text-star/90">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
