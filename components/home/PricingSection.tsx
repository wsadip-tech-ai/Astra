// components/home/PricingSection.tsx
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

export default function PricingSection() {
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
          <PlanCard
            name="Premium"
            price="$9.99"
            period="/month"
            description="The complete Astra experience — unlimited and deeply personal."
            features={PREMIUM_FEATURES}
            ctaText="Start Premium"
            ctaHref="/signup?plan=premium"
            highlighted
          />
        </div>
      </div>
    </section>
  )
}
