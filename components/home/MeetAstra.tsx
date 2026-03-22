// components/home/MeetAstra.tsx
'use client'
import { motion } from 'framer-motion'
import GlowButton from '@/components/ui/GlowButton'

export default function MeetAstra() {
  return (
    <section className="py-24 px-6 bg-void relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1)_0%,transparent_70%)]" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Astra avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-violet/40 to-rose/30 rounded-full blur-2xl" />
              <div className="relative w-64 h-64 rounded-full border border-violet/30 bg-gradient-to-b from-nebula to-cosmos flex items-center justify-center">
                <span className="text-8xl">🌙</span>
              </div>
              {/* Orbiting planet */}
              <motion.div
                className="absolute top-4 -right-4 w-10 h-10 bg-rose/30 rounded-full border border-rose/50 flex items-center justify-center text-xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '-80px 100px' }}
              >
                ✦
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Meet Your Astrologer</p>
            <h2 className="font-display text-4xl md:text-5xl text-star mb-6">
              Astra knows<br />your chart by heart
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Astra has spent 30 years (in AI time) studying the stars. She speaks with warmth, wisdom, and genuine depth — drawing on both Western astrology and Vedic Jyotish traditions.
            </p>
            <p className="text-muted leading-relaxed mb-8">
              She remembers your chart, asks the right questions, and never gives generic answers. Every reading is grounded in your specific planetary positions.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {['Western Astrology', 'Vedic Jyotish', 'Voice & Text', 'Available 24/7'].map(tag => (
                <span key={tag} className="bg-violet/10 border border-violet/20 text-violet-light text-xs px-3 py-1.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <GlowButton href="/signup" variant="primary">
              Talk to Astra →
            </GlowButton>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
