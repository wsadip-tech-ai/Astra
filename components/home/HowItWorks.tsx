// components/home/HowItWorks.tsx
'use client'
import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: '📍',
    title: 'Enter your birth details',
    description: 'Your date, time, and place of birth. This is the foundation of your unique cosmic blueprint.',
  },
  {
    number: '02',
    icon: '🔮',
    title: 'Get your chart analysed',
    description: 'Astra calculates your natal chart using precise planetary positions — both Western and Vedic systems.',
  },
  {
    number: '03',
    icon: '🎙️',
    title: 'Ask anything, by voice or text',
    description: 'Speak with Astra as you would a real astrologer. Ask about love, career, timing, remedies — anything.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-cosmos">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="font-display text-4xl md:text-5xl text-star">
            Simple as stargazing
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative bg-nebula/50 border border-white/5 rounded-2xl p-8"
            >
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="absolute top-6 right-6 font-display text-4xl text-white/5 font-bold select-none">
                {step.number}
              </div>
              <h3 className="font-display text-xl text-star mb-3">{step.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
