// components/home/Hero.tsx
'use client'
import { motion } from 'framer-motion'
import StarField from '@/components/ui/StarField'
import GlowButton from '@/components/ui/GlowButton'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cosmic-gradient">
      <StarField />
      {/* Nebula glow */}
      <div className="absolute inset-0 bg-violet-glow pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-violet/10 border border-violet/30 rounded-full px-4 py-1.5 text-violet-light text-xs font-semibold tracking-widest uppercase mb-8">
            ✦ AI-Powered Astrology
          </div>

          <h1 className="font-display text-5xl md:text-7xl text-star leading-tight mb-6">
            Your personal<br />
            <span className="bg-gradient-to-r from-violet-light via-rose-light to-violet-light bg-clip-text text-transparent">
              cosmic guide
            </span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Talk to Astra — an AI astrologer with deep knowledge of Western and Vedic traditions.
            Get your birth chart read, daily insights, and answers to life's big questions.
            Available 24/7. By voice or text.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GlowButton href="/signup" variant="primary" className="text-base px-8 py-4">
              Get Your Free Chart ✨
            </GlowButton>
            <GlowButton href="/astrologer" variant="secondary" className="text-base px-8 py-4">
              🎙️ Hear Astra
            </GlowButton>
          </div>
        </motion.div>

        {/* Floating planet orbs */}
        <motion.div
          className="absolute top-20 -left-10 w-40 h-40 bg-violet/20 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 -right-10 w-56 h-56 bg-rose/15 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <span className="text-lg">↓</span>
        </div>
      </motion.div>
    </section>
  )
}
