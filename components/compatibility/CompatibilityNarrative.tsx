'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface CompatibilityNarrativeProps {
  narrative: string | null
  isPremium: boolean
  loading?: boolean
}

export default function CompatibilityNarrative({
  narrative,
  isPremium,
  loading,
}: CompatibilityNarrativeProps) {
  // Upgrade CTA for free users
  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="max-w-lg mx-auto mb-8"
      >
        <div className="bg-violet/10 border border-violet/30 rounded-xl p-5 text-center">
          <p className="text-star text-sm font-medium mb-1">
            Unlock Astra&apos;s Vedic Reading
          </p>
          <p className="text-muted text-xs mb-4">
            Get a personalized AI interpretation of your Vedic compatibility, including detailed guidance on each Koota and Dosha.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-gradient-to-r from-violet to-rose text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:shadow-lg hover:shadow-violet/30 transition-all"
          >
            Upgrade to Premium
          </Link>
        </div>
      </motion.div>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-lg mx-auto mb-8">
        <div className="bg-nebula border border-violet/20 rounded-2xl p-6">
          <div className="h-3 w-40 bg-white/5 rounded mb-4 animate-pulse" />
          <div className="space-y-2.5">
            <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-11/12 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-9/12 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // Narrative display
  if (!narrative) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="max-w-lg mx-auto mb-8"
    >
      <div className="bg-nebula border border-violet/20 rounded-2xl p-6">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">
          Astra&apos;s Vedic Reading
        </p>
        <p className="text-star text-sm leading-relaxed whitespace-pre-line">{narrative}</p>
      </div>
    </motion.div>
  )
}
