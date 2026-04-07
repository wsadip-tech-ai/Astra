'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  reading: string
  dateFormatted: string
}

function getFirstTwoSentences(text: string): { preview: string; hasMore: boolean } {
  // Split by sentence-ending punctuation followed by space or end
  const sentences = text.match(/[^.!?]*[.!?]+/g)
  if (!sentences || sentences.length <= 2) {
    return { preview: text, hasMore: false }
  }
  return {
    preview: sentences.slice(0, 2).join('').trim(),
    hasMore: true,
  }
}

export default function ExpandableReading({ reading, dateFormatted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { preview, hasMore } = getFirstTwoSentences(reading)

  return (
    <div className="bg-cosmos border border-violet/20 rounded-2xl p-8 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-violet-light text-xs font-semibold tracking-widest uppercase">Today&apos;s Reading</span>
        <span className="text-muted text-xs">&middot; {dateFormatted}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={expanded ? 'full' : 'preview'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-star text-lg leading-relaxed font-display italic">
            &ldquo;{expanded ? reading : preview}&rdquo;
          </p>
        </motion.div>
      </AnimatePresence>

      {hasMore && (
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-violet-light text-sm font-medium hover:text-violet transition-colors group flex items-center gap-1.5"
          whileTap={{ scale: 0.97 }}
        >
          {expanded ? 'Show less' : 'Read full horoscope'}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="inline-block text-xs"
          >
            {'\u2193'}
          </motion.span>
        </motion.button>
      )}
    </div>
  )
}
