'use client'

import { useState } from 'react'
import PlanCard from '@/components/ui/PlanCard'

const FREE_FEATURES = [
  { text: 'Western birth chart', included: true },
  { text: '3 AI chat messages per day', included: true },
  { text: 'Daily horoscopes (all signs)', included: true },
  { text: '1 voice session per week', included: true },
  { text: 'Basic compatibility score', included: true },
  { text: 'Vedic / Jyotish chart', included: false },
  { text: 'Unlimited AI chat', included: false },
  { text: 'Transit & yearly forecasts', included: false },
]

const PREMIUM_FEATURES = [
  { text: 'Everything in Free', included: true },
  { text: 'Vedic / Jyotish chart + Kundali', included: true },
  { text: 'Unlimited AI chat with Astra', included: true },
  { text: 'Unlimited voice sessions', included: true },
  { text: 'Full compatibility + Kundali Milan', included: true },
  { text: 'Transit forecasts', included: true },
  { text: 'Yearly predictions', included: true },
  { text: 'Priority response speed', included: true },
]

interface PricingSectionProps {
  isLoggedIn?: boolean
  isPremium?: boolean
}

export default function PricingSection({ isLoggedIn = false, isPremium = false }: PricingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(null)
    }
  }

  return (
    <section className="py-24 px-6 bg-cosmos" id="pricing">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl text-star mb-4">
            Start free, upgrade when ready
          </h2>
          <p className="text-muted">No credit card required for the free plan.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <PlanCard
            name="Free"
            price="$0"
            description="Everything you need to explore your cosmic blueprint."
            features={FREE_FEATURES}
            ctaText="Get started free"
            ctaHref="/signup"
          />
          {isPremium ? (
            <PlanCard
              name="Premium"
              price="$9.99"
              period="/month"
              description="The complete Astra experience — unlimited and deeply personal."
              features={PREMIUM_FEATURES}
              ctaText={loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
              ctaHref="#"
              ctaOnClick={handlePortal}
              highlighted
            />
          ) : (
            <PlanCard
              name="Premium"
              price="$9.99"
              period="/month"
              description="The complete Astra experience — unlimited and deeply personal."
              features={PREMIUM_FEATURES}
              ctaText={loading ? 'Loading...' : 'Start Premium'}
              ctaHref={isLoggedIn ? '#' : '/signup?plan=premium'}
              ctaOnClick={isLoggedIn ? () => handleCheckout('monthly') : undefined}
              highlighted
            />
          )}
        </div>
        {isLoggedIn && !isPremium && (
          <div className="text-center mt-6">
            <button
              onClick={() => handleCheckout('yearly')}
              disabled={loading === 'yearly'}
              className="text-violet-light text-sm hover:text-violet transition-colors"
            >
              {loading === 'yearly' ? 'Loading...' : 'Or save with yearly plan — $79/year'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
