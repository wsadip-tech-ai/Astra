'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const PROMPTS = [
  { label: "How's my career this week?", icon: '\uD83D\uDCBC' },
  { label: 'When\'s my next lucky period?', icon: '\uD83C\uDF1F' },
  { label: 'Tell me about my relationships', icon: '\uD83D\uDC9C' },
  { label: 'What should I avoid today?', icon: '\uD83D\uDEE1\uFE0F' },
]

export default function QuickPrompts() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase">
          Ask Astra
        </p>
        <Link
          href="/chat"
          className="text-violet-light text-xs hover:text-violet transition-colors"
        >
          Open chat &rarr;
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((prompt, i) => (
          <motion.div
            key={prompt.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
          >
            <Link
              href={`/chat?prompt=${encodeURIComponent(prompt.label)}`}
              className="group inline-flex items-center gap-1.5 bg-cosmos border border-violet/20 rounded-full px-4 py-2 text-sm text-star/80 hover:border-violet/40 hover:bg-violet/5 hover:text-star transition-all"
            >
              <span className="text-xs">{prompt.icon}</span>
              <span className="group-hover:translate-x-0.5 transition-transform">
                {prompt.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
